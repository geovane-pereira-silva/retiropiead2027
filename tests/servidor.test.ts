// Testa o servidor de inscrição contra um MOCK local do Apps Script
// (redirect 302 como no Google). Não fala com a planilha real.
// Rodar: npx tsx --test tests/*.test.ts
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";

import { processarInscricao } from "../src/api/inscricao.server.ts";
import { VALORES_VAZIOS, cpfValido, type FormValues } from "../src/lib/inscricao.ts";

let servidor: http.Server;
let url = "";
let modo: "ok" | "duplicado" | "html" | "lento" | "falha-json" = "ok";
const recebidos: Record<string, unknown>[] = [];

before(async () => {
  servidor = http.createServer((req, res) => {
    if (req.method === "POST" && req.url === "/macros/s/ABC/exec") {
      let corpo = "";
      req.on("data", (c) => (corpo += c));
      req.on("end", () => {
        recebidos.push(JSON.parse(corpo));
        res.writeHead(302, { location: `/echo?m=${modo}` });
        res.end();
      });
      return;
    }
    if (req.url?.startsWith("/echo")) {
      const m = new URL(req.url, "http://x").searchParams.get("m");
      if (m === "lento") return; // nunca responde → timeout
      if (m === "html") {
        res.writeHead(200, { "content-type": "text/html" });
        return void res.end(
          "<html><head><title>Error</title></head><body>Script function not found: doPost</body></html>",
        );
      }
      res.writeHead(200, { "content-type": "application/json" });
      if (m === "duplicado") return void res.end(JSON.stringify({ ok: false, code: "DUPLICATE" }));
      if (m === "falha-json") return void res.end(JSON.stringify({ ok: false, error: "x" }));
      return void res.end(JSON.stringify({ ok: true }));
    }
    res.writeHead(404);
    res.end();
  });
  await new Promise<void>((r) => servidor.listen(0, "127.0.0.1", r));
  url = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}/macros/s/ABC/exec`;
});
after(() => servidor.close());

const valores = (cpf: string, extra: Partial<FormValues> = {}): FormValues => ({
  ...VALORES_VAZIOS,
  nomeCompleto: "Maria da Silva",
  dataNascimento: "1995-06-15",
  cpf,
  telefone: "(35) 99999-1234",
  whatsapp: "(35) 99999-1234",
  igreja: "Primeira Assembleia de Deus",
  cidade: "Santa Rita do Sapucaí",
  emergenciaNome: "José da Silva",
  emergenciaTelefone: "(35) 98888-4321",
  aceiteRegras: true,
  aceitePrivacidade: true,
  ...extra,
});

for (const c of [
  "529.982.247-25",
  "111.444.777-35",
  "390.533.447-05",
  "123.456.789-09",
  "935.411.347-80",
])
  assert.equal(cpfValido(c), true, `CPF de teste inválido: ${c}`);

test("sucesso: grava corpo correto e devolve nome, faixa e valor", async () => {
  modo = "ok";
  recebidos.length = 0;
  const r = await processarInscricao(
    { values: valores("529.982.247-25"), idempotencyKey: "chave-0001-aaaa" },
    { url, token: "segredo" },
  );
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.nome, "Maria da Silva");
    assert.equal(r.valor, 400);
  }
  assert.equal(recebidos.length, 1);
  assert.equal(recebidos[0].cpf, "52998224725");
  assert.equal(recebidos[0].token, "segredo");
  assert.equal(recebidos[0].statusPagamento, "NÃO CONFIRMADO");
  assert.equal(recebidos[0].valor, 400);
});

test("mesmo envio repetido (duplo clique) não grava duas vezes", async () => {
  modo = "ok";
  recebidos.length = 0;
  const entrada = { values: valores("111.444.777-35"), idempotencyKey: "chave-0002-bbbb" };
  const a = await processarInscricao(entrada, { url });
  const b = await processarInscricao(entrada, { url });
  assert.equal(a.ok && b.ok, true);
  assert.equal(recebidos.length, 1);
});

test("mesmo CPF com outra chave logo depois é bloqueado sem ir à planilha", async () => {
  recebidos.length = 0;
  const r = await processarInscricao(
    { values: valores("111.444.777-35"), idempotencyKey: "chave-0003-cccc" },
    { url },
  );
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.codigo, "DUPLICADO");
  assert.equal(recebidos.length, 0);
});

test("planilha responde DUPLICATE → mensagem de duplicidade", async () => {
  modo = "duplicado";
  const r = await processarInscricao(
    { values: valores("390.533.447-05"), idempotencyKey: "chave-0004-dddd" },
    { url },
  );
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.codigo, "DUPLICADO");
});

test("resposta HTML de erro do Apps Script NÃO vira sucesso", async () => {
  modo = "html";
  const r = await processarInscricao(
    { values: valores("123.456.789-09"), idempotencyKey: "chave-0005-eeee" },
    { url },
  );
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.codigo, "NAO_CONFIRMADO");
});

test("recusa explícita em JSON → erro, não sucesso", async () => {
  modo = "falha-json";
  const r = await processarInscricao(
    { values: valores("935.411.347-80"), idempotencyKey: "chave-0006-ffff" },
    { url },
  );
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.codigo, "RECUSADO");
});

test("timeout → não confirmado", async () => {
  modo = "lento";
  const r = await processarInscricao(
    { values: valores("935.411.347-80"), idempotencyKey: "chave-0007-gggg" },
    { url },
    { timeoutMs: 300 },
  );
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.codigo, "NAO_CONFIRMADO");
});

test("dados inválidos nunca chegam à planilha; honeypot e ambiente sem URL", async () => {
  modo = "ok";
  recebidos.length = 0;
  const ruim = await processarInscricao(
    { values: valores("111.111.111-11"), idempotencyKey: "chave-0008-hhhh" },
    { url },
  );
  assert.equal(ruim.ok, false);
  if (!ruim.ok) {
    assert.equal(ruim.codigo, "VALIDACAO");
    assert.ok(ruim.erros?.cpf);
  }
  const robo = await processarInscricao(
    {
      values: valores("529.982.247-25", { website: "http://spam" }),
      idempotencyKey: "chave-0009-iiii",
    },
    { url },
  );
  assert.equal(robo.ok, false);
  const semUrl = await processarInscricao(
    { values: valores("529.982.247-25"), idempotencyKey: "chave-0010-jjjj" },
    {},
  );
  assert.equal(semUrl.ok, false);
  if (!semUrl.ok) assert.equal(semUrl.codigo, "NAO_CONFIGURADO");
  assert.equal(recebidos.length, 0);
});
