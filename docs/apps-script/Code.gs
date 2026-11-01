/**
 * REFERÊNCIA do Apps Script para a INSCRIÇÃO FAMILIAR (site: src/api/sheets.server.ts).
 *
 * O site envia UMA requisição por família (JSON em e.postData.contents) com a lista
 * `participantes`. Este script grava UMA LINHA POR PARTICIPANTE, de forma atômica:
 * ou grava todos, ou não grava nenhum.
 *
 * Respostas JSON:
 *   { ok: true, linhas: N }                 → gravou (ou já havia gravado o mesmo envio)
 *   { ok: false, code: "DUPLICATE" }        → algum CPF já estava inscrito
 *   { ok: false, code: "UNAUTHORIZED" }     → token errado
 *   { ok: false, code: "ERROR", message }   → erro inesperado
 *
 * Implantação: Implantar → Nova implantação → App da Web
 *   Executar como: Eu  |  Quem pode acessar: Qualquer pessoa
 * (o app é público, mas a PLANILHA continua privada: compartilhe-a só com quem for autorizado).
 * Depois de colar este código, crie uma NOVA VERSÃO da implantação (a URL /exec continua a mesma).
 *
 * Antes de substituir o script, mantenha uma cópia recuperável. Colunas novas são acrescentadas no fim;
 * as colunas existentes são preservadas e lidas pelo nome do cabeçalho.
 */
const NOME_ABA = "Inscrições";
const COLUNAS = [
  "enviadoEm", "familiaId", "idempotencyKey", "ordem", "papel", "nome", "dataNascimento",
  "idadeNaDataDoRetiro", "menorDeIdade", "faixa", "valorTexto", "valor", "cpf", "transporte",
  "responsavelNome", "telefone", "whatsapp", "email", "igreja", "cidade",
  "emergenciaNome", "emergenciaTelefone", "necessidades",
  "totalParticipantes", "totalTexto", "temValorADefinir",
  "aceiteRegras", "aceitePrivacidade", "versaoTermos", "statusPagamento", "origem", "statusInterno",
];
const COLUNAS_TEXTO = ["cpf", "telefone", "whatsapp", "emergenciaTelefone", "dataNascimento", "idempotencyKey"];

function saida(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return saida({ ok: true, servico: "inscricoes-retiro" }); // teste de vida, sem dados
}

function lerColuna(aba, nomeColuna) {
  const ultima = aba.getLastRow();
  if (ultima < 2) return [];
  const cab = aba.getRange(1, 1, 1, aba.getLastColumn()).getDisplayValues()[0].map(function (v) { return String(v).trim(); });
  const idx = cab.indexOf(nomeColuna) + 1;
  if (idx < 1) return [];
  return aba.getRange(2, idx, ultima - 1, 1).getDisplayValues().map(function (l) { return String(l[0]); });
}

function garantirColunasInscricao(aba) {
  let cab = aba.getRange(1, 1, 1, Math.max(aba.getLastColumn(), 1)).getDisplayValues()[0].map(function (v) { return String(v).trim(); });
  COLUNAS.forEach(function (nome) {
    if (cab.indexOf(nome) !== -1) return;
    const coluna = aba.getLastColumn() + 1;
    aba.getRange(1, coluna).setValue(nome).setFontWeight("bold");
    if (COLUNAS_TEXTO.indexOf(nome) !== -1) aba.getRange(1, coluna, aba.getMaxRows(), 1).setNumberFormat("@");
    cab.push(nome);
  });
}

function classificacaoInterna(p) {
  const papel = String(p.papel || "").toLowerCase();
  const faixa = String(p.faixa || "").toLowerCase();
  const valorTexto = String(p.valorTexto || "").toLowerCase();
  const idadeTexto = String(p.idadeNaDataDoRetiro == null ? "" : p.idadeNaDataDoRetiro).trim();
  const idade = idadeTexto === "" ? null : Number(idadeTexto);
  const valor = Number(String(p.valor == null ? "" : p.valor).replace(",", ".")) || 0;
  if (papel.indexOf("visitante") !== -1 || faixa.indexOf("visitante") !== -1) return "VISITANTE";
  if (valorTexto.indexOf("equipe apoio") !== -1 || valorTexto.indexOf("apoio") !== -1) return "APOIO (NÃO PAGANTE)";
  if (valorTexto.indexOf("organizador") !== -1) return "ORGANIZADOR (PAGA MEIA)";
  if (idade !== null && idade < 5 && (valor === 0 || valorTexto.indexOf("gratuito") === 0)) return "NÃO PAGANTE (CRIANÇAS DE 0 A 4)";
  if (valor > 0 && valor <= 200) return "PARTICIPANTE MEIA";
  return "PARTICIPANTE INTEIRA";
}

function normalizarCpf(valor) {
  var digitos = String(valor == null ? "" : valor).replace(/\D/g, "");
  // Assegura comparação correta para CPFs antigos que perderam o zero inicial.
  return digitos.length >= 10 && digitos.length <= 11 ? digitos.padStart(11, "0") : "";
}

function doPost(e) {
  const trava = LockService.getScriptLock();
  try {
    trava.waitLock(20000);
    const d = JSON.parse(e.postData.contents);
    if (d && typeof d.acao === "string" && d.acao.indexOf("adm.") === 0) return admRotear(d);

    const token = PropertiesService.getScriptProperties().getProperty("TOKEN");
    if (token && d.token !== token) return saida({ ok: false, code: "UNAUTHORIZED" });
    if (!d.participantes || !d.participantes.length) return saida({ ok: false, code: "ERROR", message: "sem participantes" });

    const planilha = SpreadsheetApp.getActiveSpreadsheet(); // script vinculado à planilha
    const aba = planilha.getSheetByName(NOME_ABA) || planilha.insertSheet(NOME_ABA);
    if (aba.getLastRow() === 0) {
      aba.appendRow(COLUNAS);
      aba.setFrozenRows(1);
      aba.getRange(1, 1, 1, COLUNAS.length).setFontWeight("bold");
      COLUNAS_TEXTO.forEach(function (c) {
        aba.getRange(1, COLUNAS.indexOf(c) + 1, aba.getMaxRows(), 1).setNumberFormat("@");
      });
    }
    garantirColunasInscricao(aba);

    // Reenvio do mesmo formulário (ex.: resposta perdida): já está gravado → sucesso.
    if (lerColuna(aba, "idempotencyKey").indexOf(String(d.idempotencyKey)) !== -1) {
      return saida({ ok: true, linhas: 0, jaRegistrada: true });
    }

    // CPF de participante não pode repetir dentro do envio nem na planilha.
    // O lock acima mantém esta verificação atômica entre envios simultâneos.
    const existentes = lerColuna(aba, "cpf").map(normalizarCpf).filter(Boolean);
    const recebidos = [];
    for (var i = 0; i < d.participantes.length; i++) {
      var cpf = normalizarCpf(d.participantes[i].cpf);
      if (!cpf) continue; // CPF é opcional para menores sem documento.
      if (recebidos.indexOf(cpf) !== -1 || existentes.indexOf(cpf) !== -1) {
        return saida({ ok: false, code: "DUPLICATE" });
      }
      recebidos.push(cpf);
    }

    const linhas = d.participantes.map(function (p) {
      const todos = Object.assign({}, d, p); // dados da família + dados do participante
      const cab = aba.getRange(1, 1, 1, aba.getLastColumn()).getDisplayValues()[0].map(function (v) { return String(v).trim(); });
      return cab.map(function (c) {
        if (c === "statusInterno") return classificacaoInterna(p);
        if (c === "acesso_sistema") return "";
        const v = c === "nome" ? p.nome : c === "papel" ? p.papel : todos[c]; // transporte e demais vêm de `p`/`d`
        return v === undefined || v === null ? "" : v;
      });
    });
    aba.getRange(aba.getLastRow() + 1, 1, linhas.length, aba.getLastColumn()).setValues(linhas); // tudo de uma vez
    return saida({ ok: true, linhas: linhas.length });
  } catch (erro) {
    return saida({ ok: false, code: "ERROR", message: String(erro) });
  } finally {
    trava.releaseLock();
  }
}

const ADM_ABAS = {
  "Pagamentos": ["id", "data", "familiaId", "valor", "forma", "obs", "lancadoPor", "lancadoEm"],
  "Despesas": ["id", "data", "categoria", "fornecedor", "descricao", "orcado", "pago", "status", "lancadoPor", "atualizadoEm"],
  "Doações": ["id", "data", "doador", "valor", "tipo", "obs", "lancadoPor"],
  "Ajustes": ["id", "data", "familiaId", "tipo", "descricao", "valor", "lancadoPor"],
  "Extras": ["pessoaId", "tamanho", "modelo", "atualizadoPor", "atualizadoEm"],
  "Histórico": ["quando", "usuario", "acao", "detalhe"],
};
const ADM_TEXTO = ["id", "familiaId", "pessoaId", "data"];
const ADM_ESCRITA = ["Pagamentos", "Despesas", "Doações", "Ajustes"]; // abas que o /adm pode acrescentar
const ADM_MAX_ERROS = 5;
const ADM_BLOQUEIO_S = 900;

/** Rode UMA vez no editor: cria as abas do sistema e a coluna acesso_sistema. Pode repetir sem risco. */
function admValidarAba(aba, esperado) {
  if (!aba) throw new Error("Aba não encontrada.");
  if (aba.getLastRow() === 0) throw new Error("Aba " + aba.getName() + " sem cabeçalho. Execute prepararPlanilha.");
  const recebido = aba.getRange(1, 1, 1, Math.max(aba.getLastColumn(), 1)).getDisplayValues()[0].map(function (v) { return String(v).trim(); });
  while (recebido.length && recebido[recebido.length - 1] === "") recebido.pop();
  if (recebido.length !== esperado.length || esperado.some(function (c, i) { return recebido[i] !== c; }))
    throw new Error("Cabeçalho incompatível na aba " + aba.getName() + ". Nenhum dado foi gravado; confira as colunas.");
}

function prepararPlanilha() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(ADM_ABAS).forEach(function (nome) {
    const cols = ADM_ABAS[nome];
    let aba = planilha.getSheetByName(nome);
    if (!aba) aba = planilha.insertSheet(nome);
    if (aba.getLastRow() === 0) {
      aba.appendRow(cols);
      aba.setFrozenRows(1);
      aba.getRange(1, 1, 1, cols.length).setFontWeight("bold");
      cols.forEach(function (c, i) {
        if (ADM_TEXTO.indexOf(c) !== -1) aba.getRange(1, i + 1, aba.getMaxRows(), 1).setNumberFormat("@");
      });
    }
    admValidarAba(aba, cols);
  });
  const insc = planilha.getSheetByName(NOME_ABA);
  if (insc) {
    const cab = insc.getRange(1, 1, 1, Math.max(insc.getLastColumn(), 1)).getDisplayValues()[0].map(function (v) { return String(v).trim(); });
    if (cab.indexOf("acesso_sistema") === -1) {
      const col = insc.getLastColumn() + 1;
      insc.getRange(1, col).setValue("acesso_sistema").setFontWeight("bold");
    }
  }
  if (insc) {
    garantirColunasInscricao(insc);
    const cabIns = insc.getRange(1, 1, 1, insc.getLastColumn()).getDisplayValues()[0].map(function (v) { return String(v).trim(); });
    const iStatus = cabIns.indexOf("statusInterno") + 1;
    if (insc.getLastRow() > 1 && iStatus > 0) {
      const dados = insc.getRange(2, 1, insc.getLastRow() - 1, insc.getLastColumn()).getValues();
      const colunas = {}; cabIns.forEach(function (c, i) { colunas[c] = i; });
      const estados = dados.map(function (l) { const pessoa = {}; Object.keys(colunas).forEach(function (k) { pessoa[k] = l[colunas[k]]; }); return [classificacaoInterna(pessoa)]; });
      insc.getRange(2, iStatus, estados.length, 1).setValues(estados);
    }
  }
  SpreadsheetApp.flush();
}

function admRotear(d) {
  const esperado = PropertiesService.getScriptProperties().getProperty("ADM_TOKEN");
  if (!esperado || d.admToken !== esperado) return saida({ ok: false, code: "UNAUTHORIZED", message: "Token do /adm inválido." });
  switch (d.acao) {
    case "adm.login": return admLogin(d);
    case "adm.ler": return admLer(d);
    case "adm.add": return admAdd(d);
    case "adm.despesaStatus": return admDespesaStatus(d);
    case "adm.extra": return admExtra(d);
    default: return saida({ ok: false, code: "ERROR", message: "Ação desconhecida." });
  }
}

function admHistorico(usuario, acao, detalhe) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName("Histórico") || planilha.insertSheet("Histórico");
  if (aba.getLastRow() === 0) aba.appendRow(ADM_ABAS["Histórico"]);
  admValidarAba(aba, ADM_ABAS["Histórico"]);
  aba.appendRow([new Date(), usuario || "", acao, String(detalhe || "").slice(0, 500)]);
}

function admValor(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), "yyyy-MM-dd");
  return v === null || v === undefined ? "" : v;
}

function admObjetos(aba, remover) {
  if (!aba || aba.getLastRow() < 2) return [];
  const dados = aba.getRange(1, 1, aba.getLastRow(), aba.getLastColumn()).getValues();
  const cab = dados[0].map(String);
  const fora = remover || [];
  return dados.slice(1).map(function (linha) {
    const o = {};
    cab.forEach(function (c, i) { if (c && fora.indexOf(c) === -1) o[c] = admValor(linha[i]); });
    return o;
  });
}

function admLogin(d) {
  const email = String(d.email || "").trim().toLowerCase();
  const senha = String(d.senha || "").replace(/\D/g, "");
  const cache = CacheService.getScriptCache();
  const chaveErros = "adm-erros:" + email;
  const erros = Number(cache.get(chaveErros) || 0);
  if (erros >= ADM_MAX_ERROS) {
    admHistorico(email, "login-bloqueado", "");
    return saida({ ok: false, code: "BLOQUEADO" });
  }
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const insc = planilha.getSheetByName(NOME_ABA);
  var achou = null;
  if (insc && insc.getLastRow() > 1 && email && senha.length === 4) {
    const dados = insc.getRange(1, 1, insc.getLastRow(), insc.getLastColumn()).getValues();
    const cab = dados[0].map(String);
    const iAcesso = cab.indexOf("acesso_sistema"), iEmail = cab.indexOf("email"), iCpf = cab.indexOf("cpf"), iNome = cab.indexOf("nome");
    if (iAcesso !== -1 && iEmail !== -1 && iCpf !== -1) {
      for (var i = 1; i < dados.length && !achou; i++) {
        const l = dados[i];
        if (String(l[iAcesso]).trim().toLowerCase() !== "sim") continue;
        if (String(l[iEmail]).trim().toLowerCase() !== email) continue;
        if (String(l[iCpf]).replace(/\D/g, "").indexOf(senha) === 0) achou = String(l[iNome]).trim() || email;
      }
    }
  }
  if (!achou) {
    cache.put(chaveErros, String(erros + 1), ADM_BLOQUEIO_S);
    admHistorico(email, "login-falhou", "tentativa " + (erros + 1));
    return saida({ ok: false, code: "CREDENCIAIS" });
  }
  cache.remove(chaveErros);
  admHistorico(email, "login", achou);
  return saida({ ok: true, nome: achou });
}

function admLer(d) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(ADM_ABAS).forEach(function (nome) { admValidarAba(planilha.getSheetByName(nome), ADM_ABAS[nome]); });
  const por = function (nome, remover) { return admObjetos(planilha.getSheetByName(nome), remover); };
  return saida({
    ok: true,
    dados: {
      inscricoes: por(NOME_ABA, ["cpf", "acesso_sistema", "idempotencyKey", "emergenciaTelefone"]),
      pagamentos: por("Pagamentos"),
      despesas: por("Despesas"),
      doacoes: por("Doações"),
      ajustes: por("Ajustes"),
      extras: por("Extras"),
    },
  });
}

function admAdd(d) {
  if (ADM_ESCRITA.indexOf(d.aba) === -1) return saida({ ok: false, code: "ERROR", message: "Aba não permitida." });
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName(d.aba);
  if (!aba) return saida({ ok: false, code: "ERROR", message: "Aba " + d.aba + " não existe. Rode prepararPlanilha." });
  const cols = ADM_ABAS[d.aba];
  admValidarAba(aba, cols);
  const v = d.valores || {};
  if (!v.id) return saida({ ok: false, code: "ERROR", message: "sem id" });
  const idCol = cols.indexOf("id") + 1;
  if (aba.getLastRow() > 1) {
    const ids = aba.getRange(2, idCol, aba.getLastRow() - 1, 1).getValues().map(function (l) { return String(l[0]); });
    if (ids.indexOf(String(v.id)) !== -1) return saida({ ok: true, jaExiste: true });
  }
  const todos = Object.assign({}, v, { lancadoPor: d.usuario || "", lancadoEm: new Date() });
  const linha = cols.map(function (c) { const x = todos[c]; return x === undefined || x === null ? "" : x; });
  aba.getRange(aba.getLastRow() + 1, 1, 1, cols.length).setValues([linha]);
  admHistorico(d.usuario, "add:" + d.aba, JSON.stringify({ id: v.id, familiaId: v.familiaId, valor: v.valor }));
  return saida({ ok: true });
}

function admDespesaStatus(d) {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Despesas");
  if (!aba || aba.getLastRow() < 2) return saida({ ok: false, code: "ERROR", message: "Despesa não encontrada." });
  const cols = ADM_ABAS["Despesas"];
  admValidarAba(aba, cols);
  const dados = aba.getRange(2, 1, aba.getLastRow() - 1, cols.length).getValues();
  for (var i = 0; i < dados.length; i++) {
    if (String(dados[i][0]) !== String(d.id)) continue;
    const orcado = Number(dados[i][cols.indexOf("orcado")]) || 0;
    const pago = d.status === "Pago" ? orcado : d.status === "Orçado" ? 0 : Number(dados[i][cols.indexOf("pago")]) || 0;
    const linha = i + 2;
    aba.getRange(linha, cols.indexOf("pago") + 1).setValue(pago);
    aba.getRange(linha, cols.indexOf("status") + 1).setValue(d.status);
    aba.getRange(linha, cols.indexOf("atualizadoEm") + 1).setValue(new Date());
    admHistorico(d.usuario, "despesa-status", d.id + " → " + d.status);
    return saida({ ok: true });
  }
  return saida({ ok: false, code: "ERROR", message: "Despesa não encontrada." });
}

function admExtra(d) {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Extras");
  if (!aba) return saida({ ok: false, code: "ERROR", message: "Aba Extras não existe. Rode prepararPlanilha." });
  const cols = ADM_ABAS["Extras"];
  admValidarAba(aba, cols);
  const nova = [d.pessoaId, d.tamanho, d.modelo || "", d.usuario || "", new Date()];
  if (aba.getLastRow() > 1) {
    const ids = aba.getRange(2, 1, aba.getLastRow() - 1, 1).getValues().map(function (l) { return String(l[0]); });
    const i = ids.indexOf(String(d.pessoaId));
    if (i !== -1) { aba.getRange(i + 2, 1, 1, cols.length).setValues([nova]); admHistorico(d.usuario, "camiseta", d.pessoaId + " " + d.tamanho); return saida({ ok: true }); }
  }
  aba.getRange(aba.getLastRow() + 1, 1, 1, cols.length).setValues([nova]);
  admHistorico(d.usuario, "camiseta", d.pessoaId + " " + d.tamanho);
  return saida({ ok: true });
}
