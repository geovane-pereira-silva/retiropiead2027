import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { test } from "node:test";
import assert from "node:assert/strict";

function criarAppsScript(iniciais: unknown[][] = []) {
  const linhas: unknown[][] = iniciais.map((linha) => [...linha]);
  const aba = {
    getLastRow: () => linhas.length,
    getLastColumn: () => Math.max(0, ...linhas.map((linha) => linha.length)),
    getMaxRows: () => 1000,
    setFrozenRows: () => undefined,
    appendRow: (linha: unknown[]) => linhas.push(linha),
    getRange: (linha: number, coluna: number, quantidade: number) => ({
      getDisplayValues: () =>
        Array.from({ length: quantidade }, (_, i) => [
          String(linhas[linha - 1 + i]?.[coluna - 1] ?? ""),
        ]),
      setNumberFormat: () => undefined,
      setFontWeight: () => undefined,
      setValue: (valor: unknown) => {
        linhas[linha - 1] ??= [];
        linhas[linha - 1][coluna - 1] = valor;
      },
      setValues: (valores: unknown[][]) => {
        valores.forEach((valor, i) => {
          linhas[linha - 1 + i] = valor;
        });
      },
    }),
  };
  const contexto: Record<string, unknown> = {
    LockService: {
      getScriptLock: () => ({ waitLock: () => undefined, releaseLock: () => undefined }),
    },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => null }) },
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ({ getSheetByName: () => aba, insertSheet: () => aba }),
    },
    ContentService: {
      MimeType: { JSON: "application/json" },
      createTextOutput: (content: string) => ({
        content,
        setMimeType: () => ({ content }),
      }),
    },
  };
  runInNewContext(readFileSync("docs/apps-script/Code.gs", "utf8"), contexto);
  return {
    linhas,
    enviar: (dados: unknown) => {
      const saida = (contexto.doPost as (evento: unknown) => { content: string })({
        postData: { contents: JSON.stringify(dados) },
      });
      return JSON.parse(saida.content) as { ok: boolean; code?: string; linhas?: number };
    },
  };
}

test("Apps Script bloqueia CPF já gravado mesmo com máscara diferente", () => {
  const script = criarAppsScript();
  const base = {
    idempotencyKey: "envio-cpf-unico-001",
    participantes: [{ nome: "Maria", papel: "Participante", cpf: "52998224725" }],
  };
  assert.equal(script.enviar(base).ok, true);
  assert.equal(script.linhas.length, 2); // cabeçalho + inscrição

  const repetida = script.enviar({
    idempotencyKey: "envio-cpf-unico-002",
    participantes: [{ nome: "Maria", papel: "Participante", cpf: "529.982.247-25" }],
  });
  assert.deepEqual(repetida, { ok: false, code: "DUPLICATE" });
  assert.equal(script.linhas.length, 2);
});

test("Apps Script bloqueia CPF repetido no mesmo envio", () => {
  const script = criarAppsScript();
  const resposta = script.enviar({
    idempotencyKey: "envio-cpf-unico-003",
    participantes: [
      { nome: "Maria", papel: "Participante", cpf: "52998224725" },
      { nome: "Maria 2", papel: "Participante", cpf: "529.982.247-25" },
    ],
  });
  assert.deepEqual(resposta, { ok: false, code: "DUPLICATE" });
  assert.equal(script.linhas.length, 1); // apenas o cabeçalho
});

test("Apps Script cria a coluna para os familiares e grava os nomes informados", () => {
  const script = criarAppsScript();
  const resposta = script.enviar({
    idempotencyKey: "quarto-familiar-001",
    familiaresQuarto: "Janaina Silva Furtado",
    necessidades:
      "Restrição alimentar\nFamiliares para organização do quarto: Janaina Silva Furtado",
    participantes: [{ nome: "Maria da Silva", papel: "Participante", cpf: "52998224725" }],
  });
  assert.deepEqual(resposta, { ok: true, linhas: 1 });
  const indice = script.linhas[0].indexOf("familiaresQuarto");
  assert.ok(indice >= 0, "cabeçalho familiar foi acrescentado");
  assert.equal(script.linhas[1][indice], "Janaina Silva Furtado");
  assert.equal(script.linhas[1][script.linhas[0].indexOf("necessidades")], "Restrição alimentar");
});

test("Apps Script acrescenta a nova coluna sem recriar a aba de inscrições existente", () => {
  const cabecalhoAntigo = [
    "enviadoEm",
    "familiaId",
    "idempotencyKey",
    "ordem",
    "papel",
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
  ];
  const linhaAntiga = Array(cabecalhoAntigo.length).fill("");
  linhaAntiga[cabecalhoAntigo.indexOf("nome")] = "Inscrição já existente";
  const script = criarAppsScript([cabecalhoAntigo, linhaAntiga]);

  const resposta = script.enviar({
    idempotencyKey: "quarto-familiar-002",
    familiaresQuarto: "José da Silva",
    necessidades: "Familiares para organização do quarto: José da Silva",
    participantes: [{ nome: "Maria da Silva", papel: "Participante", cpf: "52998224725" }],
  });

  assert.deepEqual(resposta, { ok: true, linhas: 1 });
  assert.equal(script.linhas[1][cabecalhoAntigo.indexOf("nome")], "Inscrição já existente");
  const indice = script.linhas[0].indexOf("familiaresQuarto");
  assert.equal(script.linhas[2][indice], "José da Silva");
});
