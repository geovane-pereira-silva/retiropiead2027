import { test } from "node:test";
import assert from "node:assert/strict";

import { dataISOValida, hojeLocalISO, lerDinheiro, normalizarBusca, ordenarPor } from "../src/adm/utilitarios";

test("valores em reais aceitam entrada brasileira e decimal sem inverter centavos", () => {
  assert.equal(lerDinheiro("R$ 1.234,50"), 1234.5);
  assert.equal(lerDinheiro("1.234"), 1234);
  assert.equal(lerDinheiro("1234.50"), 1234.5);
  assert.equal(lerDinheiro("-R$ 50,00"), -50);
  assert.equal(lerDinheiro(""), 0);
  assert.equal(lerDinheiro("não é valor"), 0);
});

test("busca ignora acentos e ordenação compara números e nomes naturalmente", () => {
  assert.equal(normalizarBusca("  São Benedito  "), "sao benedito");
  assert.deepEqual(ordenarPor(["Família 10", "Família 2", "Família 1"], (x) => x), ["Família 1", "Família 2", "Família 10"]);
  assert.deepEqual(ordenarPor([10, 2, 100], (x) => x, "desc"), [100, 10, 2]);
});

test("datas locais não deslocam o dia e datas impossíveis são recusadas", () => {
  assert.equal(hojeLocalISO(new Date(2026, 10, 1, 23, 30)), "2026-11-01");
  assert.equal(dataISOValida("2027-02-05"), true);
  assert.equal(dataISOValida("2027-02-30"), false);
  assert.equal(dataISOValida("05/02/2027"), false);
});
