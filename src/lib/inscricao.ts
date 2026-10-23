// ============================================================================
// Regras de inscrição FAMILIAR — funções puras, sem dependências, compartilhadas entre
// o navegador (feedback imediato) e o servidor (validação autoritativa).
// O servidor SEMPRE recalcula idade e valor; nunca confia no que veio do cliente.
// ============================================================================

export type Faixa = {
  id: string;
  rotulo: string;
  idadeMin: number;
  idadeMax: number | null;
  valor: number | null;
  nota?: string;
};

export type Pessoa = {
  /** Identificador local (chave React). Ignorado pelo servidor. */
  uid?: string;
  nome: string;
  dataNascimento: string; // YYYY-MM-DD
  cpf: string;
};

export type FormValues = {
  /** Quem faz a inscrição: sempre maior de idade e responsável legal pelos menores da família. */
  responsavel: Pessoa;
  /** Se o responsável também participa do retiro (entra no cálculo de valores). */
  responsavelParticipa: boolean;
  telefone: string;
  whatsapp: string;
  email: string;
  igreja: string;
  cidade: string;
  /** Demais integrantes da família que vão participar. */
  integrantes: Pessoa[];
  emergenciaNome: string;
  emergenciaTelefone: string;
  necessidades: string;
  aceiteRegras: boolean;
  aceitePrivacidade: boolean;
  /** Campo-isca invisível: pessoas não preenchem, robôs sim. */
  website: string;
};

/** Chaves de erro: "telefone", "responsavel.cpf", "integrantes.0.nome", "integrantes"… */
export type Erros = Record<string, string>;

export const PESSOA_VAZIA: Pessoa = { nome: "", dataNascimento: "", cpf: "" };

export const VALORES_VAZIOS: FormValues = {
  responsavel: { ...PESSOA_VAZIA },
  responsavelParticipa: true,
  telefone: "",
  whatsapp: "",
  email: "",
  igreja: "",
  cidade: "",
  integrantes: [],
  emergenciaNome: "",
  emergenciaTelefone: "",
  necessidades: "",
  aceiteRegras: false,
  aceitePrivacidade: false,
  website: "",
};

// ─── Utilidades de texto ─────────────────────────────────────────────────────

export const somenteDigitos = (s: string): string => (s ?? "").replace(/\D+/g, "");

export function formatarCpf(s: string): string {
  const d = somenteDigitos(s).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/** Normaliza para 10 ou 11 dígitos (remove DDI 55 quando presente). */
export function normalizarTelefone(s: string): string {
  let d = somenteDigitos(s);
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) d = d.slice(2);
  return d;
}

export function formatarTelefone(s: string): string {
  const d = somenteDigitos(s).slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function formatarReais(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ─── Validadores ─────────────────────────────────────────────────────────────

export function cpfValido(entrada: string): boolean {
  const d = somenteDigitos(entrada);
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;
  const calc = (base: string, pesoInicial: number): number => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) soma += Number(base[i]) * (pesoInicial - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  const d1 = calc(d.slice(0, 9), 10);
  const d2 = calc(d.slice(0, 10), 11);
  return d1 === Number(d[9]) && d2 === Number(d[10]);
}

export function telefoneValido(entrada: string): boolean {
  const d = normalizarTelefone(entrada);
  if (d.length !== 10 && d.length !== 11) return false;
  const ddd = Number(d.slice(0, 2));
  if (ddd < 11 || ddd > 99) return false;
  if (d.length === 11 && d[2] !== "9") return false; // celular
  return true;
}

export function emailValido(entrada: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(entrada) && entrada.length <= 120;
}

function nomeValido(entrada: string): boolean {
  const nome = entrada.trim().replace(/\s+/g, " ");
  if (nome.length < 5 || nome.length > 100) return false;
  if (!/^[\p{L}][\p{L}\p{M}'’.\- ]*$/u.test(nome)) return false;
  return nome.split(" ").length >= 2;
}

// ─── Datas (sem fuso: trabalhamos com strings YYYY-MM-DD) ────────────────────

export function lerDataIso(s: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s ?? "");
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d)
    return null;
  return { y, m: mo, d };
}

/** Idade completa em `referencia` (YYYY-MM-DD). Null se alguma data for inválida. */
export function calcularIdade(nascimento: string, referencia: string): number | null {
  const n = lerDataIso(nascimento);
  const r = lerDataIso(referencia);
  if (!n || !r) return null;
  let idade = r.y - n.y;
  if (r.m < n.m || (r.m === n.m && r.d < n.d)) idade -= 1;
  return idade;
}

/** Data de hoje em America/Sao_Paulo no formato YYYY-MM-DD. */
export function hojeSaoPaulo(agora: Date = new Date()): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(agora);
  return partes; // en-CA → YYYY-MM-DD
}

export function faixaPorIdade(idade: number, faixas: Faixa[]): Faixa | null {
  return (
    faixas.find((f) => idade >= f.idadeMin && (f.idadeMax === null || idade <= f.idadeMax)) ?? null
  );
}

// ─── Validação completa ──────────────────────────────────────────────────────

export type ContextoValidacao = {
  /** Data de início do retiro (YYYY-MM-DD) — referência para a idade. */
  dataReferencia: string;
  /** Hoje (YYYY-MM-DD) — para rejeitar nascimento no futuro. */
  hoje: string;
  faixas: Faixa[];
  /** Máximo de participantes por envio. */
  maxParticipantes: number;
};

export type Participante = {
  papel: "Responsável" | "Integrante";
  nome: string;
  dataNascimento: string;
  cpf: string; // só dígitos ("" se não informado)
  idade: number;
  menorDeIdade: boolean;
  faixa: Faixa;
  /** null = valor a definir */
  valor: number | null;
  /** chave do formulário (para ligar o valor ao cartão correspondente) */
  chave: string;
};

export type ResultadoValidacao = {
  erros: Erros;
  /** Participantes com idade/valor calculados (apenas os de data válida). */
  participantes: Participante[];
  /** Soma dos valores já definidos. */
  total: number;
  /** true se algum participante tem valor "a definir" (o total é parcial). */
  temValorADefinir: boolean;
};

const texto = (s: string): string => (s ?? "").trim().replace(/\s+/g, " ");

/** Calcula idade/valor de uma pessoa e registra erros de nome e nascimento. */
function avaliarPessoa(
  p: Pessoa,
  chave: string,
  papel: Participante["papel"],
  ctx: ContextoValidacao,
  erros: Erros,
): Participante | null {
  if (!nomeValido(p.nome)) erros[`${chave}.nome`] = "Informe o nome completo (nome e sobrenome).";

  let idade: number | null = null;
  if (!p.dataNascimento) {
    erros[`${chave}.dataNascimento`] = "Informe a data de nascimento.";
  } else if (!lerDataIso(p.dataNascimento)) {
    erros[`${chave}.dataNascimento`] = "Data de nascimento inválida.";
  } else if (p.dataNascimento > ctx.hoje) {
    erros[`${chave}.dataNascimento`] = "A data de nascimento não pode estar no futuro.";
  } else {
    idade = calcularIdade(p.dataNascimento, ctx.dataReferencia);
    if (idade === null || idade < 0) {
      erros[`${chave}.dataNascimento`] = "Nascimento posterior ao início do retiro.";
      idade = null;
    } else if (idade > 110) {
      erros[`${chave}.dataNascimento`] = "Confira o ano de nascimento.";
      idade = null;
    }
  }

  const cpfDigitos = somenteDigitos(p.cpf);
  const adulto = idade !== null && idade >= 18;
  if (!cpfDigitos) {
    // Obrigatório para adultos; opcional para menores (crianças nem sempre têm CPF).
    if (adulto || papel === "Responsável") erros[`${chave}.cpf`] = "Informe o CPF.";
  } else if (!cpfValido(cpfDigitos)) {
    erros[`${chave}.cpf`] = "CPF inválido. Confira os números.";
  }

  if (idade === null) return null;
  const faixa = faixaPorIdade(idade, ctx.faixas);
  if (!faixa) {
    erros[`${chave}.dataNascimento`] = "Não foi possível determinar o valor para esta idade.";
    return null;
  }
  return {
    papel,
    nome: texto(p.nome),
    dataNascimento: p.dataNascimento,
    cpf: cpfDigitos,
    idade,
    menorDeIdade: idade < 18,
    faixa,
    valor: faixa.valor,
    chave,
  };
}

export function validar(v: FormValues, ctx: ContextoValidacao): ResultadoValidacao {
  // A ordem de inserção das chaves segue a ordem visual do formulário.
  const erros: Erros = {};
  const participantes: Participante[] = [];

  const resp = avaliarPessoa(v.responsavel, "responsavel", "Responsável", ctx, erros);
  if (resp && resp.menorDeIdade) {
    erros["responsavel.dataNascimento"] =
      "O responsável pela inscrição precisa ter 18 anos ou mais na data do retiro.";
  }

  if (!v.telefone) erros.telefone = "Informe o telefone.";
  else if (!telefoneValido(v.telefone)) erros.telefone = "Telefone inválido. Use DDD + número.";

  if (!v.whatsapp) erros.whatsapp = "Informe o WhatsApp.";
  else if (!telefoneValido(v.whatsapp)) erros.whatsapp = "WhatsApp inválido. Use DDD + número.";

  if (v.email.trim() && !emailValido(v.email.trim())) erros.email = "E-mail inválido.";

  const igreja = texto(v.igreja);
  if (igreja.length < 2) erros.igreja = "Informe a igreja ou congregação.";
  else if (igreja.length > 100) erros.igreja = "Use no máximo 100 caracteres.";

  const cidade = texto(v.cidade);
  if (cidade.length < 2) erros.cidade = "Informe a cidade.";
  else if (cidade.length > 80) erros.cidade = "Use no máximo 80 caracteres.";

  if (resp && v.responsavelParticipa) participantes.push(resp);

  if (v.integrantes.length > ctx.maxParticipantes) {
    erros.integrantes = `Máximo de ${ctx.maxParticipantes} pessoas por inscrição. Faça uma segunda inscrição para os demais.`;
  }
  v.integrantes.forEach((p, i) => {
    const a = avaliarPessoa(p, `integrantes.${i}`, "Integrante", ctx, erros);
    if (a) participantes.push(a);
  });

  const total_ = (v.responsavelParticipa ? 1 : 0) + v.integrantes.length;
  if (total_ === 0) erros.integrantes = "Inclua ao menos um participante.";
  else if (total_ > ctx.maxParticipantes && !erros.integrantes) {
    erros.integrantes = `Máximo de ${ctx.maxParticipantes} pessoas por inscrição. Faça uma segunda inscrição para os demais.`;
  }

  // CPF repetido dentro da mesma inscrição (responsável conta mesmo sem participar).
  const vistos = new Map<string, string>();
  const checar = (cpf: string, chave: string) => {
    const d = somenteDigitos(cpf);
    if (!d || !cpfValido(d)) return;
    if (vistos.has(d)) {
      if (!erros[`${chave}.cpf`])
        erros[`${chave}.cpf`] = "Este CPF já foi informado nesta inscrição.";
    } else vistos.set(d, chave);
  };
  checar(v.responsavel.cpf, "responsavel");
  v.integrantes.forEach((p, i) => checar(p.cpf, `integrantes.${i}`));

  if (!nomeValido(v.emergenciaNome))
    erros.emergenciaNome = "Informe o nome do contato de emergência.";
  if (!v.emergenciaTelefone) erros.emergenciaTelefone = "Informe o telefone de emergência.";
  else if (!telefoneValido(v.emergenciaTelefone))
    erros.emergenciaTelefone = "Telefone inválido. Use DDD + número.";

  if (v.necessidades.length > 500) erros.necessidades = "Use no máximo 500 caracteres.";

  if (!v.aceiteRegras) erros.aceiteRegras = "É necessário aceitar as regras do retiro.";
  if (!v.aceitePrivacidade)
    erros.aceitePrivacidade = "É necessário confirmar a ciência da política de privacidade.";

  const total = participantes.reduce((soma, p) => soma + (p.valor ?? 0), 0);
  return {
    erros,
    participantes,
    total,
    temValorADefinir: participantes.some((p) => p.valor === null),
  };
}

// ─── Corpo enviado à planilha ────────────────────────────────────────────────

/** Evita injeção de fórmulas em planilhas (=, +, -, @ no início da célula). */
export function higienizarCelula(s: string): string {
  const t = texto(s);
  return /^[=+\-@\t\r]/.test(t) ? `'${t}` : t;
}

export type ParticipantePlanilha = {
  ordem: number;
  papel: "Responsável" | "Integrante";
  nome: string;
  dataNascimento: string;
  idadeNaDataDoRetiro: number;
  menorDeIdade: "SIM" | "NÃO";
  faixa: string;
  valor: number | null;
  valorTexto: string;
  cpf: string; // somente dígitos ("" se não informado)
};

export type CorpoPlanilha = {
  idempotencyKey: string;
  familiaId: string;
  enviadoEm: string; // ISO UTC, gerado no servidor
  responsavelNome: string;
  responsavelCpf: string;
  telefone: string;
  whatsapp: string;
  email: string;
  igreja: string;
  cidade: string;
  emergenciaNome: string;
  emergenciaTelefone: string;
  necessidades: string;
  totalParticipantes: number;
  totalValor: number;
  totalTexto: string;
  temValorADefinir: "SIM" | "NÃO";
  aceiteRegras: "SIM";
  aceitePrivacidade: "SIM";
  versaoTermos: string;
  statusPagamento: "NÃO CONFIRMADO";
  origem: "landing-retiro-2027";
  participantes: ParticipantePlanilha[];
};

export function montarCorpo(
  v: FormValues,
  r: ResultadoValidacao,
  extra: { idempotencyKey: string; familiaId: string; enviadoEm: string; versaoTermos: string },
): CorpoPlanilha {
  if (r.participantes.length === 0) throw new Error("montarCorpo chamado com dados inválidos");
  return {
    idempotencyKey: extra.idempotencyKey,
    familiaId: extra.familiaId,
    enviadoEm: extra.enviadoEm,
    responsavelNome: higienizarCelula(v.responsavel.nome),
    responsavelCpf: somenteDigitos(v.responsavel.cpf),
    telefone: normalizarTelefone(v.telefone),
    whatsapp: normalizarTelefone(v.whatsapp),
    email: higienizarCelula(v.email),
    igreja: higienizarCelula(v.igreja),
    cidade: higienizarCelula(v.cidade),
    emergenciaNome: higienizarCelula(v.emergenciaNome),
    emergenciaTelefone: normalizarTelefone(v.emergenciaTelefone),
    necessidades: higienizarCelula(v.necessidades),
    totalParticipantes: r.participantes.length,
    totalValor: r.total,
    totalTexto: formatarReais(r.total) + (r.temValorADefinir ? " + valores a definir" : ""),
    temValorADefinir: r.temValorADefinir ? "SIM" : "NÃO",
    aceiteRegras: "SIM",
    aceitePrivacidade: "SIM",
    versaoTermos: extra.versaoTermos,
    statusPagamento: "NÃO CONFIRMADO",
    origem: "landing-retiro-2027",
    participantes: r.participantes.map((p, i) => ({
      ordem: i + 1,
      papel: p.papel,
      nome: higienizarCelula(p.nome),
      dataNascimento: p.dataNascimento,
      idadeNaDataDoRetiro: p.idade,
      menorDeIdade: p.menorDeIdade ? "SIM" : "NÃO",
      faixa: p.faixa.rotulo,
      valor: p.valor,
      valorTexto: p.valor === null ? "A definir" : formatarReais(p.valor),
      cpf: p.cpf,
    })),
  };
}
