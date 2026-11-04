import { admReal, carregar, entrar, gravar, sessaoDe, type AmbienteAdm, type Gravacao } from "./adm.server";
import type { Base } from "../adm/tipos";
import { gunzipSync } from "node:zlib";
import { cookieLimpo, cookieSessao, lerCookie } from "../adm/sessao";

const json = (dados: unknown, status = 200, headers: HeadersInit = {}) =>
  new Response(JSON.stringify(dados), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "private, no-store, max-age=0", ...headers },
  });

const ambiente = (): AmbienteAdm => ({
  url: process.env.ADM_APPS_SCRIPT_URL,
  token: process.env.ADM_TOKEN,
  segredo: process.env.ADM_SESSION_SECRET,
  real: admReal({ VERCEL_ENV: process.env.VERCEL_ENV, ADM_REAL: process.env.ADM_REAL }),
});

export async function atenderAdmin(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const acao = url.searchParams.get("action") ?? "";
  const amb = ambiente();
  const producao = process.env.VERCEL_ENV === "production";
  const cookie = lerCookie(request.headers.get("cookie"));
  const sessao = await sessaoDe(amb, cookie);

  // Prévia isolada: snapshot privado importado das planilhas, apenas leitura.
  if (request.method === "GET" && acao === "preview-data" && !amb.real) {
    const snapshot = process.env.ADM_PREVIEW_DATA_GZIP;
    if (!snapshot) return json({ ok: false, codigo: "PREVIEW_SEM_DADOS", mensagem: "O conjunto de dados da prévia ainda não foi carregado." }, 503);
    try {
      const dados = JSON.parse(gunzipSync(Buffer.from(snapshot, "base64")).toString("utf8")) as Base;
      return json({ ok: true, dados });
    } catch {
      return json({ ok: false, codigo: "PREVIEW_INVALIDA", mensagem: "Os dados importados para a prévia estão inválidos." }, 503);
    }
  }

  if (request.method === "GET" && acao === "state") {
    if (amb.real) {
      const pronto = !!(amb.url && amb.token && amb.segredo && amb.segredo.length >= 32);
      if (!pronto) return json({ modo: "fechado" });
      return json(sessao ? { modo: "dentro", nome: sessao.nome } : { modo: "login" });
    }
    return json({ modo: "demo" });
  }

  if (request.method === "GET" && acao === "load") {
    if (!amb.real || !sessao) return json({ ok: false, codigo: "SESSAO", mensagem: "Sua sessão expirou. Entre de novo." }, 401);
    return json(await carregar(amb, sessao));
  }

  if (request.method !== "POST") return json({ ok: false, codigo: "METODO", mensagem: "Método não permitido." }, 405);
  let dados: Record<string, unknown>;
  try { dados = await request.json() as Record<string, unknown>; }
  catch { return json({ ok: false, codigo: "CORPO", mensagem: "Requisição inválida." }, 400); }

  if (acao === "login") {
    if (!amb.real) return json({ ok: false, codigo: "DEMO", mensagem: "O login real está desligado neste ambiente." }, 403);
    const r = await entrar(amb, String(dados.email ?? ""), String(dados.senha ?? ""));
    if (!r.ok) return json(r, 401);
    return json({ ok: true, dados: { nome: r.dados.nome } }, 200, { "set-cookie": cookieSessao(r.dados.token, producao) });
  }

  if (acao === "logout") return json({ ok: true }, 200, { "set-cookie": cookieLimpo(producao) });
  if (acao === "write") {
    if (!amb.real || !sessao) return json({ ok: false, codigo: "SESSAO", mensagem: "Sua sessão expirou. Entre de novo." }, 401);
    return json(await gravar(amb, sessao, dados as unknown as Gravacao));
  }
  return json({ ok: false, codigo: "ACAO", mensagem: "Ação desconhecida." }, 404);
}
