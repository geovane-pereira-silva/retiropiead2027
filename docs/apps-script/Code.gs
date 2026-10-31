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
  return aba.getRange(2, idx, ultima - 1, 1).getDisplayValues().map(function (l) { return String(l[0]); });
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
