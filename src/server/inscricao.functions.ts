import { createServerFn } from "@tanstack/react-start";

import type { EntradaInscricao, RespostaInscricao } from "./inscricao.server";

export type { EntradaInscricao, RespostaInscricao };

/**
 * Endpoint de inscrição (executa só no servidor).
 * Variáveis de ambiente (nunca commitadas):
 *   APPS_SCRIPT_URL    URL do web app do Google Apps Script (obrigatória)
 *   APPS_SCRIPT_TOKEN  segredo opcional, enviado no corpo como `token`
 */
export const enviarInscricao = createServerFn({ method: "POST" })
  .inputValidator((data: EntradaInscricao) => data)
  .handler(async ({ data }): Promise<RespostaInscricao> => {
    const { processarInscricao } = await import("./inscricao.server");
    return processarInscricao(data, {
      url: process.env.APPS_SCRIPT_URL,
      token: process.env.APPS_SCRIPT_TOKEN,
    });
  });
