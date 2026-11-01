import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { test } from "node:test";
import assert from "node:assert/strict";

function criarAppsScript() {
  const linhas: unknown[][] = [];
  const aba = {
    getLastRow: () => linhas.length,
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
