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

 * ───────── SISTEMA DE GESTÃO (/adm) ─────────
 * Este mesmo script atende o /adm quando o corpo traz  acao: "adm.*"  e  admToken.
 * Propriedades do script (Configurações do projeto → Propriedades do script):
 *   TOKEN      senha do site público (já existente, opcional)
 *   ADM_TOKEN  senha do /adm (OBRIGATÓRIA para o /adm; igual à variável ADM_TOKEN da Vercel)
 * Primeira vez: escolha a função  prepararPlanilha  no seletor e clique em Executar.
 * Ela cria as abas Pagamentos, Despesas, Doações, Ajustes, Extras e Histórico e a coluna acesso_sistema.
 * Quem entra no /adm: linhas da aba Inscrições com acesso_sistema = sim (login: e-mail do cadastro;
 * senha: 4 primeiros dígitos do CPF da própria linha). CPF nunca sai deste script.
 *
 * ATENÇÃO: antes de substituir o script atual, GUARDE uma cópia do código antigo.
 * Se a aba "Inscrições" já existir com outras colunas, renomeie-a ou mude NOME_ABA abaixo.
 */
const NOME_ABA = "Inscrições";
const COLUNAS = [
  "enviadoEm", "familiaId", "idempotencyKey", "ordem", "papel", "nome", "dataNascimento",
  "idadeNaDataDoRetiro", "menorDeIdade", "faixa", "valorTexto", "valor", "cpf", "transporte",
  "responsavelNome", "telefone", "whatsapp", "email", "igreja", "cidade",
  "emergenciaNome", "emergenciaTelefone", "necessidades",
  "totalParticipantes", "totalTexto", "temValorADefinir",
  "aceiteRegras", "aceitePrivacidade", "versaoTermos", "statusPagamento", "origem",
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
  const idx = COLUNAS.indexOf(nomeColuna) + 1;
  return aba.getRange(2, idx, ultima - 1, 1).getValues().map(function (l) { return String(l[0]); });
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

    // Reenvio do mesmo formulário (ex.: resposta perdida): já está gravado → sucesso.
    if (lerColuna(aba, "idempotencyKey").indexOf(String(d.idempotencyKey)) !== -1) {
      return saida({ ok: true, linhas: 0, jaRegistrada: true });
    }

    // Nenhum CPF informado pode já constar na planilha.
    const existentes = lerColuna(aba, "cpf").map(function (c) { return c.replace(/\D/g, ""); });
    for (var i = 0; i < d.participantes.length; i++) {
      var cpf = String(d.participantes[i].cpf || "").replace(/\D/g, "");
      if (cpf && existentes.indexOf(cpf) !== -1) return saida({ ok: false, code: "DUPLICATE" });
    }

    const linhas = d.participantes.map(function (p) {
      const todos = Object.assign({}, d, p); // dados da família + dados do participante
      return COLUNAS.map(function (c) {
        const v = c === "nome" ? p.nome : c === "papel" ? p.papel : todos[c]; // transporte e demais vêm de `p`/`d`
        return v === undefined || v === null ? "" : v;
      });
    });
    aba.getRange(aba.getLastRow() + 1, 1, linhas.length, COLUNAS.length).setValues(linhas); // tudo de uma vez
    return saida({ ok: true, linhas: linhas.length });
  } catch (erro) {
    return saida({ ok: false, code: "ERROR", message: String(erro) });
  } finally {
    trava.releaseLock();
  }
}


// ═════════════════════════════ SISTEMA DE GESTÃO (/adm) ═════════════════════════════

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
function prepararPlanilha() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(ADM_ABAS).forEach(function (nome) {
    const cols = ADM_ABAS[nome];
    const aba = planilha.getSheetByName(nome) || planilha.insertSheet(nome);
    if (aba.getLastRow() === 0) {
      aba.appendRow(cols);
      aba.setFrozenRows(1);
      aba.getRange(1, 1, 1, cols.length).setFontWeight("bold");
      cols.forEach(function (c, i) {
        if (ADM_TEXTO.indexOf(c) !== -1) aba.getRange(1, i + 1, aba.getMaxRows(), 1).setNumberFormat("@");
      });
    }
  });
  const insc = planilha.getSheetByName(NOME_ABA);
  if (insc) {
    const cab = insc.getRange(1, 1, 1, Math.max(insc.getLastColumn(), 1)).getValues()[0];
    if (cab.indexOf("acesso_sistema") === -1) {
      const col = Math.max(COLUNAS.length, insc.getLastColumn()) + 1;
      insc.getRange(1, col).setValue("acesso_sistema").setFontWeight("bold");
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
