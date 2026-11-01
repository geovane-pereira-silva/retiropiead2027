import { createServerFn } from "@tanstack/react-start";

import type { Base } from "../adm/tipos";
import type { Gravacao, Retorno } from "./adm.server";

/**
 * Endpoints do /adm (só no servidor). Variáveis de ambiente (nunca no código):
 *   APPS_SCRIPT_URL      mesma URL do site
 *   ADM_TOKEN            senha do /adm no Apps Script (propriedade ADM_TOKEN)
 *   ADM_SESSION_SECRET   texto longo e aleatório (32+ caracteres) que assina o login
 *   ADM_REAL             "1" liga a planilha fora da produção; "0" desliga mesmo na produção
 *   ADM_DEMO             "1" libera a prévia com dados fictícios na produção (não use)
 * Sem configuração completa na produção, o /adm fica fechado. No Preview abre a prévia fictícia.
 */
async function contexto() {
  const srv = await import("./adm.server");
  const sess = await import("../adm/sessao");
  const { getRequest } = await import("@tanstack/react-start/server");
  const env = process.env;
  const amb = {
    url: env.APPS_SCRIPT_URL,
    token: env.ADM_TOKEN,
    segredo: env.ADM_SESSION_SECRET,
    real: srv.admReal(env),
  };
  const cookie = sess.lerCookie(getRequest().headers.get("cookie"));
  const sessao = await srv.sessaoDe(amb, cookie);
  return { srv, sess, amb, sessao, env };
}

export type EstadoAdm =
  | { modo: "fechado" }
  | { modo: "demo" }
  | { modo: "login" }
  | { modo: "dentro"; nome: string };

export const estadoAdm = createServerFn({ method: "GET" }).handler(async (): Promise<EstadoAdm> => {
  const { srv, amb, sessao, env } = await contexto();
  if (amb.real) {
    const configurado = !!(amb.url && amb.token && amb.segredo && amb.segredo.length >= 16);
    if (!configurado) return { modo: "fechado" };
    return sessao ? { modo: "dentro", nome: sessao.nome } : { modo: "login" };
  }
  return srv.admDemo(env) ? { modo: "demo" } : { modo: "fechado" };
});

export const entrarAdm = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; senha: string }) => d)
  .handler(async ({ data }): Promise<Retorno<{ nome: string }>> => {
    const { srv, sess, amb } = await contexto();
    if (!amb.real) return { ok: false, codigo: "DEMO", mensagem: "O login real está desligado neste ambiente." };
    const r = await srv.entrar(amb, data.email, data.senha);
    if (!r.ok) return r;
    const { setResponseHeader } = await import("@tanstack/react-start/server");
    setResponseHeader("Set-Cookie", sess.cookieSessao(r.dados.token, process.env.VERCEL_ENV === "production"));
    return { ok: true, dados: { nome: r.dados.nome } };
  });

export const sairAdm = createServerFn({ method: "POST" }).handler(async (): Promise<{ ok: true }> => {
  const { sess } = await contexto();
  const { setResponseHeader } = await import("@tanstack/react-start/server");
  setResponseHeader("Set-Cookie", sess.cookieLimpo(process.env.VERCEL_ENV === "production"));
  return { ok: true };
});

const NAO_AUTENTICADO = { ok: false, codigo: "SESSAO", mensagem: "Sua sessão expirou. Entre de novo." } as const;

export const carregarAdm = createServerFn({ method: "GET" }).handler(async (): Promise<Retorno<Base>> => {
  const { setResponseHeader } = await import("@tanstack/react-start/server");
  setResponseHeader("Cache-Control", "private, no-store, max-age=0");
  const { srv, amb, sessao } = await contexto();
  if (!amb.real || !sessao) return NAO_AUTENTICADO;
  return srv.carregar(amb, sessao);
});

export const gravarAdm = createServerFn({ method: "POST" })
  .inputValidator((d: Gravacao) => d)
  .handler(async ({ data }): Promise<Retorno<null>> => {
    const { setResponseHeader } = await import("@tanstack/react-start/server");
    setResponseHeader("Cache-Control", "private, no-store, max-age=0");
    const { srv, amb, sessao } = await contexto();
    if (!amb.real || !sessao) return NAO_AUTENTICADO;
    return srv.gravar(amb, sessao, data);
  });
