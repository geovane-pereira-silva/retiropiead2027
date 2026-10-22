// ============================================================================
// Regras de inscrição — funções puras, sem dependências, compartilhadas entre
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

export type FormValues = {
  nomeCompleto: string;
  dataNascimento: string; // YYYY-MM-DD
  cpf: string;
  telefone: string;
  whatsapp: string;
  igreja: string;
  cidade: string;
  email: string;
  responsavelNome: string;
  responsavelTelefone: string;
  emergenciaNome: string;
  emergenciaTelefone: string;
  necessidades: string;
  aceiteRegras: boolean;
  aceitePrivacidade: boolean;
  /** Campo-isca invisível: pessoas não preenchem, robôs sim. */
  website: string;
};

export type Campo = keyof FormValues;
export type Erros = Partial<Record<Campo, string>>;

/** Ordem visual dos campos, usada para focar o primeiro erro. */
export const ORDEM_CAMPOS: Campo[] = [
  "nomeCompleto",
  "dataNascimento",
  "cpf",
  "telefone",
  "whatsapp",
  "email",
  "igreja",
  "cidade",
  "responsavelNome",
  "responsavelTelefone",
  "emergenciaNome",
  "emergenciaTelefone",
  "necessidades",
  "aceiteRegras",
  "aceitePrivacidade",
];

export const VALORES_VAZIOS: FormValues = {
  nomeCompleto: "",
  dataNascimento: "",
  cpf: "",
  telefone: "",
  whatsapp: "",
  igreja: "",
  cidade: "",
  email: "",
  responsavelNome: "",
  responsavelTelefone: "",
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
};

export type ResultadoValidacao = {
  erros: Erros;
  idade: number | null;
  menorDeIdade: boolean;
  faixa: Faixa | null;
  /** null = valor a definir (ou idade ainda desconhecida) */
  valor: number | null;
};

const texto = (s: string): string => (s ?? "").trim().replace(/\s+/g, " ");

export function validar(v: FormValues, ctx: ContextoValidacao): ResultadoValidacao {
  const erros: Erros = {};

  if (!nomeValido(v.nomeCompleto))
    erros.nomeCompleto = "Informe o nome completo (nome e sobrenome).";

  let idade: number | null = null;
  if (!v.dataNascimento) {
    erros.dataNascimento = "Informe a data de nascimento.";
  } else if (!lerDataIso(v.dataNascimento)) {
    erros.dataNascimento = "Data de nascimento inválida.";
  } else if (v.dataNascimento > ctx.hoje) {
    erros.dataNascimento = "A data de nascimento não pode estar no futuro.";
  } else {
    idade = calcularIdade(v.dataNascimento, ctx.dataReferencia);
    if (idade === null || idade < 0) {
      erros.dataNascimento = "O participante precisa ter nascido antes do início do retiro.";
      idade = null;
    } else if (idade > 110) {
      erros.dataNascimento = "Confira o ano de nascimento.";
      idade = null;
    }
  }

  if (!v.cpf) erros.cpf = "Informe o CPF.";
  else if (!cpfValido(v.cpf)) erros.cpf = "CPF inválido. Confira os números.";

  if (!v.telefone) erros.telefone = "Informe o telefone.";
  else if (!telefoneValido(v.telefone)) erros.telefone = "Telefone inválido. Use DDD + número.";

  if (!v.whatsapp) erros.whatsapp = "Informe o WhatsApp.";
  else if (!telefoneValido(v.whatsapp)) erros.whatsapp = "WhatsApp inválido. Use DDD + número.";

  const igreja = texto(v.igreja);
  if (igreja.length < 2) erros.igreja = "Informe a igreja ou congregação.";
  else if (igreja.length > 100) erros.igreja = "Use no máximo 100 caracteres.";

  const cidade = texto(v.cidade);
  if (cidade.length < 2) erros.cidade = "Informe a cidade.";
  else if (cidade.length > 80) erros.cidade = "Use no máximo 80 caracteres.";

  if (v.email.trim() && !emailValido(v.email.trim())) erros.email = "E-mail inválido.";

  const menorDeIdade = idade !== null && idade < 18;
  if (menorDeIdade) {
    if (!nomeValido(v.responsavelNome))
      erros.responsavelNome = "Informe o nome completo do responsável legal.";
    if (!v.responsavelTelefone) erros.responsavelTelefone = "Informe o telefone do responsável.";
    else if (!telefoneValido(v.responsavelTelefone))
      erros.responsavelTelefone = "Telefone inválido. Use DDD + número.";
  }

  if (!nomeValido(v.emergenciaNome))
    erros.emergenciaNome = "Informe o nome do contato de emergência.";
  if (!v.emergenciaTelefone) erros.emergenciaTelefone = "Informe o telefone de emergência.";
  else if (!telefoneValido(v.emergenciaTelefone))
    erros.emergenciaTelefone = "Telefone inválido. Use DDD + número.";

  if (v.necessidades.length > 500) erros.necessidades = "Use no máximo 500 caracteres.";

  if (!v.aceiteRegras) erros.aceiteRegras = "É necessário aceitar as regras do retiro.";
  if (!v.aceitePrivacidade)
    erros.aceitePrivacidade = "É necessário confirmar a ciência da política de privacidade.";

  const faixa = idade === null ? null : faixaPorIdade(idade, ctx.faixas);
  if (idade !== null && !faixa)
    erros.dataNascimento = "Não foi possível determinar o valor para esta idade.";

  return { erros, idade, menorDeIdade, faixa, valor: faixa ? faixa.valor : null };
}

// ─── Corpo enviado à planilha ────────────────────────────────────────────────

/** Evita injeção de fórmulas em planilhas (=, +, -, @ no início da célula). */
export function higienizarCelula(s: string): string {
  const t = texto(s);
  return /^[=+\-@\t\r]/.test(t) ? `'${t}` : t;
}

export type CorpoPlanilha = {
  idempotencyKey: string;
  enviadoEm: string; // ISO UTC, gerado no servidor
  nomeCompleto: string;
  dataNascimento: string;
  idadeNaDataDoRetiro: number;
  faixa: string;
  valor: number | null;
  valorTexto: string;
  cpf: string; // somente dígitos
  telefone: string;
  whatsapp: string;
  email: string;
  igreja: string;
  cidade: string;
  menorDeIdade: "SIM" | "NÃO";
  responsavelNome: string;
  responsavelTelefone: string;
  emergenciaNome: string;
  emergenciaTelefone: string;
  necessidades: string;
  aceiteRegras: "SIM";
  aceitePrivacidade: "SIM";
  versaoTermos: string;
  statusPagamento: "NÃO CONFIRMADO";
  origem: "landing-retiro-2027";
};

export function montarCorpo(
  v: FormValues,
  r: ResultadoValidacao,
  extra: { idempotencyKey: string; enviadoEm: string; versaoTermos: string },
): CorpoPlanilha {
  if (r.idade === null || !r.faixa) throw new Error("montarCorpo chamado com dados inválidos");
  const menor = r.menorDeIdade;
  return {
    idempotencyKey: extra.idempotencyKey,
    enviadoEm: extra.enviadoEm,
    nomeCompleto: higienizarCelula(v.nomeCompleto),
    dataNascimento: v.dataNascimento,
    idadeNaDataDoRetiro: r.idade,
    faixa: r.faixa.rotulo,
    valor: r.valor,
    valorTexto: r.valor === null ? "A definir" : formatarReais(r.valor),
    cpf: somenteDigitos(v.cpf),
    telefone: normalizarTelefone(v.telefone),
    whatsapp: normalizarTelefone(v.whatsapp),
    email: higienizarCelula(v.email),
    igreja: higienizarCelula(v.igreja),
    cidade: higienizarCelula(v.cidade),
    menorDeIdade: menor ? "SIM" : "NÃO",
    responsavelNome: menor ? higienizarCelula(v.responsavelNome) : "",
    responsavelTelefone: menor ? normalizarTelefone(v.responsavelTelefone) : "",
    emergenciaNome: higienizarCelula(v.emergenciaNome),
    emergenciaTelefone: normalizarTelefone(v.emergenciaTelefone),
    necessidades: higienizarCelula(v.necessidades),
    aceiteRegras: "SIM",
    aceitePrivacidade: "SIM",
    versaoTermos: extra.versaoTermos,
    statusPagamento: "NÃO CONFIRMADO",
    origem: "landing-retiro-2027",
  };
}
