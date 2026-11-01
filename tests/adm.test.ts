import { test } from "node:test";
import assert from "node:assert/strict";

import { fluxoPrevisto, resumirFamilia, resumirTudo } from "../src/adm/calculos";
import { criarDemo } from "../src/adm/demo";
import type { Base } from "../src/adm/tipos";

const HOJE = "2026-12-10";

function baseMinima(pago: number[]): Base {
  return {
    familias: [{ id: "F1", responsavel: "A", telefone: "", igreja: "", cidade: "", formaPrevista: "Pix" }],
    pessoas: [
      { id: "1", familiaId: "F1", nome: "A", papel: "Responsável", idade: 30, faixa: "10-mais", valor: 400, transporte: "onibus" },
      { id: "2", familiaId: "F1", nome: "B", papel: "Integrante", idade: 3, faixa: "menor-5", valor: 0, transporte: "onibus" },
    ],
    pagamentos: pago.map((valor, i) => ({ id: `p${i}`, familiaId: "F1", data: "2026-11-20", valor, forma: "Pix" as const })),
    despesas: [{ id: "d", categoria: "Transporte", fornecedor: "x", descricao: "x", orcado: 800, pago: 200, status: "Aprovado" }],
    ajustes: [],
    doacoes: [{ id: "o", data: "2026-11-01", doador: "x", valor: 100, tipo: "Avulsa" }],
  };
}

test("situação: pendente, parcial, quitada e estorno", () => {
  assert.equal(resumirFamilia(baseMinima([]).familias[0], baseMinima([]), HOJE).situacao, "pendente");
  assert.equal(resumirFamilia(baseMinima([100]).familias[0], baseMinima([100]), HOJE).situacao, "parcial");
  assert.equal(resumirFamilia(baseMinima([400]).familias[0], baseMinima([400]), HOJE).situacao, "quitado");
  const estornada = baseMinima([400, -400]);
  assert.equal(resumirFamilia(estornada.familias[0], estornada, HOJE).situacao, "pendente");
});

test("parcelas Pix: pago cobre as mais antigas e atraso conta só vencidas", () => {
  const b = baseMinima([100]); // cada parcela = 100
  const r = resumirFamilia(b.familias[0], b, HOJE);
  assert.equal(r.parcelasAbertas.length, 3);
  assert.equal(r.atrasado, 1); // 25/11 coberta pelo pago; só 05/12 venceu e está aberta
  assert.equal(r.proximoVencimento?.data, "2026-12-25");
});

test("totais, saldo e ponto de equilíbrio", () => {
  const b = baseMinima([400]);
  const t = resumirTudo(b, HOJE);
  assert.equal(t.devido, 400);
  assert.equal(t.recebido, 400);
  assert.equal(t.aReceber, 0);
  assert.equal(t.saldoAtual, 400 + 100 - 200);
  assert.equal(t.ticketMedio, 400);
  assert.equal(t.pontoEquilibrio, Math.ceil((800 - 100) / 400));
  assert.equal(t.gratuitas, 1);
});

test("previsão por vencimento soma o que falta", () => {
  const t = resumirTudo(baseMinima([]), HOJE);
  const f = fluxoPrevisto(t, HOJE);
  assert.equal(f.length, 4);
  assert.equal(f.reduce((s, x) => s + x.valor, 0), 400);
  assert.equal(f[0].vencido, true);
  assert.equal(f[3].vencido, false);
});

test("demonstração é coerente: cada pessoa tem família e valores batem com as faixas", () => {
  const d = criarDemo();
  const ids = new Set(d.familias.map((f) => f.id));
  for (const p of d.pessoas) {
    assert.ok(ids.has(p.familiaId));
    assert.equal(p.valor, p.faixa === "menor-5" ? 0 : p.faixa === "5-9" ? 200 : 400);
  }
  const t = resumirTudo(d, HOJE);
  assert.ok(t.devido > 0 && t.recebido > 0 && t.recebido <= t.devido);
});

test("desconto/isenção reduz o devido sem alterar as pessoas", () => {
  const b = baseMinima([]);
  b.ajustes.push({ id: "a", data: "2026-11-02", familiaId: "F1", tipo: "Desconto", descricao: "bolsa", valor: 100 });
  const r = resumirFamilia(b.familias[0], b, HOJE);
  assert.equal(r.devido, 300);
  assert.equal(r.descontos, 100);
  b.ajustes.push({ id: "b", data: "2026-11-02", familiaId: "F1", tipo: "Isenção", descricao: "isento", valor: 300 });
  assert.equal(resumirFamilia(b.familias[0], b, HOJE).situacao, "isento");
});

import { aplicarLocal } from "../src/adm/local";
import { csvInscritos, resumoCamisetas, resumoTransporte } from "../src/adm/relatorios";

test("prévia local aplica operações sem mexer na base original", () => {
  const b = baseMinima([]);
  const n = aplicarLocal(b, { tipo: "pagamento", familiaId: "F1", valor: 100, forma: "Pix", data: "2026-11-02" }, HOJE, "X1");
  assert.equal(b.pagamentos.length, 0);
  assert.equal(n.pagamentos.length, 1);
  const d = aplicarLocal(n, { tipo: "despesa", categoria: "Transporte", fornecedor: "Y", orcado: 50 }, HOJE, "D9");
  const pago = aplicarLocal(d, { tipo: "despesa-status", id: "D9", status: "Pago" }, HOJE, "");
  assert.equal(pago.despesas.find((x) => x.id === "D9")?.pago, 50);
  const cam = aplicarLocal(n, { tipo: "camiseta", pessoaId: "1", tamanho: "M", modelo: "Normal" }, HOJE, "");
  assert.equal(resumoCamisetas(cam).itens[0][0], "Normal · M");
  assert.equal(resumoCamisetas(cam).semTamanho, 1);
  assert.equal(resumoTransporte(cam).onibus, 2);
});

test("CSV protege contra fórmulas e usa ponto e vírgula", () => {
  const b = baseMinima([400]);
  b.pessoas[0].nome = "=CMD()";
  const csv = csvInscritos(b, resumirTudo(b, HOJE));
  assert.ok(csv.includes("'=CMD()"));
  assert.ok(csv.split("\r\n")[0].includes("Família;Pessoa"));
});
