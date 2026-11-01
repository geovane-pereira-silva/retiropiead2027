import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { test } from "node:test";
import assert from "node:assert/strict";

function criarAppsScript() {
  const linhas: unknown[][] = [];
  const aba = {
    getLastRow: () => linhas.length,
    getLastColumn: () => Math.max(0, ...linhas.map((linha) => linha.length)),
    getMaxRows: () => 1000,
    setFrozenRows: () => undefined,
    appendRow: (linha: unknown[]) => linhas.push([...linha]),
    getRange: (linha: number, coluna: number, quantidade: number, largura = 1) => ({
      getDisplayValues: () =>
        Array.from({ length: quantidade }, (_, i) =>
          Array.from({ length: largura }, (_, j) => String(linhas[linha - 1 + i]?.[coluna - 1 + j] ?? "")),
        ),
      getValues: () =>
        Array.from({ length: quantidade }, (_, i) =>
          Array.from({ length: largura }, (_, j) => linhas[linha - 1 + i]?.[coluna - 1 + j] ?? ""),
        ),
      setNumberFormat: () => undefined,
      setFontWeight: () => undefined,
      setValue: (valor: unknown) => {
        while (linhas.length < linha) linhas.push([]);
        linhas[linha - 1][coluna - 1] = valor;
      },
      setValues: (valores: unknown[][]) => {
        valores.forEach((valor, i) => {
          while (linhas.length < linha + i) linhas.push([]);
          for (let j = 0; j < valor.length; j++) linhas[linha - 1 + i][coluna - 1 + j] = valor[j];
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
      const resposta = (contexto.doPost as (evento: unknown) => { content: string })({
        postData: { contents: JSON.stringify(dados) },
      });
      return JSON.parse(resposta.content) as { ok: boolean; code?: string; linhas?: number };
    },
  };
}

test("Apps Script bloqueia CPF já gravado mesmo com máscara diferente", () => {
  const script = criarAppsScript();
  const base = {
    idempotencyKey: "envio-cpf-unico-001",
    participantes: [{ nome: "Maria", papel: "Participante", idadeNaDataDoRetiro: 26, faixa: "A partir de 10 anos", valor: 400, valorTexto: "R$ 400,00", cpf: "52998224725" }],
  };
  assert.equal(script.enviar(base).ok, true);
  assert.equal(script.linhas.length, 2); // cabeçalho + inscrição
  const cabecalho = script.linhas[0].map(String);
  assert.equal(script.linhas[1][cabecalho.indexOf("statusInterno")], "PARTICIPANTE INTEIRA");

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

test("Apps Script grava categorias internas sem expô-las no cadastro público", () => {
  const script = criarAppsScript();
  const resposta = script.enviar({
    idempotencyKey: "status-interno-001",
    participantes: [
      { nome: "Organizadora", papel: "Participante", idadeNaDataDoRetiro: 30, faixa: "A partir de 10 anos", valor: 200, valorTexto: "Organizador — R$ 200,00" },
      { nome: "Apoio", papel: "Participante", idadeNaDataDoRetiro: 22, faixa: "A partir de 10 anos", valor: 0, valorTexto: "Equipe apoio — Não pagante — Gratuito" },
      { nome: "Criança", papel: "Participante", idadeNaDataDoRetiro: 4, faixa: "Menores de 5 anos", valor: 0, valorTexto: "Gratuito" },
      { nome: "Visitante", papel: "Visitante", idadeNaDataDoRetiro: "", faixa: "Visitante — dia todo", valor: 100, valorTexto: "R$ 100,00" },
    ],
  });
  assert.equal(resposta.ok, true);
  const cabecalho = script.linhas[0].map(String);
  const statusColuna = cabecalho.indexOf("statusInterno");
  assert.deepEqual(script.linhas.slice(1).map((linha) => linha[statusColuna]), [
    "ORGANIZADOR (PAGA MEIA)",
    "APOIO (NÃO PAGANTE)",
    "NÃO PAGANTE (CRIANÇAS DE 0 A 4)",
    "VISITANTE",
  ]);
  assert.equal(cabecalho.includes("statusPublico"), false);
});