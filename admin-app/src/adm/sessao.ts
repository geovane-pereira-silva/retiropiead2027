/**
 * Sessão do /adm: cookie assinado (HMAC-SHA256). O navegador não consegue ler a chave nem forjar
 * o conteúdo. Roda só no servidor (usa ADM_SESSION_SECRET).
 */
export type Sessao = { nome: string; email: string; exp: number };

const enc = new TextEncoder();
export const NOME_COOKIE = "adm_sessao";
export const DURACAO_MS = 8 * 60 * 60 * 1000;

const b64url = (b: ArrayBuffer | Uint8Array): string => {
  const arr = b instanceof Uint8Array ? b : new Uint8Array(b);
  let s = "";
  for (const x of arr) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const deB64url = (s: string): Uint8Array => {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
};

async function chave(segredo: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", enc.encode(segredo), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function criarToken(s: Omit<Sessao, "exp">, segredo: string, agora = Date.now()): Promise<string> {
  if (!segredo || segredo.length < 16) throw new Error("ADM_SESSION_SECRET ausente ou curto demais");
  const corpo = b64url(enc.encode(JSON.stringify({ ...s, exp: agora + DURACAO_MS })));
  const assinatura = await crypto.subtle.sign("HMAC", await chave(segredo), enc.encode(corpo));
  return `${corpo}.${b64url(assinatura)}`;
}

export async function lerToken(token: string | undefined, segredo: string | undefined, agora = Date.now()): Promise<Sessao | null> {
  if (!token || !segredo || segredo.length < 16) return null;
  const [corpo, assin] = token.split(".");
  if (!corpo || !assin) return null;
  try {
    const ok = await crypto.subtle.verify("HMAC", await chave(segredo), deB64url(assin), enc.encode(corpo));
    if (!ok) return null;
    const s = JSON.parse(new TextDecoder().decode(deB64url(corpo))) as Sessao;
    if (typeof s.exp !== "number" || s.exp < agora || !s.nome || !s.email) return null;
    return s;
  } catch {
    return null;
  }
}

export function lerCookie(cabecalho: string | null | undefined, nome = NOME_COOKIE): string | undefined {
  if (!cabecalho) return undefined;
  for (const parte of cabecalho.split(";")) {
    const [k, ...v] = parte.trim().split("=");
    if (k === nome) return v.join("=");
  }
  return undefined;
}

export const cookieSessao = (token: string, producao: boolean): string =>
  `${NOME_COOKIE}=${token}; Path=/adm; HttpOnly; SameSite=Lax; Max-Age=${DURACAO_MS / 1000}${producao ? "; Secure" : ""}`;
export const cookieLimpo = (producao: boolean): string =>
  `${NOME_COOKIE}=; Path=/adm; HttpOnly; SameSite=Lax; Max-Age=0${producao ? "; Secure" : ""}`;
