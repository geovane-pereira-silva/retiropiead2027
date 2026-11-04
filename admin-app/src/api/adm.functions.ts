import type { Base } from "../adm/tipos";
import type { Gravacao, Retorno } from "./adm.server";

export type EstadoAdm =
  | { modo: "fechado" }
  | { modo: "demo" }
  | { modo: "login" }
  | { modo: "dentro"; nome: string };

async function chamar<T>(acao: string, dados?: unknown): Promise<T> {
  const metodo = dados === undefined ? "GET" : "POST";
  const url = `/adm/api?action=${encodeURIComponent(acao)}`;
  const resposta = await fetch(url, {
    method: metodo,
    credentials: "same-origin",
    headers: dados === undefined ? undefined : { "content-type": "application/json" },
    body: dados === undefined ? undefined : JSON.stringify(dados),
  });
  const corpo = await resposta.json() as T;
  if (!resposta.ok && resposta.status >= 500) throw new Error("Falha no serviço administrativo.");
  return corpo;
}

export const estadoAdm = () => chamar<EstadoAdm>("state");
export const carregarAdm = () => chamar<Retorno<Base>>("load");
export const carregarPreviewAdm = () => chamar<Retorno<Base>>("preview-data");
export const entrarAdm = (args: { data: { email: string; senha: string } }) =>
  chamar<Retorno<{ nome: string }>>("login", args.data);
export const sairAdm = () => chamar<{ ok: true }>("logout", {});
export const gravarAdm = (args: { data: Gravacao }) =>
  chamar<Retorno<null>>("write", args.data);