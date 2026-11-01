// Roda docs/apps-script/Code.gs num Google "de mentira" para validar login, bloqueio, gravação e leitura.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

type Cel = unknown;
class Aba {
  linhas: Cel[][] = [];
  constructor(public nome: string) {}
  getLastRow() { return this.linhas.length; }
  getLastColumn() { return this.linhas.reduce((m, l) => Math.max(m, l.length), 0); }
  getMaxRows() { return 1000; }
  setFrozenRows() {}
  appendRow(l: Cel[]) { this.linhas.push([...l]); }
  getRange(r: number, c: number, nr = 1, nc = 1) {
    const aba = this;
    const api = {
      getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => aba.linhas[r - 1 + i]?.[c - 1 + j] ?? "")),
      setValues: (v: Cel[][]) => { v.forEach((l, i) => l.forEach((x, j) => { (aba.linhas[r - 1 + i] ??= [])[c - 1 + j] = x; })); return api; },
      setValue: (x: Cel) => { (aba.linhas[r - 1] ??= [])[c - 1] = x; return api; },
      setFontWeight: () => api,
      setNumberFormat: () => api,
    };
    return api;
  }
}

function criar(props: Record<string, string> = { ADM_TOKEN: "seg-adm", TOKEN: "seg-site" }) {
  const abas = new Map<string, Aba>();
  const planilha = {
    getSheetByName: (n: string) => abas.get(n) ?? null,
    insertSheet: (n: string) => { const a = new Aba(n); abas.set(n, a); return a; },
  };
  const cacheMem = new Map<string, string>();
  const ctx = vm.createContext({
    SpreadsheetApp: { getActiveSpreadsheet: () => planilha, flush() {} },
    ContentService: { createTextOutput: (t: string) => ({ t, setMimeType() { return this; } }), MimeType: { JSON: "json" } },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k: string) => props[k] ?? null }) },
    CacheService: { getScriptCache: () => ({ get: (k: string) => cacheMem.get(k) ?? null, put: (k: string, v: string) => void cacheMem.set(k, v), remove: (k: string) => void cacheMem.delete(k) }) },
    Utilities: { formatDate: (d: Date) => d.toISOString().slice(0, 10) },
    Session: { getScriptTimeZone: () => "America/Sao_Paulo" },
    JSON, String, Number, Object, Date, Math,
  });
  vm.runInContext(fs.readFileSync("docs/apps-script/Code.gs", "utf8"), ctx);
  const post = (corpo: unknown) =>
    JSON.parse(vm.runInContext(`doPost(${JSON.stringify({ postData: { contents: JSON.stringify(corpo) } })}).t`, ctx) as string);
  const rodar = (f: string) => vm.runInContext(`${f}()`, ctx);
  return { abas, post, rodar };
}

const INSC = (g: ReturnType<typeof criar>) => {
  const cab = ["enviadoEm", "familiaId", "idempotencyKey", "ordem", "papel", "nome", "dataNascimento", "idadeNaDataDoRetiro", "menorDeIdade", "faixa", "valorTexto", "valor", "cpf", "transporte", "responsavelNome", "telefone", "whatsapp", "email", "igreja", "cidade", "emergenciaNome", "emergenciaTelefone", "necessidades", "totalParticipantes", "totalTexto", "temValorADefinir", "aceiteRegras", "aceitePrivacidade", "versaoTermos", "statusPagamento", "origem", "acesso_sistema"];
  const linha = (o: Record<string, unknown>) => cab.map((c) => o[c] ?? "");
  const a = new Aba("Inscrições");
  a.linhas = [
    cab,
    linha({ familiaId: "F1", ordem: 1, papel: "Organizador", nome: "Ana Equipe", idadeNaDataDoRetiro: 30, faixa: "A partir de 10 anos", valor: 400, cpf: "12345678909", transporte: "Ônibus", responsavelNome: "Ana Equipe", email: "ana@ex.com", acesso_sistema: "sim" }),
    linha({ familiaId: "F2", ordem: 1, papel: "Organizador", nome: "Pai Comum", idadeNaDataDoRetiro: 40, valor: 400, cpf: "98765432100", responsavelNome: "Pai Comum", email: "pai@ex.com", acesso_sistema: "não" }),
  ];
  g.abas.set("Inscrições", a);
};

test("prepararPlanilha cria as abas e é repetível", () => {
  const g = criar(); INSC(g);
  g.rodar("prepararPlanilha"); g.rodar("prepararPlanilha");
  for (const n of ["Pagamentos", "Despesas", "Doações", "Ajustes", "Extras", "Histórico"]) assert.ok(g.abas.get(n), n);
  assert.equal(g.abas.get("Pagamentos")!.linhas.length, 1);
});

test("exige ADM_TOKEN correto", () => {
  const g = criar(); INSC(g);
  assert.equal(g.post({ acao: "adm.ler", admToken: "errado" }).code, "UNAUTHORIZED");
  const sem = criar({}); INSC(sem);
  assert.equal(sem.post({ acao: "adm.ler", admToken: "qualquer" }).code, "UNAUTHORIZED");
});

test("login: só acesso_sistema=sim, e-mail + 4 primeiros dígitos do CPF; bloqueia após 5 erros", () => {
  const g = criar(); INSC(g); g.rodar("prepararPlanilha");
  const tenta = (email: string, senha: string) => g.post({ acao: "adm.login", admToken: "seg-adm", email, senha });
  assert.equal(tenta("pai@ex.com", "9876").code, "CREDENCIAIS"); // existe, mas sem acesso
  assert.equal(tenta("ana@ex.com", "0000").code, "CREDENCIAIS");
  const ok = tenta("ANA@ex.com", "1234");
  assert.equal(ok.ok, true);
  assert.equal(ok.nome, "Ana Equipe");
  for (let i = 0; i < 5; i++) tenta("ana@ex.com", "1111");
  assert.equal(tenta("ana@ex.com", "1234").code, "BLOQUEADO");
});

test("leitura nunca devolve CPF", () => {
  const g = criar(); INSC(g); g.rodar("prepararPlanilha");
  const r = g.post({ acao: "adm.ler", admToken: "seg-adm" });
  assert.equal(r.ok, true);
  assert.equal(r.dados.inscricoes.length, 2);
  assert.ok(!JSON.stringify(r).includes("12345678909"));
  assert.ok(!("cpf" in r.dados.inscricoes[0]));
});

test("gravar pagamento, evitar duplicado por id, histórico e status da despesa", () => {
  const g = criar(); INSC(g); g.rodar("prepararPlanilha");
  const add = { acao: "adm.add", admToken: "seg-adm", usuario: "ana@ex.com", aba: "Pagamentos", valores: { id: "P-1", data: "2026-11-01", familiaId: "F1", valor: 100, forma: "Pix", obs: "" } };
  assert.equal(g.post(add).ok, true);
  assert.equal(g.post(add).jaExiste, true);
  assert.equal(g.abas.get("Pagamentos")!.linhas.length, 2);
  assert.equal(g.post({ ...add, aba: "Inscrições" }).ok, false); // aba proibida
  g.post({ acao: "adm.add", admToken: "seg-adm", usuario: "ana@ex.com", aba: "Despesas", valores: { id: "D-1", data: "2026-11-01", categoria: "Transporte", fornecedor: "X", descricao: "", orcado: 500, pago: 0, status: "Orçado" } });
  assert.equal(g.post({ acao: "adm.despesaStatus", admToken: "seg-adm", usuario: "ana@ex.com", id: "D-1", status: "Pago" }).ok, true);
  const d = g.abas.get("Despesas")!.linhas[1];
  assert.equal(d[6], 500); assert.equal(d[7], "Pago");
  assert.ok(g.abas.get("Histórico")!.linhas.length > 2);
  const lido = g.post({ acao: "adm.ler", admToken: "seg-adm" });
  assert.equal(lido.dados.pagamentos[0].valor, 100);
});

test("inscrição do site continua funcionando com o token do site", () => {
  const g = criar();
  const corpo = { token: "seg-site", idempotencyKey: "k1", familiaId: "F9", enviadoEm: "2026-11-01", participantes: [{ ordem: 1, papel: "Responsável", nome: "Teste", cpf: "11144477735", valor: 400 }] };
  assert.equal(g.post(corpo).ok, true);
  assert.equal(g.post(corpo).jaRegistrada, true);
  assert.equal(g.post({ ...corpo, idempotencyKey: "k2" }).code, "DUPLICATE");
  assert.equal(g.post({ ...corpo, token: "x", idempotencyKey: "k3" }).code, "UNAUTHORIZED");
});
