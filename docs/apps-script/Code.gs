/**
 * REFERÊNCIA do doPost que casa com o que o site envia (src/server/sheets.server.ts).
 * NÃO substitua o seu script sem comparar: se o seu já grava na planilha, basta garantir
 * que ele (1) leia JSON de e.postData.contents, (2) bloqueie CPF repetido e
 * (3) responda JSON { ok: true } ou { ok: false, code: "DUPLICATE" }.
 *
 * Implantação: Implantar → Nova implantação → App da Web
 *   Executar como: Eu  |  Quem pode acessar: Qualquer pessoa
 * (o app é público, mas a PLANILHA continua privada: compartilhe-a só com quem for autorizado).
 * Depois de editar o código, crie uma NOVA VERSÃO da implantação.
 */
const NOME_ABA = "Inscrições";
const COLUNAS = [
  "enviadoEm", "nomeCompleto", "dataNascimento", "idadeNaDataDoRetiro", "faixa", "valorTexto", "valor",
  "cpf", "telefone", "whatsapp", "email", "igreja", "cidade",
  "menorDeIdade", "responsavelNome", "responsavelTelefone",
  "emergenciaNome", "emergenciaTelefone", "necessidades",
  "aceiteRegras", "aceitePrivacidade", "versaoTermos", "statusPagamento", "idempotencyKey", "origem",
];
const COLUNAS_TEXTO = ["cpf", "telefone", "whatsapp", "responsavelTelefone", "emergenciaTelefone", "dataNascimento"];

function saida(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return saida({ ok: true, servico: "inscricoes-retiro" }); // teste de vida, sem dados
}

function doPost(e) {
  const trava = LockService.getScriptLock();
  try {
    trava.waitLock(20000);
    const d = JSON.parse(e.postData.contents);

    const token = PropertiesService.getScriptProperties().getProperty("TOKEN");
    if (token && d.token !== token) return saida({ ok: false, code: "UNAUTHORIZED" });

    const planilha = SpreadsheetApp.getActiveSpreadsheet(); // script vinculado à planilha
    let aba = planilha.getSheetByName(NOME_ABA) || planilha.insertSheet(NOME_ABA);
    if (aba.getLastRow() === 0) {
      aba.appendRow(COLUNAS);
      aba.setFrozenRows(1);
      aba.getRange(1, 1, 1, COLUNAS.length).setFontWeight("bold");
      COLUNAS_TEXTO.forEach((c) => aba.getRange(1, COLUNAS.indexOf(c) + 1, aba.getMaxRows(), 1).setNumberFormat("@"));
    }

    const ultima = aba.getLastRow();
    if (ultima > 1) {
      const cpfs = aba.getRange(2, COLUNAS.indexOf("cpf") + 1, ultima - 1, 1).getValues()
        .map((l) => String(l[0]).replace(/\D/g, "").padStart(11, "0"));
      if (cpfs.indexOf(String(d.cpf)) !== -1) return saida({ ok: false, code: "DUPLICATE" });
    }

    aba.appendRow(COLUNAS.map((c) => (d[c] === undefined || d[c] === null ? "" : d[c])));
    return saida({ ok: true });
  } catch (erro) {
    return saida({ ok: false, code: "ERROR", message: String(erro) });
  } finally {
    trava.releaseLock();
  }
}
