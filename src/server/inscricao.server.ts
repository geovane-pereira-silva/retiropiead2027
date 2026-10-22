// Processa uma inscrição no servidor: valida de novo, calcula idade/valor,
// bloqueia reenvios e grava na planilha. Nunca registra CPF/dados em log.
import { evento } from "../content/evento";
import { hojeSaoPaulo, montarCorpo, validar, type Erros, type FormValues } from "../lib/inscricao";
import { enviarParaPlanilha, type OpcoesEnvio } from "./sheets.server";

export type EntradaInscricao = { values: FormValues; idempotencyKey: string };

export type CodigoErro =
  | "VALIDACAO"
  | "DUPLICADO"
  | "NAO_CONFIGURADO"
  | "NAO_CONFIRMADO"
  | "RECUSADO"
  | "ENCERRADAS"
  | "SOLICITACAO_INVALIDA";

export type RespostaInscricao =
  | {
      ok: true;
      nome: string;
      idade: number;
      faixa: string;
      valor: number | null;
      jaRegistrada?: boolean;
    }
  | { ok: false; codigo: CodigoErro; mensagem: string; erros?: Erros };

type Ambiente = { url?: string; token?: string };

// Memória do processo (melhor esforço; o bloqueio definitivo por CPF é feito na planilha).
const JANELA_MS = 10 * 60 * 1000;
const recentes = new Map<string, { em: number; resposta: RespostaInscricao }>();
const emAndamento = new Set<string>();

function limpar(agora: number) {
  for (const [k, v] of recentes) if (agora - v.em > JANELA_MS) recentes.delete(k);
  if (recentes.size > 500) recentes.clear();
}

async function hashCpf(cpf: string): Promise<string> {
  const dados = new TextEncoder().encode(`retiro:${cpf}`);
  const h = await crypto.subtle.digest("SHA-256", dados);
  return Array.from(new Uint8Array(h), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function processarInscricao(
  entrada: EntradaInscricao,
  ambiente: Ambiente,
  opcoes: OpcoesEnvio = {},
): Promise<RespostaInscricao> {
  if (!evento.inscricoesAbertas) {
    return {
      ok: false,
      codigo: "ENCERRADAS",
      mensagem: "As inscrições não estão abertas no momento.",
    };
  }
  if (!ambiente.url) {
    return {
      ok: false,
      codigo: "NAO_CONFIGURADO",
      mensagem: "As inscrições estão temporariamente indisponíveis. Tente novamente mais tarde.",
    };
  }

  const v = entrada?.values;
  const chave = entrada?.idempotencyKey;
  if (!v || typeof chave !== "string" || chave.length < 8 || chave.length > 80) {
    return {
      ok: false,
      codigo: "SOLICITACAO_INVALIDA",
      mensagem: "Solicitação inválida. Recarregue a página.",
    };
  }
  // Campo-isca preenchido = robô. Resposta genérica, nada é gravado.
  if (typeof v.website === "string" && v.website.trim() !== "") {
    return {
      ok: false,
      codigo: "SOLICITACAO_INVALIDA",
      mensagem: "Não foi possível processar a solicitação.",
    };
  }

  const resultado = validar(v, {
    dataReferencia: evento.inicioData,
    hoje: hojeSaoPaulo(),
    faixas: evento.faixas,
  });
  if (Object.keys(resultado.erros).length > 0 || resultado.idade === null || !resultado.faixa) {
    return {
      ok: false,
      codigo: "VALIDACAO",
      mensagem: "Revise os campos destacados.",
      erros: resultado.erros,
    };
  }

  const agora = Date.now();
  limpar(agora);
  const chaveCpf = await hashCpf(v.cpf.replace(/\D+/g, ""));

  // Mesmo envio repetido (duplo clique / reenvio): devolve o resultado já obtido.
  const anterior = recentes.get(chave);
  if (anterior && anterior.resposta.ok) return { ...anterior.resposta, jaRegistrada: true };
  if (emAndamento.has(chave) || emAndamento.has(chaveCpf)) {
    return {
      ok: false,
      codigo: "DUPLICADO",
      mensagem: "Sua inscrição já está sendo enviada. Aguarde alguns segundos.",
    };
  }
  const cpfRecente = recentes.get(chaveCpf);
  if (cpfRecente && cpfRecente.resposta.ok) {
    return {
      ok: false,
      codigo: "DUPLICADO",
      mensagem: "Já recebemos uma inscrição com este CPF.",
    };
  }

  emAndamento.add(chave);
  emAndamento.add(chaveCpf);
  try {
    const corpo = montarCorpo(v, resultado, {
      idempotencyKey: chave,
      enviadoEm: new Date(agora).toISOString(),
      versaoTermos: evento.versaoTermos,
    });
    const r = await enviarParaPlanilha(ambiente.url, corpo, { ...opcoes, token: ambiente.token });

    if (r.status === "ok") {
      const ok: RespostaInscricao = {
        ok: true,
        nome: corpo.nomeCompleto.replace(/^'/, ""),
        idade: resultado.idade,
        faixa: resultado.faixa.rotulo,
        valor: resultado.valor,
      };
      recentes.set(chave, { em: agora, resposta: ok });
      recentes.set(chaveCpf, { em: agora, resposta: ok });
      return ok;
    }
    if (r.status === "duplicado") {
      return {
        ok: false,
        codigo: "DUPLICADO",
        mensagem:
          "Já existe uma inscrição com este CPF. Se você acabou de tentar se inscrever, ela já foi registrada.",
      };
    }
    if (r.status === "recusado") {
      console.error("[inscricao] planilha recusou o registro", r.mensagem ?? "");
      return {
        ok: false,
        codigo: "RECUSADO",
        mensagem: "Não foi possível registrar sua inscrição agora. Tente novamente em instantes.",
      };
    }
    console.error("[inscricao] envio não confirmado:", r.motivo);
    return {
      ok: false,
      codigo: "NAO_CONFIRMADO",
      mensagem:
        "Não conseguimos confirmar o registro da sua inscrição. Você pode tentar de novo: se ela já tiver sido gravada, avisaremos. Persistindo, procure a liderança da Conexão Jovem.",
    };
  } finally {
    emAndamento.delete(chave);
    emAndamento.delete(chaveCpf);
  }
}
