// Testes das regras de inscrição familiar. Rodar: npx tsx --test tests/*.test.ts
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
  textoValor,
  validar,
  VALORES_VAZIOS,
  type FormValues,
  type Pessoa,
} from "../src/lib/inscricao.ts";
import { evento } from "../src/content/evento.ts";

const ctx = {
  dataReferencia: evento.inicioData,
  hoje: "2026-10-22",
  faixas: evento.faixas,
  maxParticipantes: evento.maxParticipantesPorInscricao,
};

const pessoa = (
  nome: string,
  dataNascimento: string,
  cpf = "",
  transporte: Pessoa["transporte"] = "onibus",
): Pessoa => ({
  nome,
  dataNascimento,
  cpf,
  transporte,
});

const base = (extra: Partial<FormValues> = {}): FormValues => ({
  ...VALORES_VAZIOS,
  responsavel: pessoa("Maria da Silva", "1985-06-15", "529.982.247-25"),
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

test("datas do evento: 5 a 9 de fevereiro de 2027 (sexta a terça)", () => {
  assert.equal(evento.inicioData, "2027-02-05");
  assert.equal(evento.fimData, "2027-02-09");
  const dia = (s: string) => new Date(`${s}T12:00:00Z`).getUTCDay();
  assert.equal(dia(evento.inicioData), 5); // sexta
  assert.equal(dia(evento.fimData), 2); // terça
  assert.match(evento.dataTexto, /^5 a 9 de fevereiro de 2027$/);
});

test("CPF: válidos e inválidos", () => {
  assert.equal(cpfValido("529.982.247-25"), true);
  assert.equal(cpfValido("11144477735"), true);
  assert.equal(cpfValido("529.982.247-26"), false);
  assert.equal(cpfValido("111.111.111-11"), false);
  assert.equal(cpfValido("123"), false);
  assert.equal(cpfValido(""), false);
});

test("idade na data de início (limites de aniversário)", () => {
  const ref = evento.inicioData; // 2027-02-05
  assert.equal(calcularIdade("2022-02-05", ref), 5); // faz 5 no dia do início
  assert.equal(calcularIdade("2022-02-06", ref), 4); // faz 5 um dia depois
  assert.equal(calcularIdade("2017-02-05", ref), 10);
  assert.equal(calcularIdade("2017-02-06", ref), 9);
  assert.equal(calcularIdade("2009-02-05", ref), 18);
  assert.equal(calcularIdade("2009-02-06", ref), 17);
  assert.equal(calcularIdade("2024-02-29", ref), 2); // bissexto
  assert.equal(calcularIdade("2023-02-30", ref), null); // data inexistente
});

test("faixas de valor: 4→gratuito, 5→200, 9→200, 10→400, 60→400", () => {
  const v = (i: number) => faixaPorIdade(i, evento.faixas)?.valor;
  assert.equal(v(0), 0);
  assert.equal(v(4), 0);
  assert.equal(v(5), 200);
  assert.equal(v(9), 200);
  assert.equal(v(10), 400);
  assert.equal(v(60), 400);
});

test("responsável sozinho: sem erros, R$ 400", () => {
  const r = validar(base(), ctx);
  assert.deepEqual(r.erros, {});
  assert.equal(r.participantes.length, 1);
  assert.equal(r.total, 400);
  assert.equal(r.temValorADefinir, false);
});

test("família: casal + filho de 7 + bebê de 2 → 400+400+200+gratuito", () => {
  const r = validar(
    base({
      integrantes: [
        pessoa("Carlos da Silva", "1983-03-10", "111.444.777-35"),
        pessoa("Pedro da Silva", "2019-08-01"),
        pessoa("Ana da Silva", "2024-09-15"),
      ],
    }),
    ctx,
  );
  assert.deepEqual(r.erros, {});
  assert.equal(r.participantes.length, 4);
  assert.deepEqual(
    r.participantes.map((p) => p.valor),
    [400, 400, 200, 0],
  );
  assert.equal(r.total, 1000);
  assert.equal(r.temValorADefinir, false);
});

test("CPF de menor é opcional; de adulto é obrigatório", () => {
  const menor = validar(base({ integrantes: [pessoa("Pedro da Silva", "2019-08-01")] }), ctx);
  assert.deepEqual(menor.erros, {});
  const adulto = validar(base({ integrantes: [pessoa("Carlos da Silva", "1983-03-10")] }), ctx);
  assert.ok(adulto.erros["integrantes.0.cpf"]);
  const invalido = validar(
    base({ integrantes: [pessoa("Pedro da Silva", "2019-08-01", "123.456.789-00")] }),
    ctx,
  );
  assert.ok(invalido.erros["integrantes.0.cpf"]);
});

test("responsável menor de 18 anos é recusado", () => {
  const r = validar(
    base({ responsavel: pessoa("Joana Souza", "2010-01-01", "390.533.447-05") }),
    ctx,
  );
  assert.ok(r.erros["responsavel.dataNascimento"]);
});

test("responsável que não participa: valor só dos integrantes", () => {
  const r = validar(
    base({ responsavelParticipa: false, integrantes: [pessoa("Pedro da Silva", "2019-08-01")] }),
    ctx,
  );
  assert.deepEqual(r.erros, {});
  assert.equal(r.participantes.length, 1);
  assert.equal(r.total, 200);
  const nenhum = validar(base({ responsavelParticipa: false, integrantes: [] }), ctx);
  assert.ok(nenhum.erros.integrantes);
});

test("CPF repetido na mesma inscrição e limite de participantes", () => {
  const dup = validar(
    base({ integrantes: [pessoa("Carlos da Silva", "1983-03-10", "529.982.247-25")] }),
    ctx,
  );
  assert.ok(dup.erros["integrantes.0.cpf"]);
  const muitos = validar(
    base({
      integrantes: Array.from({ length: 10 }, (_, i) => pessoa(`Filho Numero${i}`, "2015-01-01")),
    }),
    ctx,
  );
  assert.ok(muitos.erros.integrantes);
});

test("nascimento no futuro e aceites obrigatórios", () => {
  const r = validar(
    base({
      responsavel: pessoa("Maria da Silva", "2026-12-01", "529.982.247-25"),
      aceiteRegras: false,
      aceitePrivacidade: false,
    }),
    ctx,
  );
  assert.ok(r.erros["responsavel.dataNascimento"]);
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
  assert.equal(higienizarCelula('=HYPERLINK("http://x")'), `'=HYPERLINK("http://x")`);
  assert.equal(higienizarCelula("  Maria   Silva "), "Maria Silva");
});

test("corpo da planilha: um participante por linha, CPF só dígitos, pagamento não confirmado", () => {
  const v = base({ integrantes: [pessoa("Pedro da Silva", "2019-08-01")] });
  const r = validar(v, ctx);
  const c = montarCorpo(v, r, {
    idempotencyKey: "k1",
    familiaId: "F-1",
    enviadoEm: "2026-10-22T00:00:00Z",
    versaoTermos: "t",
  });
  assert.equal(c.statusPagamento, "NÃO CONFIRMADO");
  assert.equal(c.totalParticipantes, 2);
  assert.equal(c.totalValor, 600);
  assert.equal(c.participantes[0].cpf, "52998224725");
  assert.equal(c.participantes[1].cpf, "");
  assert.equal(c.participantes[1].menorDeIdade, "SIM");
  assert.equal(c.participantes[1].valor, 200);
});

test("transporte: obrigatório para quem participa; responsável que não participa dispensa", () => {
  const semEscolha = validar(base({ responsavel: { ...base().responsavel, transporte: "" } }), ctx);
  assert.ok(semEscolha.erros["responsavel.transporte"]);
  const integranteSem = validar(base({ integrantes: [pessoa("Pedro da Silva", "2019-08-01", "", "")] }), ctx);
  assert.ok(integranteSem.erros["integrantes.0.transporte"]);
  const naoParticipa = validar(
    base({
      responsavelParticipa: false,
      responsavel: { ...base().responsavel, transporte: "" },
      integrantes: [pessoa("Pedro da Silva", "2019-08-01")],
    }),
    ctx,
  );
  assert.deepEqual(naoParticipa.erros, {});
});

test("transporte: ônibus e carro próprio chegam à planilha com rótulo legível", () => {
  const v = base({ integrantes: [pessoa("Pedro da Silva", "2019-08-01", "", "carro")] });
  const r = validar(v, ctx);
  const c = montarCorpo(v, r, { idempotencyKey: "k2", familiaId: "F-2", enviadoEm: "2026-10-25T00:00:00Z", versaoTermos: "t" });
  assert.equal(c.participantes[0].transporte, "Ônibus da organização");
  assert.equal(c.participantes[1].transporte, "Carro próprio");
});

test("textoValor: gratuito, a definir e reais", () => {
  assert.equal(textoValor(0), "Gratuito");
  assert.equal(textoValor(null), "A definir");
  assert.match(textoValor(200), /200,00/);
});

test("menor de 5 anos é gratuito e não gera 'valor a definir'", () => {
  const r = validar(base({ integrantes: [pessoa("Ana da Silva", "2024-09-15")] }), ctx);
  assert.equal(r.participantes[1].valor, 0);
  assert.equal(r.temValorADefinir, false);
  assert.equal(r.total, 400);
});
