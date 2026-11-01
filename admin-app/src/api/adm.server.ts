import { higienizarCelula } from "../lib/seguranca";
import { montarBase } from "../adm/planilha";
import type { DadosBrutos } from "../adm/planilha";
import { criarToken, lerToken } from "../adm/sessao";
import type { Sessao } from "../adm/sessao";
import { CATEGORIAS } from "../adm/tipos";
import type { Base, TipoAjuste } from "../adm/tipos";

/**
 * Lógica do /adm no servidor. Fala com o Apps Script administrativo separado
 * (ADM_APPS_SCRIPT_URL), ligado à mesma planilha, e nunca expõe CPF ao navegador: a conferência da senha
 * (4 primeiros dígitos do CPF) acontece dentro do Apps Script.
 */
export type AmbienteAdm = {
  url?: string;
  token?: string; // ADM_TOKEN
  segredo?: string; // ADM_SESSION_SECRET
  /** true = grava de verdade na planilha (produção ou ADM_REAL=1) */
  real: boolean;
};

export function admReal(env: { VERCEL_ENV?: string; ADM_REAL?: string }): boolean {
  if (env.ADM_REAL === "0") return false;
  return env.ADM_REAL === "1" || env.VERCEL_ENV === "production";
}
export const admDemo = (env: { VERCEL_ENV?: string; ADM_DEMO?: string }): boolean =>
  env.ADM_DEMO === "1" || env.VERCEL_ENV !== "production";

export type Retorno<T = unknown> = { ok: true; dados: T } | { ok: false; codigo: string; mensagem: string };
const erro = (codigo: string, mensagem: string): Retorno<never> => ({ ok: false, codigo, mensagem });

type Corpo = Record<string, unknown>;

export async function chamarScript(
  amb: AmbienteAdm,
  acao: string,
  corpo: Corpo,
  fetchImpl: typeof fetch = fetch,
): Promise<Retorno<Corpo>> {
  if (!amb.url || !amb.token) return erro("NAO_CONFIGURADO", "O sistema ainda não está ligado à planilha.");
  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), 25_000);
  try {
    const r = await fetchImpl(amb.url, {
      method: "POST",
      headers: { "content-type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ ...corpo, acao, admToken: amb.token }),
      redirect: "follow",
      signal: controle.signal,
    });
    const texto = await r.text();
    if (!r.ok) return erro("REDE", `A planilha respondeu HTTP ${r.status}.`);
    let j: Corpo;
    try {
      j = JSON.parse(texto) as Corpo;
    } catch {
      return erro("RESPOSTA", "Resposta inesperada da planilha. Atualize o script (nova versão da implantação).");
    }
    if (j.ok === true) return { ok: true, dados: j };
    const codigo = typeof j.code === "string" ? j.code : "ERRO";
    return erro(codigo, typeof j.message === "string" ? j.message : "A planilha recusou a operação.");
  } catch (e) {
    return erro("REDE", e instanceof Error && e.name === "AbortError" ? "A planilha demorou demais." : "Falha de rede ao falar com a planilha.");
  } finally {
    clearTimeout(timer);
  }
}

/* ───────── Login ───────── */

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}$/;

export async function entrar(
  amb: AmbienteAdm,
  email: string,
  senha: string,
  fetchImpl: typeof fetch = fetch,
  agora = Date.now(),
): Promise<Retorno<{ token: string; nome: string; email: string }>> {
  const e = String(email ?? "").trim().toLowerCase();
  const s = String(senha ?? "").replace(/\D/g, "");
  if (!EMAIL.test(e) || s.length !== 4) return erro("CREDENCIAIS", "E-mail ou senha incorretos.");
  const r = await chamarScript(amb, "adm.login", { email: e, senha: s }, fetchImpl);
  if (!r.ok) {
    if (r.codigo === "BLOQUEADO") return erro("BLOQUEADO", "Muitas tentativas. Aguarde 15 minutos e tente de novo.");
    if (r.codigo === "CREDENCIAIS") return erro("CREDENCIAIS", "E-mail ou senha incorretos.");
    return r;
  }
  const nome = String(r.dados.nome ?? "").trim() || e;
  const token = await criarToken({ nome, email: e }, amb.segredo ?? "", agora);
  return { ok: true, dados: { token, nome, email: e } };
}

export async function sessaoDe(amb: AmbienteAdm, cookieToken?: string, agora = Date.now()): Promise<Sessao | null> {
  return lerToken(cookieToken, amb.segredo, agora);
}

/* ───────── Leitura e gravação ───────── */

export async function carregar(amb: AmbienteAdm, s: Sessao, fetchImpl: typeof fetch = fetch): Promise<Retorno<Base>> {
  const r = await chamarScript(amb, "adm.ler", { usuario: s.email }, fetchImpl);
  if (!r.ok) return r;
  const d = (r.dados.dados ?? {}) as Partial<DadosBrutos>;
  return {
    ok: true,
    dados: montarBase({
      inscricoes: d.inscricoes ?? [],
      pagamentos: d.pagamentos ?? [],
      despesas: d.despesas ?? [],
      doacoes: d.doacoes ?? [],
      ajustes: d.ajustes ?? [],
      extras: d.extras ?? [],
    }),
  };
}

const novoId = (p: string) =>
  `${p}-${Date.now().toString(36).toUpperCase()}${crypto.getRandomValues(new Uint8Array(2)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "").toUpperCase()}`;
const dinheiro = (v: unknown) => (typeof v === "number" ? v : Number(String(v ?? "").replace(",", ".")));
const dataOk = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "");
const limpo = (v: unknown, max = 200) => higienizarCelula(String(v ?? "").slice(0, max));

export type Gravacao =
  | { tipo: "pagamento"; familiaId: string; valor: number; forma: string; data: string; obs?: string }
  | { tipo: "despesa"; categoria: string; fornecedor: string; descricao?: string; orcado: number }
  | { tipo: "despesa-status"; id: string; status: "Orçado" | "Aprovado" | "Pago" }
  | { tipo: "doacao"; doador: string; valor: number; modo: string; obs?: string }
  | { tipo: "ajuste"; familiaId: string; ajuste: TipoAjuste; descricao: string; valor?: number }
  | { tipo: "camiseta"; pessoaId: string; tamanho: string; modelo: string };

/** Valida e converte uma operação em chamada ao script. Devolve erro de validação sem tocar na planilha. */
export function prepararGravacao(g: Gravacao, agora = new Date()): { acao: string; corpo: Corpo } | Retorno<never> {
  const hoje = agora.toISOString().slice(0, 10);
  switch (g.tipo) {
    case "pagamento": {
      const valor = dinheiro(g.valor);
      if (!g.familiaId || !Number.isFinite(valor) || valor === 0 || Math.abs(valor) > 100000)
        return erro("INVALIDO", "Informe a família e um valor válido.");
      if (!["Pix", "Cartão", "Dinheiro"].includes(g.forma)) return erro("INVALIDO", "Forma de pagamento inválida.");
      return { acao: "adm.add", corpo: { aba: "Pagamentos", valores: { id: novoId("P"), data: dataOk(g.data) || hoje, familiaId: limpo(g.familiaId, 40), valor, forma: g.forma, obs: limpo(g.obs) } } };
    }
    case "despesa": {
      const orcado = dinheiro(g.orcado);
      if (!(CATEGORIAS as string[]).includes(g.categoria) || !g.fornecedor?.trim() || !Number.isFinite(orcado) || orcado <= 0)
        return erro("INVALIDO", "Informe categoria, fornecedor e valor.");
      return { acao: "adm.add", corpo: { aba: "Despesas", valores: { id: novoId("D"), data: hoje, categoria: g.categoria, fornecedor: limpo(g.fornecedor), descricao: limpo(g.descricao), orcado, pago: 0, status: "Orçado" } } };
    }
    case "despesa-status":
      if (!g.id || !["Orçado", "Aprovado", "Pago"].includes(g.status)) return erro("INVALIDO", "Status inválido.");
      return { acao: "adm.despesaStatus", corpo: { id: limpo(g.id, 40), status: g.status } };
    case "doacao": {
      const valor = dinheiro(g.valor);
      if (!g.doador?.trim() || !Number.isFinite(valor) || valor <= 0) return erro("INVALIDO", "Informe doador e valor.");
      const tipo = g.modo === "Apadrinhamento de vaga" ? "Apadrinhamento de vaga" : "Avulsa";
      return { acao: "adm.add", corpo: { aba: "Doações", valores: { id: novoId("O"), data: hoje, doador: limpo(g.doador), valor, tipo, obs: limpo(g.obs) } } };
    }
    case "ajuste": {
      const valor = dinheiro(g.valor ?? 0);
      if (!g.familiaId || !g.descricao?.trim() || !Number.isFinite(valor) || valor < 0)
        return erro("INVALIDO", "Informe a família e a descrição.");
      if (!["Desconto", "Isenção", "Correção de dados", "Observação"].includes(g.ajuste)) return erro("INVALIDO", "Tipo de ajuste inválido.");
      if ((g.ajuste === "Desconto" || g.ajuste === "Isenção") && valor <= 0) return erro("INVALIDO", "Informe o valor do desconto.");
      return { acao: "adm.add", corpo: { aba: "Ajustes", valores: { id: novoId("A"), data: hoje, familiaId: limpo(g.familiaId, 40), tipo: g.ajuste, descricao: limpo(g.descricao, 300), valor } } };
    }
    case "camiseta":
      if (!g.pessoaId || !g.tamanho?.trim()) return erro("INVALIDO", "Informe a pessoa e o tamanho.");
      return { acao: "adm.extra", corpo: { pessoaId: limpo(g.pessoaId, 60), tamanho: limpo(g.tamanho, 10), modelo: limpo(g.modelo, 30) } };
  }
}

export async function gravar(amb: AmbienteAdm, s: Sessao, g: Gravacao, fetchImpl: typeof fetch = fetch): Promise<Retorno<null>> {
  const p = prepararGravacao(g);
  if ("ok" in p) return p;
  const r = await chamarScript(amb, p.acao, { ...p.corpo, usuario: s.email }, fetchImpl);
  return r.ok ? { ok: true, dados: null } : r;
}
