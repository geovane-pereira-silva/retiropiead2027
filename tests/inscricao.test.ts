// Testes das regras de inscrição. Rodar: npx tsx --test tests/*.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  calcularIdade,
  cpfValido,
  faixaPorIdade,
  formatarCpf,
  formatarTelefone,
  higienizarCelula,
  montarCorpo,
  normalizarTelefone,
  telefoneValido,
  validar,
  VALORES_VAZIOS,
  type FormValues,
} from "../src/lib/inscricao.ts";
import { evento } from "../src/content/evento.ts";

const ctx = { dataReferencia: evento.inicioData, hoje: "2026-10-21", faixas: evento.faixas };

const base = (extra: Partial<FormValues> = {}): FormValues => ({
  ...VALORES_VAZIOS,
  nomeCompleto: "Maria da Silva",
  dataNascimento: "1995-06-15",
  cpf: "529.982.247-25",
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

test("data de início do evento", () => assert.equal(evento.inicioData, "2027-02-12"));

test("CPF: válidos e inválidos", () => {
  assert.equal(cpfValido("529.982.247-25"), true);
  assert.equal(cpfValido("11144477735"), true);
  assert.equal(cpfValido("529.982.247-26"), false);
  assert.equal(cpfValido("111.111.111-11"), false);
  assert.equal(cpfValido("123"), false);
  assert.equal(cpfValido(""), false);
});

test("idade na data de início (limites de aniversário)", () => {
  const ref = "2027-02-12";
  assert.equal(calcularIdade("2022-02-12", ref), 5); // faz 5 no dia do início
  assert.equal(calcularIdade("2022-02-13", ref), 4); // faz 5 um dia depois
  assert.equal(calcularIdade("2017-02-12", ref), 10);
  assert.equal(calcularIdade("2017-02-13", ref), 9);
  assert.equal(calcularIdade("2009-02-12", ref), 18);
  assert.equal(calcularIdade("2009-02-13", ref), 17);
  assert.equal(calcularIdade("2024-02-29", ref), 2); // bissexto
  assert.equal(calcularIdade("2023-02-30", ref), null); // data inexistente
});

test("faixas de valor: 4→a definir, 5→200, 9→200, 10→400, 60→400", () => {
  const v = (i: number) => faixaPorIdade(i, evento.faixas)?.valor;
  assert.equal(v(0), null);
  assert.equal(v(4), null);
  assert.equal(v(5), 200);
  assert.equal(v(9), 200);
  assert.equal(v(10), 400);
  assert.equal(v(60), 400);
});

test("adulto válido: sem erros, R$ 400", () => {
  const r = validar(base(), ctx);
  assert.deepEqual(r.erros, {});
  assert.equal(r.valor, 400);
  assert.equal(r.menorDeIdade, false);
});

test("criança de 7 anos: R$ 200 e exige responsável", () => {
  const r = validar(base({ dataNascimento: "2019-08-01" }), ctx);
  assert.equal(r.idade, 7);
  assert.equal(r.valor, 200);
  assert.equal(r.menorDeIdade, true);
  assert.ok(r.erros.responsavelNome);
  assert.ok(r.erros.responsavelTelefone);
  const ok = validar(
    base({
      dataNascimento: "2019-08-01",
      responsavelNome: "Ana Souza",
      responsavelTelefone: "35977776666",
    }),
    ctx,
  );
  assert.deepEqual(ok.erros, {});
});

test("menor de 5 anos: valor nulo (a definir), sem cobrança automática", () => {
  const r = validar(
    base({
      dataNascimento: "2024-01-10",
      responsavelNome: "Ana Souza",
      responsavelTelefone: "35977776666",
    }),
    ctx,
  );
  assert.equal(r.idade, 3);
  assert.equal(r.valor, null);
  assert.deepEqual(r.erros, {});
});

test("nascimento no futuro e aceites obrigatórios", () => {
  const r = validar(
    base({ dataNascimento: "2026-12-01", aceiteRegras: false, aceitePrivacidade: false }),
    ctx,
  );
  assert.ok(r.erros.dataNascimento);
  assert.ok(r.erros.aceiteRegras);
  assert.ok(r.erros.aceitePrivacidade);
});

test("e-mail é opcional, mas validado quando informado", () => {
  assert.equal(validar(base({ email: "" }), ctx).erros.email, undefined);
  assert.ok(validar(base({ email: "abc" }), ctx).erros.email);
  assert.equal(validar(base({ email: "a@b.com" }), ctx).erros.email, undefined);
});

test("telefones e máscaras", () => {
  assert.equal(telefoneValido("(35) 99999-1234"), true);
  assert.equal(telefoneValido("+55 35 99999-1234"), true);
  assert.equal(telefoneValido("(35) 3333-4444"), true);
  assert.equal(telefoneValido("(35) 89999-1234"), false);
  assert.equal(telefoneValido("(05) 99999-1234"), false);
  assert.equal(normalizarTelefone("+55 (35) 99999-1234"), "35999991234");
  assert.equal(formatarTelefone("35999991234"), "(35) 99999-1234");
  assert.equal(formatarCpf("52998224725"), "529.982.247-25");
});

test("planilha: injeção de fórmula é neutralizada", () => {
  assert.equal(higienizarCelula('=HYPERLINK("http://x")'), '\'=HYPERLINK("http://x")');
  assert.equal(higienizarCelula("  Maria   Silva "), "Maria Silva");
});

test("corpo da planilha: CPF só dígitos, status de pagamento não confirmado", () => {
  const v = base();
  const r = validar(v, ctx);
  const c = montarCorpo(v, r, {
    idempotencyKey: "k1",
    enviadoEm: "2026-10-21T00:00:00Z",
    versaoTermos: "t",
  });
  assert.equal(c.cpf, "52998224725");
  assert.equal(c.valor, 400);
  assert.equal(c.statusPagamento, "NÃO CONFIRMADO");
  assert.equal(c.menorDeIdade, "NÃO");
  assert.equal(c.responsavelNome, "");
});
