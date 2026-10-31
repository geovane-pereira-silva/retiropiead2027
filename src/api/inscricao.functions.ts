import { createServerFn } from "@tanstack/react-start";

import type {
  EntradaCadastroVisitante,
  EntradaInscricao,
  RespostaCadastroVisitante,
  RespostaInscricao,
} from "./inscricao.server";

export type { EntradaCadastroVisitante, EntradaInscricao, RespostaCadastroVisitante, RespostaInscricao };

/**
 * Endpoint de inscrição (executa só no servidor).
 * Variáveis de ambiente (nunca commitadas):
 *   APPS_SCRIPT_URL    URL do web app do Google Apps Script (obrigatória)
 *   APPS_SCRIPT_TOKEN  segredo opcional, enviado no corpo como `token`
 *   FORM_MODO_ENSAIO   "1" força ensaio; "0" libera gravação fora da produção.
 *                      Sem ela: só a produção da Vercel grava; Preview e local fazem ensaio.
 */
export const enviarInscricao = createServerFn({ method: "POST" })
  .validator((data: EntradaInscricao) => data)
  .handler(async ({ data }): Promise<RespostaInscricao> => {
    const { processarInscricao, ensaioAtivo } = await import("./inscricao.server");
    return processarInscricao(data, {
      url: process.env.APPS_SCRIPT_URL,
      token: process.env.APPS_SCRIPT_TOKEN,
      ensaio: ensaioAtivo(process.env),
    });
  });

/** Cadastro curto de day use, usando a mesma integração de planilha e o mesmo modo de ensaio. */
export const enviarCadastroVisitante = createServerFn({ method: "POST" })
  .validator((data: EntradaCadastroVisitante) => data)
  .handler(async ({ data }): Promise<RespostaCadastroVisitante> => {
    const { processarCadastroVisitante, ensaioAtivo } = await import("./inscricao.server");
    return processarCadastroVisitante(data, {
      url: process.env.APPS_SCRIPT_URL,
      token: process.env.APPS_SCRIPT_TOKEN,
      ensaio: ensaioAtivo(process.env),
    });
  });

/** Diz à página se o envio está em modo de ensaio (para mostrar a faixa de aviso). */
export const modoFormulario = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ ensaio: boolean }> => {
    const { ensaioAtivo } = await import("./inscricao.server");
    return { ensaio: ensaioAtivo(process.env) };
  },
);
