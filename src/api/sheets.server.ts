// ============================================================================
// Adaptador do Google Apps Script (web app da planilha de inscrições).
//
// Roda SOMENTE no servidor: a URL do script e o token ficam em variáveis de
// ambiente e nunca chegam ao navegador. Este arquivo concentra tudo o que
// depende do formato do script — se o seu doPost esperar outros nomes de
// campos, ajuste `montarRequisicao` (e só ele).
// ============================================================================

export type ResultadoPlanilha =
  | { status: "ok" }
  | { status: "duplicado" }
  | { status: "recusado"; mensagem?: string }
  /** Rede/timeout/resposta inesperada: NÃO sabemos se a linha foi gravada. */
  | { status: "nao-confirmado"; motivo: string };

export type OpcoesEnvio = {
  timeoutMs?: number;
  token?: string;
  fetchImpl?: typeof fetch;
};

function montarRequisicao(corpo: Record<string, unknown>, token?: string): RequestInit {
  const payload = token ? { ...corpo, token } : corpo;
  return {
    method: "POST",
    // Apps Script lê e.postData.contents; text/plain evita pré-voo CORS em qualquer cenário.
    headers: { "content-type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
    redirect: "follow",
  };
}

const MARCAS_DUPLICADO = /duplic|já (existe|cadastrad|inscrit)|already/i;

export function interpretarResposta(texto: string): ResultadoPlanilha {
  const bruto = texto.trim();

  let json: unknown = null;
  try {
    json = JSON.parse(bruto);
  } catch {
    json = null;
  }

  if (json && typeof json === "object") {
    const o = json as Record<string, unknown>;
    const mensagem =
      typeof o.message === "string" ? o.message : typeof o.error === "string" ? o.error : undefined;
    const sucesso =
      o.ok === true || o.success === true || o.status === "ok" || o.status === "success";
    if (sucesso) return { status: "ok" };
    if (
      o.code === "DUPLICATE" ||
      o.duplicate === true ||
      o.status === "duplicate" ||
      (mensagem && MARCAS_DUPLICADO.test(mensagem))
    ) {
      return { status: "duplicado" };
    }
    const falha = o.ok === false || o.success === false || o.status === "error" || "error" in o;
    if (falha) return { status: "recusado", mensagem };
    return { status: "nao-confirmado", motivo: "resposta JSON sem indicação de sucesso" };
  }

  if (/^(ok|success|sucesso)$/i.test(bruto)) return { status: "ok" };

  // Páginas HTML de erro do Apps Script (ex.: "Script function not found: doPost").
  const pagina = /<title>\s*([^<]{0,80})/i.exec(bruto)?.[1]?.trim();
  return {
    status: "nao-confirmado",
    motivo: `resposta não reconhecida${pagina ? ` (${pagina})` : ""}`,
  };
}

export async function enviarParaPlanilha(
  url: string,
  corpo: Record<string, unknown>,
  opcoes: OpcoesEnvio = {},
): Promise<ResultadoPlanilha> {
  const f = opcoes.fetchImpl ?? fetch;
  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), opcoes.timeoutMs ?? 25_000);
  try {
    const resposta = await f(url, {
      ...montarRequisicao(corpo, opcoes.token),
      signal: controle.signal,
    });
    const texto = await resposta.text();
    if (!resposta.ok) return { status: "nao-confirmado", motivo: `HTTP ${resposta.status}` };
    return interpretarResposta(texto);
  } catch (e) {
    const motivo =
      e instanceof Error && e.name === "AbortError" ? "tempo esgotado" : "falha de rede";
    return { status: "nao-confirmado", motivo };
  } finally {
    clearTimeout(timer);
  }
}
