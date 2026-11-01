import { test } from "node:test";
import assert from "node:assert/strict";

import { admDemo, admReal, entrar, carregar, gravar, prepararGravacao } from "../src/api/adm.server";
import { criarToken, lerCookie, lerToken } from "../src/adm/sessao";
import { dataISO, montarBase, numero } from "../src/adm/planilha";

const SEGREDO = "segredo-de-teste-com-mais-de-16";
const amb = { url: "https://exemplo/exec", token: "adm", segredo: SEGREDO, real: true };
const resp = (o: unknown): typeof fetch => (async () => new Response(JSON.stringify(o))) as typeof fetch;

test("sessão: assinada, expira e rejeita adulteração", async () => {
  const t = await criarToken({ nome: "Ana", email: "a@x.com" }, SEGREDO, 1000);
  assert.equal((await lerToken(t, SEGREDO, 2000))?.nome, "Ana");
  assert.equal(await lerToken(t, SEGREDO, 1000 + 9 * 3600_000), null);
  assert.equal(await lerToken(t, "outro-segredo-diferente-123", 2000), null);
  const [corpo, ass] = t.split(".");
  const falso = Buffer.from(JSON.stringify({ nome: "Hacker", email: "h@x.com", exp: 9e15 })).toString("base64url");
  assert.equal(await lerToken(`${falso}.${ass}`, SEGREDO, 2000), null);
  assert.equal(await lerToken(`${corpo}x.${ass}`, SEGREDO, 2000), null);
  await assert.rejects(criarToken({ nome: "A", email: "a@x.com" }, "curto"));
  assert.equal(lerCookie("a=1; adm_sessao=abc.def; b=2"), "abc.def");
});

test("ambientes: gravação real só na produção (ou ADM_REAL=1)", () => {
  assert.equal(admReal({ VERCEL_ENV: "production" }), true);
  assert.equal(admReal({ VERCEL_ENV: "preview" }), false);
  assert.equal(admReal({ VERCEL_ENV: "preview", ADM_REAL: "1" }), true);
  assert.equal(admReal({ VERCEL_ENV: "production", ADM_REAL: "0" }), false);
  assert.equal(admDemo({ VERCEL_ENV: "production" }), false);
  assert.equal(admDemo({ VERCEL_ENV: "preview" }), true);
});

test("login: formato inválido nem chega à planilha; sucesso gera sessão; bloqueio é repassado", async () => {
  let chamadas = 0;
  const contador = (async () => { chamadas++; return new Response("{}"); }) as typeof fetch;
  assert.equal((await entrar(amb, "sem-arroba", "1234", contador)).ok, false);
  assert.equal((await entrar(amb, "a@x.com", "12", contador)).ok, false);
  assert.equal(chamadas, 0);
  const ok = await entrar(amb, "A@X.com", "1234", resp({ ok: true, nome: "Ana" }));
  assert.ok(ok.ok && ok.dados.nome === "Ana" && (await lerToken(ok.dados.token, SEGREDO))?.email === "a@x.com");
  const b = await entrar(amb, "a@x.com", "1234", resp({ ok: false, code: "BLOQUEADO" }));
  assert.ok(!b.ok && b.codigo === "BLOQUEADO");
  const semConfig = await entrar({ ...amb, url: undefined }, "a@x.com", "1234", resp({}));
  assert.ok(!semConfig.ok && semConfig.codigo === "NAO_CONFIGURADO");
});

test("validação das gravações", () => {
  assert.ok("ok" in prepararGravacao({ tipo: "pagamento", familiaId: "F1", valor: 0, forma: "Pix", data: "" }));
  assert.ok("ok" in prepararGravacao({ tipo: "pagamento", familiaId: "F1", valor: 10, forma: "Cheque", data: "" }));
  const p = prepararGravacao({ tipo: "pagamento", familiaId: "F1", valor: 150.5, forma: "Pix", data: "2026-11-02", obs: "=SOMA(A1)" });
  assert.ok(!("ok" in p));
  if (!("ok" in p)) {
    assert.equal(p.acao, "adm.add");
    const v = (p.corpo.valores as Record<string, unknown>);
    assert.equal(v.obs, "'=SOMA(A1)"); // anti-injeção de fórmula
    assert.equal(v.data, "2026-11-02");
    assert.match(String(v.id), /^P-/);
  }
  assert.ok(!("ok" in prepararGravacao({ tipo: "pagamento", familiaId: "F1", valor: -50, forma: "Pix", data: "" }))); // estorno
  assert.ok("ok" in prepararGravacao({ tipo: "despesa", categoria: "Inventada", fornecedor: "x", orcado: 10 }));
  assert.ok("ok" in prepararGravacao({ tipo: "ajuste", familiaId: "F1", ajuste: "Desconto", descricao: "x", valor: 0 }));
  assert.ok(!("ok" in prepararGravacao({ tipo: "ajuste", familiaId: "F1", ajuste: "Observação", descricao: "ligou", valor: 0 })));
});

test("gravar repassa usuário da sessão e erros da planilha", async () => {
  let corpo: Record<string, unknown> = {};
  const f = (async (_u: string, init: RequestInit) => { corpo = JSON.parse(String(init.body)); return new Response(JSON.stringify({ ok: true })); }) as unknown as typeof fetch;
  const r = await gravar(amb, { nome: "Ana", email: "a@x.com", exp: 1 }, { tipo: "doacao", doador: "João", valor: 50, modo: "Avulsa" }, f);
  assert.equal(r.ok, true);
  assert.equal(corpo.usuario, "a@x.com");
  assert.equal(corpo.admToken, "adm");
  const falha = await gravar(amb, { nome: "Ana", email: "a@x.com", exp: 1 }, { tipo: "doacao", doador: "João", valor: 50, modo: "Avulsa" }, resp({ ok: false, code: "ERROR", message: "boom" }));
  assert.ok(!falha.ok);
});

test("montarBase: inscrições, pagamentos, estorno, extras e valores em formato brasileiro", async () => {
  const insc = [
    { familiaId: "F1", ordem: 1, papel: "Organizador", nome: "Ana", idadeNaDataDoRetiro: 30, faixa: "A partir de 10 anos", valor: 400, transporte: "Ônibus", responsavelNome: "Ana", telefone: "(35) 99999-0000", igreja: "AD", cidade: "SR" },
    { familiaId: "F1", ordem: 2, papel: "Integrante", nome: "Bia", idadeNaDataDoRetiro: 3, faixa: "Menores de 5 anos", valor: 0, transporte: "Carro próprio" },
    { familiaId: "", nome: "Sem família" },
  ];
  const b = montarBase({
    inscricoes: insc,
    pagamentos: [
      { id: "P1", familiaId: "F1", data: "2026-11-02T03:00:00.000Z", valor: "R$ 1.234,50", forma: "Pix" },
      { id: "P2", familiaId: "F1", data: "03/11/2026", valor: -34.5, forma: "Pix" },
      { id: "P3", familiaId: "FANTASMA", data: "2026-11-02", valor: 10, forma: "Pix" },
    ],
    despesas: [{ id: "D1", categoria: "Transporte", fornecedor: "V", orcado: "1.000,00", pago: 0, status: "Aprovado" }],
    doacoes: [{ id: "O1", data: "2026-11-02", doador: "X", valor: 20, tipo: "Apadrinhamento de vaga" }],
    ajustes: [{ id: "A1", data: "2026-11-02", familiaId: "F1", tipo: "Desconto", descricao: "d", valor: 50 }],
    extras: [{ pessoaId: "F1-2", tamanho: "4", modelo: "Infantil" }],
  });
  assert.equal(b.familias.length, 1);
  assert.equal(b.pessoas.length, 2);
  assert.equal(b.pessoas[0].faixa, "10-mais");
  assert.equal(b.pessoas[1].transporte, "proprio");
  assert.equal(b.pessoas[1].tamanho, "4");
  assert.equal(b.pagamentos.length, 2); // fantasma descartado
  assert.equal(b.pagamentos[0].valor, 1234.5);
  assert.equal(b.pagamentos[0].data, "2026-11-02");
  assert.equal(b.pagamentos[1].data, "2026-11-03");
  assert.equal(b.despesas[0].orcado, 1000);
  assert.equal(b.doacoes[0].tipo, "Apadrinhamento de vaga");
  assert.equal(numero("1.234,5"), 1234.5);
  assert.equal(dataISO("lixo"), "");
  const c = await carregar(amb, { nome: "A", email: "a@x.com", exp: 1 }, resp({ ok: true, dados: { inscricoes: insc } }));
  assert.ok(c.ok && c.dados.pessoas.length === 2);
});
test("classificação privada preserva status e visitante sem inventar idade", () => {
  const b = montarBase({
    inscricoes: [
      { familiaId: "FO", nome: "Ana", papel: "Participante", idadeNaDataDoRetiro: 30, faixa: "A partir de 10 anos", valor: 200, valorTexto: "Organizador — R$ 200,00", statusInterno: "ORGANIZADOR (PAGA MEIA)" },
      { familiaId: "FA", nome: "Apoio", papel: "Participante", idadeNaDataDoRetiro: 22, valor: 0, valorTexto: "Equipe apoio — Não pagante — Gratuito", statusInterno: "APOIO (NÃO PAGANTE)" },
      { familiaId: "FC", nome: "Criança", papel: "Participante", idadeNaDataDoRetiro: 4, valor: 0, valorTexto: "Gratuito", statusInterno: "NÃO PAGANTE (CRIANÇAS DE 0 A 4)" },
      { familiaId: "FI", nome: "Inteira", papel: "Participante", idadeNaDataDoRetiro: 35, faixa: "A partir de 10 anos", valor: 400, valorTexto: "R$ 400,00", statusInterno: "PARTICIPANTE INTEIRA" },
      { familiaId: "FM", nome: "Meia", papel: "Participante", idadeNaDataDoRetiro: 18, faixa: "A partir de 10 anos", valor: 200, valorTexto: "R$ 200,00", statusInterno: "PARTICIPANTE MEIA" },
      { familiaId: "FV", nome: "Visitante", papel: "Visitante", idadeNaDataDoRetiro: "", faixa: "Visitante — dia todo", valor: 100, valorTexto: "R$ 100,00", statusInterno: "VISITANTE" },
    ],
    pagamentos: [], despesas: [], doacoes: [], ajustes: [], extras: [],
  });
  assert.deepEqual(b.pessoas.map((p) => p.classificacao), [
    "Organizador (paga meia)",
    "Apoio (não pagante)",
    "Não pagante (0–4 anos)",
    "Participante inteira",
    "Participante meia",
    "Visitante",
  ]);
  assert.equal(b.pessoas[5].idade, null);
  assert.equal(b.pessoas[5].faixa, "visitante");
});
