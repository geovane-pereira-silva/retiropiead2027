import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { test } from "node:test";
import assert from "node:assert/strict";

const ADM_ABAS: Record<string, string[]> = {
  Pagamentos: ["id", "data", "familiaId", "valor", "forma", "obs", "lancadoPor", "lancadoEm"],
  Despesas: ["id", "data", "categoria", "fornecedor", "descricao", "orcado", "pago", "status", "lancadoPor", "atualizadoEm"],
  "Doações": ["id", "data", "doador", "valor", "tipo", "obs", "lancadoPor"],
  Ajustes: ["id", "data", "familiaId", "tipo", "descricao", "valor", "lancadoPor"],
  Extras: ["pessoaId", "tamanho", "modelo", "atualizadoPor", "atualizadoEm"],
  "Histórico": ["quando", "usuario", "acao", "detalhe"],
};

type Cell = string | number | Date | null | undefined;
function aba(cabecalho: string[], dados: Cell[][] = []) {
  const linhas: Cell[][] = [[...cabecalho], ...dados.map((l) => [...l])];
  return {
    linhas,
    getName: () => String(linhas[0]?.[0] ?? "Aba"),
    getLastRow: () => linhas.length,
    getLastColumn: () => Math.max(0, ...linhas.map((l) => l.length)),
    getMaxRows: () => 1000,
    setFrozenRows: () => undefined,
    appendRow: (row: Cell[]) => { linhas.push([...row]); },
    getRange(row: number, col: number, count: number, width = 1) {
      const ler = (r: number, c: number) => linhas[r - 1]?.[c - 1] ?? "";
      const gravar = (r: number, c: number, value: Cell) => {
        while (linhas.length < r) linhas.push([]);
        while (linhas[r - 1].length < c) linhas[r - 1].push("");
        linhas[r - 1][c - 1] = value;
      };
      return {
        getValues: () => Array.from({ length: count }, (_, r) => Array.from({ length: width }, (_, c) => ler(row + r, col + c))),
        getDisplayValues: () => Array.from({ length: count }, (_, r) => Array.from({ length: width }, (_, c) => String(ler(row + r, col + c) ?? ""))),
        setValues: (values: Cell[][]) => values.forEach((line, r) => line.forEach((value, c) => gravar(row + r, col + c, value))),
        setValue: (value: Cell) => gravar(row, col, value),
        setNumberFormat: () => undefined,
        setFontWeight: () => undefined,
      };
    },
  };
}

function script(testeAcesso = "sim") {
  const headers = ["familiaId", "ordem", "nome", "papel", "cpf", "email", "idadeNaDataDoRetiro", "faixa", "valor", "valorTexto", "transporte", "responsavelNome", "telefone", "igreja", "cidade", "dataNascimento", "emergenciaNome", "emergenciaTelefone", "necessidades", "whatsapp", "acesso_sistema", "statusInterno"];
  const inscricoes = aba(headers, [["F-1", 1, "Ana Souza", "Organizador", "12345678901", "ana@example.com", 30, "A partir de 10 anos", 200, "Organizador — R$ 200,00", "Ônibus", "ANA SOUZA", "(35) 90000-0000", "AD Santa Rita", "Santa Rita", "1996-01-01", "Contato secreto", "99999999", "Informação confidencial", "98888888", testeAcesso, ""]]);
  const abas: Record<string, ReturnType<typeof aba>> = { Inscrições: inscricoes };
  for (const [nome, colunas] of Object.entries(ADM_ABAS)) abas[nome] = aba(colunas);
  abas.Pagamentos = aba(ADM_ABAS.Pagamentos, [["P-1", "2026-11-01", "F-1", 100, "Pix", "", "", ""]]);
  abas.Despesas = aba(ADM_ABAS.Despesas, [["D-1", "2026-11-01", "Transporte", "Viação", "Ônibus", 1000, 0, "Orçado", "", ""]]);

  const cache = new Map<string, string>();
  const contexto: Record<string, unknown> = {
    console,
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k: string) => ({ SPREADSHEET_ID: "planilha-teste", ADM_TOKEN: "token-teste" })[k] ?? "" }) },
    SpreadsheetApp: { openById: () => ({ getSheetByName: (n: string) => abas[n], insertSheet: (n: string) => (abas[n] = aba([])), flush: () => undefined }) },
    ContentService: { MimeType: { JSON: "application/json" }, createTextOutput: (content: string) => ({ content, setMimeType() { return this; } }) },
    LockService: { getScriptLock: () => ({ waitLock: () => undefined, releaseLock: () => undefined }) },
    CacheService: { getScriptCache: () => ({ get: (k: string) => cache.get(k) ?? null, put: (k: string, v: string) => cache.set(k, v), remove: (k: string) => cache.delete(k) }) },
    Session: { getScriptTimeZone: () => "America/Sao_Paulo" },
    Utilities: { formatDate: (d: Date) => d.toISOString().slice(0, 10) },
  };
  const codigo = readFileSync(new URL("../apps-script/Code.gs", import.meta.url), "utf8");
  runInNewContext(codigo, contexto);
  const enviar = (dados: Record<string, unknown>) => {
    const resposta = (contexto.doPost as (e: unknown) => { content: string })({ postData: { contents: JSON.stringify(dados) } });
    return JSON.parse(resposta.content) as Record<string, unknown>;
  };
  return { enviar, abas, inscricoes };
}

test("Apps Script rejeita token ausente ou inválido sem expor planilha", () => {
  const s = script();
  assert.deepEqual(s.enviar({ acao: "adm.ler", admToken: "errado" }), { ok: false, code: "UNAUTHORIZED" });
});

test("login exige acesso ativo, email e primeiros quatro dígitos do CPF", () => {
  const s = script();
  assert.deepEqual(s.enviar({ acao: "adm.login", admToken: "token-teste", email: "ana@example.com", senha: "0000" }), { ok: false, code: "CREDENCIAIS" });
  assert.deepEqual(s.enviar({ acao: "adm.login", admToken: "token-teste", email: "ana@example.com", senha: "1234" }), { ok: true, nome: "Ana Souza" });
  const bloqueado = script("não");
  assert.deepEqual(bloqueado.enviar({ acao: "adm.login", admToken: "token-teste", email: "ana@example.com", senha: "1234" }), { ok: false, code: "CREDENCIAIS" });
});

test("leitura devolve só campos necessários ao painel e calcula a classificação privada", () => {
  const s = script();
  const r = s.enviar({ acao: "adm.ler", admToken: "token-teste" }) as { ok: boolean; dados: { inscricoes: Record<string, unknown>[] } };
  assert.equal(r.ok, true);
  assert.equal(r.dados.inscricoes[0].nome, "Ana Souza");
  assert.equal(r.dados.inscricoes[0].statusInterno, "ORGANIZADOR (PAGA MEIA)");
  for (const campo of ["cpf", "email", "dataNascimento", "emergenciaNome", "emergenciaTelefone", "necessidades", "whatsapp", "acesso_sistema"])
    assert.equal(campo in r.dados.inscricoes[0], false, `${campo} não deve sair do Apps Script`);
  assert.equal(JSON.stringify(r).includes("Informação confidencial"), false);
});

test("pagamentos impedem estorno acima do recebido e aceitam estorno parcial", () => {
  const s = script();
  const base = { acao: "adm.add", admToken: "token-teste", aba: "Pagamentos", valores: { id: "P-2", data: "2026-11-02", familiaId: "F-1", valor: -101, forma: "Pix" } };
  assert.equal(s.enviar(base).code, "INVALIDO");
  assert.equal(s.abas.Pagamentos.linhas.length, 2);
  assert.equal(s.enviar({ ...base, valores: { ...base.valores, valor: -50 } }).ok, true);
  assert.equal(s.abas.Pagamentos.linhas.length, 3);
});

test("ações de despesa e camiseta atualizam as abas administrativas", () => {
  const s = script();
  assert.equal(s.enviar({ acao: "adm.despesaStatus", admToken: "token-teste", id: "D-1", status: "Pago" }).ok, true);
  assert.equal(s.abas.Despesas.linhas[1][6], 1000);
  assert.equal(s.abas.Despesas.linhas[1][7], "Pago");
  assert.equal(s.enviar({ acao: "adm.extra", admToken: "token-teste", pessoaId: "F-1-1", tamanho: "M", modelo: "Normal" }).ok, true);
  assert.equal(s.abas.Extras.linhas[1][0], "F-1-1");
  assert.equal(s.abas.Extras.linhas[1][1], "M");
});
