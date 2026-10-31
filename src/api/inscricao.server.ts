// Processa uma inscrição familiar no servidor: valida de novo, recalcula idades e
// valores, bloqueia reenvios e grava na planilha. Nunca registra CPF/dados em log.
import { evento } from "../content/evento";
import {
  hojeSaoPaulo,
  formatarReais,
  descricaoCamisa,
  higienizarCelula,
  montarCorpo,
  normalizarTelefone,
  rotuloTransporte,
  PRECO_CAMISA_AVULSA,
  somenteDigitos,
  validarDadosVisitante,
  validar,
  type DadosVisitante,
  type Erros,
  type FormValues,
} from "../lib/inscricao";
import { enviarParaPlanilha, type OpcoesEnvio } from "./sheets.server";

export type EntradaInscricao = { values: FormValues; idempotencyKey: string };
export type EntradaCadastroVisitante = { values: DadosVisitante; idempotencyKey: string };

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
  papel: "Participante";
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

export type RespostaCadastroVisitante =
  | {
      ok: true;
      nome: string;
      dia: string;
      periodo: string;
      valor: number;
      camisa: string;
      valorCamisa: number;
      jaRegistrada?: boolean;
    }
  | {
      ok: false;
      codigo: CodigoErro;
      mensagem: string;
      erros?: Erros;
      ensaio?: {
        nome: string;
        dia: string;
        periodo: string;
        valor: number;
        camisa: string;
        valorCamisa: number;
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
const visitantesRecentes = new Map<string, { em: number; resposta: RespostaCadastroVisitante }>();
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
      mensagem:
        "Modo de ensaio: os dados foram validados, mas NADA foi gravado e nenhuma inscrição foi registrada.",
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
  // A chave de deduplicação persistente é o CPF de quem participa. Um responsável
  // que não participa pode cadastrar cada filho em um envio individual.
  const cpfs = [
    ...new Set(
      resultado.participantes
        .map((p) => p.cpf)
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

export async function processarCadastroVisitante(
  entrada: EntradaCadastroVisitante,
  ambiente: Ambiente,
  opcoes: OpcoesEnvio = {},
): Promise<RespostaCadastroVisitante> {
  if (!evento.visitantes.inscricoesAbertas)
    return {
      ok: false,
      codigo: "ENCERRADAS",
      mensagem: "O cadastro de visitantes não está aberto no momento.",
    };
  if (!ambiente.url && !ambiente.ensaio)
    return {
      ok: false,
      codigo: "NAO_CONFIGURADO",
      mensagem: "O cadastro de visitantes está temporariamente indisponível.",
    };

  const v = entrada?.values;
  const chave = entrada?.idempotencyKey;
  if (
    !v ||
    typeof v !== "object" ||
    typeof v.nome !== "string" ||
    typeof v.telefone !== "string" ||
    typeof v.dia !== "string" ||
    typeof v.periodo !== "string" ||
    typeof v.aceitePrivacidade !== "boolean" ||
    typeof v.website !== "string" ||
    typeof chave !== "string" ||
    chave.length < 8 ||
    chave.length > 80
  )
    return {
      ok: false,
      codigo: "SOLICITACAO_INVALIDA",
      mensagem: "Recarregue a página e tente novamente.",
    };

  const erros = validarDadosVisitante(
    v,
    evento.visitantes.dias.map((d) => d.data),
  );
  if (Object.keys(erros).length)
    return { ok: false, codigo: "VALIDACAO", mensagem: "Revise os campos destacados.", erros };

  const dia = evento.visitantes.dias.find((d) => d.data === v.dia)!;
  const periodo = v.periodo === "dia-todo" ? "Dia todo" : "Somente à noite";
  const valor =
    v.periodo === "dia-todo" ? evento.visitantes.valorDiaTodo : evento.visitantes.valorSomenteNoite;
  const camisa = descricaoCamisa(v.camisaModelo, v.camisaTamanho, v.camisaMedida);
  const valorCamisa = camisa ? PRECO_CAMISA_AVULSA : 0;
  const total = valor + valorCamisa;
  const nome = v.nome.trim().replace(/\s+/g, " ");

  if (ambiente.ensaio)
    return {
      ok: false,
      codigo: "ENSAIO",
      mensagem: "Modo de ensaio: os dados foram validados, mas nada foi gravado.",
      ensaio: { nome, dia: dia.rotulo, periodo, valor: total, camisa, valorCamisa },
    };
  if (!ambiente.url)
    return {
      ok: false,
      codigo: "NAO_CONFIGURADO",
      mensagem: "O cadastro está temporariamente indisponível.",
    };

  const agora = Date.now();
  for (const [k, item] of visitantesRecentes)
    if (agora - item.em > JANELA_MS) visitantesRecentes.delete(k);
  const anterior = visitantesRecentes.get(chave);
  if (anterior?.resposta.ok) return { ...anterior.resposta, jaRegistrada: true };
  if (emAndamento.has(chave))
    return {
      ok: false,
      codigo: "DUPLICADO",
      mensagem: "Seu cadastro está sendo enviado. Aguarde.",
    };

  emAndamento.add(chave);
  try {
    const telefone = normalizarTelefone(v.telefone);
    const corpo = {
      idempotencyKey: chave,
      familiaId: novoFamiliaId(agora),
      enviadoEm: new Date(agora).toISOString(),
      responsavelNome: higienizarCelula(nome),
      responsavelCpf: "",
      telefone,
      whatsapp: telefone,
      email: "",
      igreja: "Visitante",
      cidade: "",
      emergenciaNome: "",
      emergenciaTelefone: "",
      necessidades: "",
      totalParticipantes: 1,
      totalValor: total,
      totalTexto: formatarReais(total),
      temValorADefinir: "NÃO" as const,
      aceiteRegras: "N/A — visitante" as const,
      aceitePrivacidade: "SIM" as const,
      versaoTermos: evento.versaoTermos,
      statusPagamento: "NÃO CONFIRMADO" as const,
      origem: "landing-retiro-2027-visitante" as const,
      participantes: [
        {
          ordem: 1,
          papel: "Visitante" as const,
          nome: higienizarCelula(nome),
          dataNascimento: "",
          idadeNaDataDoRetiro: "" as const,
          menorDeIdade: "" as const,
          faixa: `Visitante — ${periodo.toLocaleLowerCase("pt-BR")}${camisa ? `; Camisa ${higienizarCelula(camisa)}` : ""}`,
          valor: total,
          valorTexto: camisa
            ? `${formatarReais(valor)} (day use) + camisa ${formatarReais(valorCamisa)}`
            : formatarReais(valor),
          cpf: "",
          transporte: `Sem ônibus — ${dia.rotulo} — ${periodo}`,
        },
      ],
    };
    const resultadoEnvio = await enviarParaPlanilha(
      ambiente.url,
      corpo as unknown as Record<string, unknown>,
      { ...opcoes, token: ambiente.token },
    );
    if (resultadoEnvio.status === "ok") {
      const resposta: RespostaCadastroVisitante = {
        ok: true,
        nome,
        dia: dia.rotulo,
        periodo,
        valor: total,
        camisa,
        valorCamisa,
      };
      visitantesRecentes.set(chave, { em: agora, resposta });
      return resposta;
    }
    if (resultadoEnvio.status === "duplicado")
      return { ok: false, codigo: "DUPLICADO", mensagem: "Este cadastro já foi recebido." };
    if (resultadoEnvio.status === "recusado")
      return {
        ok: false,
        codigo: "RECUSADO",
        mensagem: "Não foi possível registrar agora. Tente novamente.",
      };
    return {
      ok: false,
      codigo: "NAO_CONFIRMADO",
      mensagem: "Não foi possível confirmar o cadastro. Tente novamente ou procure a liderança.",
    };
  } finally {
    emAndamento.delete(chave);
  }
}
