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
 * A coluna privada statusOrganizacao substitui papel no mesmo lugar. Na primeira execução,
 * o script renomeia o cabeçalho antigo e classifica os cadastros existentes. Para recalcular
 * explicitamente todas as linhas, execute reclassificarStatusInscricoes no editor.
 * ATENÇÃO: antes de substituir o script ativo, GUARDE uma cópia do código antigo.
 */
const NOME_ABA = "Inscrições";
const COLUNAS = [
  "enviadoEm",
  "familiaId",
  "idempotencyKey",
  "ordem",
  "statusOrganizacao",
  "nome",
  "dataNascimento",
  "idadeNaDataDoRetiro",
  "menorDeIdade",
  "faixa",
  "valorTexto",
  "valor",
  "cpf",
  "transporte",
  "responsavelNome",
  "telefone",
  "whatsapp",
  "email",
  "igreja",
  "cidade",
  "emergenciaNome",
  "emergenciaTelefone",
  "necessidades",
  "totalParticipantes",
  "totalTexto",
  "temValorADefinir",
  "aceiteRegras",
  "aceitePrivacidade",
  "versaoTermos",
  "statusPagamento",
  "origem",
  "familiaresQuarto",
];
const COLUNAS_TEXTO = [
  "cpf",
  "telefone",
  "whatsapp",
  "emergenciaTelefone",
  "dataNascimento",
  "idempotencyKey",
];

function saida(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function doGet() {
  return saida({ ok: true, servico: "inscricoes-retiro" }); // teste de vida, sem dados
}

function lerColuna(aba, nomeColuna) {
  const ultima = aba.getLastRow();
  if (ultima < 2) return [];
  const idx = COLUNAS.indexOf(nomeColuna) + 1;
  return aba
    .getRange(2, idx, ultima - 1, 1)
    .getDisplayValues()
    .map(function (l) {
      return String(l[0]);
    });
}

function normalizarCpf(valor) {
  var digitos = String(valor == null ? "" : valor).replace(/\D/g, "");
  // Assegura comparação correta para CPFs antigos que perderam o zero inicial.
  return digitos.length >= 10 && digitos.length <= 11 ? digitos.padStart(11, "0") : "";
}

function obterCabecalho(aba) {
  const ultimaColuna = aba.getLastColumn();
  return ultimaColuna > 0 ? aba.getRange(1, 1, 1, ultimaColuna).getDisplayValues()[0] : [];
}

function garantirColunaStatus(aba) {
  const cabecalho = obterCabecalho(aba);
  let indice = cabecalho.indexOf("statusOrganizacao");
  if (indice === -1) {
    const papelAntigo = cabecalho.indexOf("papel");
    if (papelAntigo !== -1) {
      indice = papelAntigo;
      aba.getRange(1, indice + 1).setValue("statusOrganizacao");
    } else {
      indice = cabecalho.length;
      aba.getRange(1, indice + 1).setValue("statusOrganizacao");
    }
    aba.getRange(1, indice + 1, aba.getMaxRows(), 1).setNumberFormat("@");
    aba.getRange(1, indice + 1).setFontWeight("bold");
  }
  return indice + 1;
}

function classificarLinha(linha, cabecalho) {
  function campo(nome) {
    const indice = cabecalho.indexOf(nome);
    return indice < 0 ? "" : linha[indice];
  }

  const anterior = String(campo("papel") || campo("statusOrganizacao") || "")
    .trim()
    .toLocaleUpperCase("pt-BR");
  const origem = String(campo("origem") || "").toLocaleUpperCase("pt-BR");
  if (anterior === "VISITANTE" || origem.indexOf("VISITANTE") !== -1) return "VISITANTE";

  const rotulo = (String(campo("faixa") || "") + " " + String(campo("valorTexto") || ""))
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleUpperCase("pt-BR");
  if (rotulo.indexOf("ORGANIZADOR") !== -1) return "ORGANIZADOR (PAGA MEIA)";
  if (rotulo.indexOf("EQUIPE APOIO") !== -1 || rotulo.indexOf("APOIO (NAO PAGANTE)") !== -1)
    return "APOIO (NÃO PAGANTE)";

  const idadeTexto = String(campo("idadeNaDataDoRetiro") || "").trim();
  const idade = idadeTexto === "" ? null : Number(idadeTexto);
  if ((idade !== null && idade >= 0 && idade <= 4) || rotulo.indexOf("MENORES DE 5 ANOS") !== -1)
    return "NÃO PAGANTE (CRIANÇAS DE 0 A 4)";
  const valorTexto = String(campo("valor") == null ? "" : campo("valor")).trim();
  const valor = Number(campo("valor"));
  const valorBase = idade === null ? null : idade >= 10 ? 400 : idade >= 5 ? 200 : null;
  if (valorBase !== null && valorTexto !== "" && Number.isFinite(valor) && valor < valorBase)
    return "PARTICIPANTE MEIA";
  return "PARTICIPANTE INTEIRA";
}

function statusOrganizacaoValido(valor) {
  return (
    [
      "ORGANIZADOR (PAGA MEIA)",
      "APOIO (NÃO PAGANTE)",
      "NÃO PAGANTE (CRIANÇAS DE 0 A 4)",
      "PARTICIPANTE INTEIRA",
      "PARTICIPANTE MEIA",
      "VISITANTE",
    ].indexOf(String(valor || "")) !== -1
  );
}

function preencherStatusInscricoes(aba, recalcularTudo) {
  const colunaStatus = garantirColunaStatus(aba);
  const ultimaLinha = aba.getLastRow();
  if (ultimaLinha < 2) return 0;
  const cabecalho = obterCabecalho(aba);
  const dados = aba.getRange(2, 1, ultimaLinha - 1, cabecalho.length).getValues();
  let alteradas = 0;
  const valores = dados.map(function (linha) {
    const atual = String(linha[colunaStatus - 1] || "");
    if (statusOrganizacaoValido(atual) && !recalcularTudo) return [atual];
    alteradas++;
    return [classificarLinha(linha, cabecalho)];
  });
  if (alteradas) aba.getRange(2, colunaStatus, valores.length, 1).setValues(valores);
  return alteradas;
}

/** Atualiza também os cadastros antigos, incluindo os já marcados como Participante. */
function reclassificarStatusInscricoes() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName(NOME_ABA);
  if (!aba) throw new Error("A aba Inscrições não foi encontrada.");
  return preencherStatusInscricoes(aba, true);
}

function garantirColunaFamiliaresQuarto(aba) {
  const ultimaColuna = aba.getLastColumn();
  if (ultimaColuna === 0) return;
  const cabecalho = aba.getRange(1, 1, 1, ultimaColuna).getDisplayValues()[0];
  if (cabecalho.indexOf("familiaresQuarto") !== -1) return;
  const novaColuna = ultimaColuna + 1;
  aba.getRange(1, novaColuna).setValue("familiaresQuarto");
  aba.getRange(1, novaColuna, aba.getMaxRows(), 1).setNumberFormat("@");
  aba.getRange(1, novaColuna).setFontWeight("bold");
}

function necessidadesSemFamiliares(texto, familiaresQuarto) {
  const marcador = `Familiares para organização do quarto: ${String(familiaresQuarto || "")}`;
  return String(texto || "")
    .split("\n")
    .filter(function (linha) {
      return linha !== marcador;
    })
    .join("\n")
    .trim();
}

function doPost(e) {
  const trava = LockService.getScriptLock();
  try {
    trava.waitLock(20000);
    const d = JSON.parse(e.postData.contents);

    const token = PropertiesService.getScriptProperties().getProperty("TOKEN");
    if (token && d.token !== token) return saida({ ok: false, code: "UNAUTHORIZED" });
    if (!d.participantes || !d.participantes.length)
      return saida({ ok: false, code: "ERROR", message: "sem participantes" });

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
    preencherStatusInscricoes(aba, false);
    garantirColunaFamiliaresQuarto(aba);

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
        const v =
          c === "nome"
            ? p.nome
            : c === "statusOrganizacao"
              ? p.statusOrganizacao ||
                (statusOrganizacaoValido(p.papel)
                  ? p.papel
                  : classificarLinha(
                      COLUNAS.map(function (chave) {
                        return todos[chave];
                      }),
                      COLUNAS,
                    ))
              : c === "necessidades"
                ? necessidadesSemFamiliares(todos[c], d.familiaresQuarto)
                : todos[c]; // transporte e demais vêm de `p`/`d`
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
