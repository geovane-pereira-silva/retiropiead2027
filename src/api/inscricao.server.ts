// Processa uma inscrição familiar no servidor: valida de novo, recalcula idades e
// valores, bloqueia reenvios e grava na planilha. Nunca registra CPF/dados em log.
import { evento } from "../content/evento";
import {
  hojeSaoPaulo,
  montarCorpo,
  rotuloTransporte,
  somenteDigitos,
  validar,
  type Erros,
  type FormValues,
} from "../lib/inscricao";
import { enviarParaPlanilha, type OpcoesEnvio } from "./sheets.server";

export type EntradaInscricao = { values: FormValues; idempotencyKey: string };

export type CodigoErro =
  | "VALIDACAO"
  | "DUPLICADO"
  | "NAO_CONFIGURADO"
  | "NAO_CONFIRMADO"
  | "RECUSADO"
  | "ENCERRADAS"
  | "ENSAIO"
  | "SOLICITACAO_INVALIDA";

export type ParticipanteConfirmado = {
  nome: string;
  papel: "Responsável" | "Integrante";
  idade: number;
  faixa: string;
  valor: number | null;
  transporte: string;
};

export type RespostaInscricao =
  | {
      ok: true;
      responsavel: string;
      participantes: ParticipanteConfirmado[];
      total: number;
      temValorADefinir: boolean;
      jaRegistrada?: boolean;
    }
  | {
      ok: false;
      codigo: CodigoErro;
      mensagem: string;
      erros?: Erros;
      /** Só no modo de ensaio: o que o servidor validou e recalculou. NADA foi gravado. */
      ensaio?: {
        responsavel: string;
        participantes: ParticipanteConfirmado[];
        total: number;
        temValorADefinir: boolean;
      };
    };

type Ambiente = { url?: string; token?: string; ensaio?: boolean };

/**
 * Modo de ensaio = o servidor valida e recalcula, mas NUNCA chama a planilha.
 * À prova de falhas: só grava de verdade na produção da Vercel (VERCEL_ENV=production)
 * ou quando FORM_MODO_ENSAIO=0 for definido de propósito. Qualquer outro caso é ensaio.
 */
export function ensaioAtivo(env: { FORM_MODO_ENSAIO?: string; VERCEL_ENV?: string }): boolean {
  if (env.FORM_MODO_ENSAIO === "0") return false;
  if (env.FORM_MODO_ENSAIO === "1") return true;
  return env.VERCEL_ENV !== "production";
}

// Memória do processo (melhor esforço; o bloqueio definitivo por CPF é feito na planilha).
const JANELA_MS = 10 * 60 * 1000;
const recentes = new Map<string, { em: number; resposta: RespostaInscricao }>();
const emAndamento = new Set<string>();

const higienizarNome = (n: string): string => n.trim().replace(/\s+/g, " ");

function limpar(agora: number) {
  for (const [k, v] of recentes) if (agora - v.em > JANELA_MS) recentes.delete(k);
  if (recentes.size > 1000) recentes.clear();
}

async function hashCpf(cpf: string): Promise<string> {
  const dados = new TextEncoder().encode(`retiro:${cpf}`);
  const h = await crypto.subtle.digest("SHA-256", dados);
  return Array.from(new Uint8Array(h), (b) => b.toString(16).padStart(2, "0")).join("");
}

function novoFamiliaId(agora: number): string {
  const rnd = crypto.getRandomValues(new Uint8Array(3));
  const sufixo = Array.from(rnd, (b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  return `F-${agora.toString(36).toUpperCase()}-${sufixo}`;
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
  if (!ambiente.url && !ambiente.ensaio) {
    return {
      ok: false,
      codigo: "NAO_CONFIGURADO",
      mensagem: "As inscrições estão temporariamente indisponíveis. Tente novamente mais tarde.",
    };
  }

  const v = entrada?.values;
  const chave = entrada?.idempotencyKey;
  if (
    !v ||
    typeof v !== "object" ||
    !v.responsavel ||
    !Array.isArray(v.integrantes) ||
    typeof chave !== "string" ||
    chave.length < 8 ||
    chave.length > 80
  ) {
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
    maxParticipantes: evento.maxParticipantesPorInscricao,
  });
  if (Object.keys(resultado.erros).length > 0 || resultado.participantes.length === 0) {
    return {
      ok: false,
      codigo: "VALIDACAO",
      mensagem: "Revise os campos destacados.",
      erros: resultado.erros,
    };
  }

  // MODO DE ENSAIO: devolve o que foi validado e recalculado, sem gravar e sem confirmar nada.
  if (ambiente.ensaio) {
    return {
      ok: false,
      codigo: "ENSAIO",
      mensagem: "Modo de ensaio: os dados foram validados, mas NADA foi gravado e nenhuma inscrição foi registrada.",
      ensaio: {
        responsavel: higienizarNome(v.responsavel.nome),
        participantes: resultado.participantes.map((p) => ({
          nome: p.nome,
          papel: p.papel,
          idade: p.idade,
          faixa: p.faixa.rotulo,
          valor: p.valor,
          transporte: rotuloTransporte(p.transporte),
        })),
        total: resultado.total,
        temValorADefinir: resultado.temValorADefinir,
      },
    };
  }
  if (!ambiente.url) {
    return {
      ok: false,
      codigo: "NAO_CONFIGURADO",
      mensagem: "As inscrições estão temporariamente indisponíveis. Tente novamente mais tarde.",
    };
  }
  const urlPlanilha: string = ambiente.url;

  const agora = Date.now();
  limpar(agora);
  // CPFs desta inscrição (responsável sempre conta, mesmo sem participar).
  const cpfs = [
    ...new Set(
      [v.responsavel.cpf, ...v.integrantes.map((p) => p.cpf)]
        .map(somenteDigitos)
        .filter((c) => c.length === 11),
    ),
  ];
  const chavesCpf = await Promise.all(cpfs.map(hashCpf));
  const travas = [chave, ...chavesCpf];

  // Mesmo envio repetido (duplo clique / reenvio): devolve o resultado já obtido.
  const anterior = recentes.get(chave);
  if (anterior && anterior.resposta.ok) return { ...anterior.resposta, jaRegistrada: true };
  if (travas.some((t) => emAndamento.has(t))) {
    return {
      ok: false,
      codigo: "DUPLICADO",
      mensagem: "Sua inscrição já está sendo enviada. Aguarde alguns segundos.",
    };
  }
  if (chavesCpf.some((h) => recentes.get(h)?.resposta.ok)) {
    return {
      ok: false,
      codigo: "DUPLICADO",
      mensagem: "Já recebemos uma inscrição com um dos CPFs informados.",
    };
  }

  travas.forEach((t) => emAndamento.add(t));
  try {
    const corpo = montarCorpo(v, resultado, {
      idempotencyKey: chave,
      familiaId: novoFamiliaId(agora),
      enviadoEm: new Date(agora).toISOString(),
      versaoTermos: evento.versaoTermos,
    });
    const r = await enviarParaPlanilha(urlPlanilha, corpo as unknown as Record<string, unknown>, {
      ...opcoes,
      token: ambiente.token,
    });

    if (r.status === "ok") {
      const ok: RespostaInscricao = {
        ok: true,
        responsavel: resultado.participantes.length ? corpo.responsavelNome.replace(/^'/, "") : "",
        participantes: resultado.participantes.map((p) => ({
          nome: p.nome,
          papel: p.papel,
          idade: p.idade,
          faixa: p.faixa.rotulo,
          valor: p.valor,
          transporte: rotuloTransporte(p.transporte),
        })),
        total: resultado.total,
        temValorADefinir: resultado.temValorADefinir,
      };
      recentes.set(chave, { em: agora, resposta: ok });
      chavesCpf.forEach((h) => recentes.set(h, { em: agora, resposta: ok }));
      return ok;
    }
    if (r.status === "duplicado") {
      return {
        ok: false,
        codigo: "DUPLICADO",
        mensagem:
          "Já existe inscrição com um dos CPFs informados. Se você acabou de tentar se inscrever, ela já foi registrada.",
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
    travas.forEach((t) => emAndamento.delete(t));
  }
}
