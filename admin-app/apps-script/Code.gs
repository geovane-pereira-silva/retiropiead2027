/** Apps Script EXCLUSIVO do painel administrativo. Não substitui o script de inscrições. */
const ADM_ABAS = {
  "Pagamentos": ["id", "data", "familiaId", "valor", "forma", "obs", "lancadoPor", "lancadoEm"],
  "Despesas": ["id", "data", "categoria", "fornecedor", "descricao", "orcado", "pago", "status", "lancadoPor", "atualizadoEm"],
  "Doações": ["id", "data", "doador", "valor", "tipo", "obs", "lancadoPor"],
  "Ajustes": ["id", "data", "familiaId", "tipo", "descricao", "valor", "lancadoPor"],
  "Extras": ["pessoaId", "tamanho", "modelo", "atualizadoPor", "atualizadoEm"],
  "Histórico": ["quando", "usuario", "acao", "detalhe"],
};
const ADM_ESCRITA = ["Pagamentos", "Despesas", "Doações", "Ajustes"];
const ADM_MAX_ERROS = 5;
const ADM_BLOQUEIO_S = 900;
const ADM_COLUNAS_CADASTRO = ["familiaId", "nome", "papel", "cpf", "email", "idadeNaDataDoRetiro", "faixa", "valor", "valorTexto", "transporte", "responsavelNome", "telefone", "igreja", "cidade"];

function admSaida(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function admPlanilha() {
  const id = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (!id) throw new Error("Configure SPREADSHEET_ID nas propriedades deste Apps Script.");
  return SpreadsheetApp.openById(id);
}

function doGet() {
  return admSaida({ ok: true, servico: "retiro2027-admin" });
}

function doPost(e) {
  const trava = LockService.getScriptLock();
  try {
    trava.waitLock(20000);
    const d = JSON.parse(e.postData.contents || "{}");
    const esperado = PropertiesService.getScriptProperties().getProperty("ADM_TOKEN");
    if (!esperado || d.admToken !== esperado) return admSaida({ ok: false, code: "UNAUTHORIZED" });
    switch (d.acao) {
      case "adm.login": return admLogin(d);
      case "adm.ler": return admLer(d);
      case "adm.add": return admAdd(d);
      case "adm.despesaStatus": return admDespesaStatus(d);
      case "adm.extra": return admExtra(d);
      default: return admSaida({ ok: false, code: "ERROR", message: "Ação desconhecida." });
    }
  } catch (erro) {
    console.error(erro);
    return admSaida({ ok: false, code: "ERROR", message: "O Apps Script administrativo não concluiu a operação. Confira a preparação e os cabeçalhos." });
  } finally {
    trava.releaseLock();
  }
}

function admValidarAba(aba, esperado) {
  if (!aba || aba.getLastRow() === 0) throw new Error("Aba ou cabeçalho ausente.");
  const recebido = aba.getRange(1, 1, 1, Math.max(aba.getLastColumn(), 1)).getDisplayValues()[0].map(function (v) { return String(v).trim(); });
  while (recebido.length && recebido[recebido.length - 1] === "") recebido.pop();
  if (recebido.length !== esperado.length || esperado.some(function (c, i) { return recebido[i] !== c; }))
    throw new Error("Cabeçalhos incompatíveis na aba " + aba.getName() + ". Nenhuma gravação foi realizada.");
}

function admGarantirColunasInscricoes(aba) {
  let cab = aba.getRange(1, 1, 1, Math.max(aba.getLastColumn(), 1)).getDisplayValues()[0].map(function (v) { return String(v).trim(); });
  ["acesso_sistema", "statusInterno"].forEach(function (nome) {
    if (cab.indexOf(nome) !== -1) return;
    const col = aba.getLastColumn() + 1;
    aba.getRange(1, col).setValue(nome).setFontWeight("bold");
    cab.push(nome);
  });
  return aba.getRange(1, 1, 1, aba.getLastColumn()).getDisplayValues()[0].map(function (v) { return String(v).trim(); });
}

function admClassificacao(p) {
  const papel = String(p.papel || "").toLowerCase();
  const faixa = String(p.faixa || "").toLowerCase();
  const texto = String(p.valorTexto || "").toLowerCase();
  const idadeTexto = String(p.idadeNaDataDoRetiro == null ? "" : p.idadeNaDataDoRetiro).trim();
  const idade = idadeTexto === "" ? null : Number(idadeTexto);
  const valor = Number(p.valor) || 0;
  if (papel.indexOf("visitante") !== -1 || faixa.indexOf("visitante") !== -1) return "VISITANTE";
  if (texto.indexOf("equipe apoio") !== -1 || texto.indexOf("apoio") !== -1) return "APOIO (NÃO PAGANTE)";
  if (texto.indexOf("organizador") !== -1) return "ORGANIZADOR (PAGA MEIA)";
  if (idade !== null && idade < 5 && (valor === 0 || texto.indexOf("gratuito") === 0)) return "NÃO PAGANTE (CRIANÇAS DE 0 A 4)";
  if (valor > 0 && valor <= 200) return "PARTICIPANTE MEIA";
  return "PARTICIPANTE INTEIRA";
}

/** Rode uma vez no editor do Apps Script administrativo; colunas públicas só recebem 2 campos privados novos. */
function prepararPlanilha() {
  const planilha = admPlanilha();
  Object.keys(ADM_ABAS).forEach(function (nome) {
    const cols = ADM_ABAS[nome];
    let aba = planilha.getSheetByName(nome);
    if (!aba) aba = planilha.insertSheet(nome);
    if (aba.getLastRow() === 0) {
      aba.appendRow(cols);
      aba.setFrozenRows(1);
      aba.getRange(1, 1, 1, cols.length).setFontWeight("bold");
    }
    admValidarAba(aba, cols);
  });
  const inscricoes = planilha.getSheetByName("Inscrições");
  if (!inscricoes || inscricoes.getLastRow() === 0) throw new Error("A aba Inscrições não foi encontrada nesta planilha.");
  const cab = admGarantirColunasInscricoes(inscricoes);
  const mapa = {}; cab.forEach(function (nome, i) { mapa[nome] = i; });
  if (inscricoes.getLastRow() > 1) {
    const dados = inscricoes.getRange(2, 1, inscricoes.getLastRow() - 1, inscricoes.getLastColumn()).getValues();
    const status = dados.map(function (linha) {
      const p = {}; Object.keys(mapa).forEach(function (nome) { p[nome] = linha[mapa[nome]]; });
      return [admClassificacao(p)];
    });
    inscricoes.getRange(2, mapa.statusInterno + 1, status.length, 1).setValues(status);
  }
  SpreadsheetApp.flush();
}

function admHistorico(usuario, acao, detalhe) {
  const aba = admPlanilha().getSheetByName("Histórico");
  admValidarAba(aba, ADM_ABAS["Histórico"]);
  aba.appendRow([new Date(), usuario || "", acao, String(detalhe || "").slice(0, 500)]);
}

function admObjetos(aba, remover) {
  if (!aba || aba.getLastRow() < 2) return [];
  const valores = aba.getRange(1, 1, aba.getLastRow(), aba.getLastColumn()).getValues();
  const cab = valores[0].map(function (v) { return String(v).trim(); });
  const fora = remover || [];
  return valores.slice(1).map(function (linha) {
    const obj = {};
    cab.forEach(function (nome, i) {
      if (nome && fora.indexOf(nome) === -1) obj[nome] = linha[i] instanceof Date
        ? Utilities.formatDate(linha[i], Session.getScriptTimeZone(), "yyyy-MM-dd")
        : linha[i] == null ? "" : linha[i];
    });
    return obj;
  });
}

function admLogin(d) {
  const email = String(d.email || "").trim().toLowerCase();
  const senha = String(d.senha || "").replace(/\D/g, "");
  const cache = CacheService.getScriptCache();
  const chave = "adm-erros:" + email;
  const erros = Number(cache.get(chave) || 0);
  if (erros >= ADM_MAX_ERROS) return admSaida({ ok: false, code: "BLOQUEADO" });
  const aba = admPlanilha().getSheetByName("Inscrições");
  let nome = "";
  if (aba && aba.getLastRow() > 1 && email && senha.length === 4) {
    const valores = aba.getRange(1, 1, aba.getLastRow(), aba.getLastColumn()).getDisplayValues();
    const cab = valores[0].map(function (v) { return String(v).trim(); });
    const ix = { acesso: cab.indexOf("acesso_sistema"), email: cab.indexOf("email"), cpf: cab.indexOf("cpf"), nome: cab.indexOf("nome") };
    if (Object.values(ix).every(function (i) { return i >= 0; })) {
      for (let i = 1; i < valores.length && !nome; i++) {
        const l = valores[i];
        if (String(l[ix.acesso]).trim().toLowerCase() !== "sim") continue;
        if (String(l[ix.email]).trim().toLowerCase() !== email) continue;
        if (String(l[ix.cpf]).replace(/\D/g, "").indexOf(senha) === 0) nome = String(l[ix.nome]).trim() || email;
      }
    }
  }
  if (!nome) {
    cache.put(chave, String(erros + 1), ADM_BLOQUEIO_S);
    admHistorico(email, "login-falhou", "tentativa " + (erros + 1));
    return admSaida({ ok: false, code: "CREDENCIAIS" });
  }
  cache.remove(chave);
  admHistorico(email, "login", nome);
  return admSaida({ ok: true, nome: nome });
}

function admSincronizarStatus(aba, cab) {
  if (aba.getLastRow() < 2) return;
  const ix = {}; cab.forEach(function (nome, i) { ix[nome] = i; });
  const linhas = aba.getRange(2, 1, aba.getLastRow() - 1, aba.getLastColumn()).getValues();
  const status = linhas.map(function (linha) {
    const p = {}; Object.keys(ix).forEach(function (nome) { p[nome] = linha[ix[nome]]; });
    return [admClassificacao(p)];
  });
  aba.getRange(2, ix.statusInterno + 1, status.length, 1).setValues(status);
}

function admLer() {
  const planilha = admPlanilha();
  Object.keys(ADM_ABAS).forEach(function (nome) { admValidarAba(planilha.getSheetByName(nome), ADM_ABAS[nome]); });
  const inscricoes = planilha.getSheetByName("Inscrições");
  if (!inscricoes) throw new Error("A aba Inscrições não existe.");
  const cab = admGarantirColunasInscricoes(inscricoes);
  admSincronizarStatus(inscricoes, cab);
  const por = function (nome, remover) { return admObjetos(planilha.getSheetByName(nome), remover); };
  return admSaida({ ok: true, dados: {
    inscricoes: admObjetos(inscricoes, ["cpf", "acesso_sistema", "idempotencyKey", "emergenciaTelefone"]),
    pagamentos: por("Pagamentos"), despesas: por("Despesas"), doacoes: por("Doações"),
    ajustes: por("Ajustes"), extras: por("Extras"),
  }});
}

function admAdd(d) {
  if (ADM_ESCRITA.indexOf(d.aba) === -1) return admSaida({ ok: false, code: "ERROR", message: "Aba não permitida." });
  const aba = admPlanilha().getSheetByName(d.aba);
  const cols = ADM_ABAS[d.aba];
  admValidarAba(aba, cols);
  const v = d.valores || {};
  if (!v.id) return admSaida({ ok: false, code: "ERROR", message: "Lançamento sem identificador." });
  if (aba.getLastRow() > 1) {
    const ids = aba.getRange(2, 1, aba.getLastRow() - 1, 1).getDisplayValues().map(function (l) { return String(l[0]); });
    if (ids.indexOf(String(v.id)) !== -1) return admSaida({ ok: true, jaExiste: true });
  }
  const todos = Object.assign({}, v, { lancadoPor: d.usuario || "", lancadoEm: new Date() });
  aba.getRange(aba.getLastRow() + 1, 1, 1, cols.length).setValues([cols.map(function (c) { return todos[c] == null ? "" : todos[c]; })]);
  admHistorico(d.usuario, "add:" + d.aba, JSON.stringify({ id: v.id, familiaId: v.familiaId, valor: v.valor }));
  return admSaida({ ok: true });
}

function admDespesaStatus(d) {
  const aba = admPlanilha().getSheetByName("Despesas");
  const cols = ADM_ABAS["Despesas"];
  admValidarAba(aba, cols);
  const dados = aba.getLastRow() > 1 ? aba.getRange(2, 1, aba.getLastRow() - 1, cols.length).getValues() : [];
  for (let i = 0; i < dados.length; i++) {
    if (String(dados[i][0]) !== String(d.id)) continue;
    const pago = d.status === "Pago" ? Number(dados[i][cols.indexOf("orcado")]) || 0 : d.status === "Orçado" ? 0 : Number(dados[i][cols.indexOf("pago")]) || 0;
    aba.getRange(i + 2, cols.indexOf("pago") + 1).setValue(pago);
    aba.getRange(i + 2, cols.indexOf("status") + 1).setValue(d.status);
    aba.getRange(i + 2, cols.indexOf("atualizadoEm") + 1).setValue(new Date());
    admHistorico(d.usuario, "despesa-status", d.id + " → " + d.status);
    return admSaida({ ok: true });
  }
  return admSaida({ ok: false, code: "ERROR", message: "Despesa não encontrada." });
}

function admExtra(d) {
  const aba = admPlanilha().getSheetByName("Extras");
  const cols = ADM_ABAS["Extras"];
  admValidarAba(aba, cols);
  const nova = [d.pessoaId, d.tamanho, d.modelo || "", d.usuario || "", new Date()];
  if (aba.getLastRow() > 1) {
    const ids = aba.getRange(2, 1, aba.getLastRow() - 1, 1).getDisplayValues().map(function (l) { return String(l[0]); });
    const i = ids.indexOf(String(d.pessoaId));
    if (i !== -1) { aba.getRange(i + 2, 1, 1, cols.length).setValues([nova]); admHistorico(d.usuario, "camiseta", d.pessoaId + " " + d.tamanho); return admSaida({ ok: true }); }
  }
  aba.getRange(aba.getLastRow() + 1, 1, 1, cols.length).setValues([nova]);
  admHistorico(d.usuario, "camiseta", d.pessoaId + " " + d.tamanho);
  return admSaida({ ok: true });
}