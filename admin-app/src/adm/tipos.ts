// Tipos do sistema de gestão (/adm). A planilha Google é a base de dados; estes tipos
// descrevem as linhas das abas Inscrições, Pagamentos, Despesas e Doações.

export type FaixaId = "menor-5" | "5-9" | "10-mais" | "visitante";
export type Transporte = "onibus" | "proprio";
export type ClassificacaoParticipante = "Organizador (paga meia)" | "Apoio (não pagante)" | "Não pagante (0–4 anos)" | "Participante inteira" | "Participante meia" | "Visitante";

export type Pessoa = {
  id: string;
  familiaId: string;
  nome: string;
  papel: string;
  classificacao: ClassificacaoParticipante;
  idade: number | null;
  faixa: FaixaId;
  /** valor devido por esta pessoa (R$) */
  valor: number;
  transporte: Transporte;
  /** camiseta (aba Extras) */
  tamanho?: string;
  modelo?: string;
};

export type Familia = {
  id: string;
  responsavel: string;
  telefone: string;
  igreja: string;
  cidade: string;
  /** "Pix" ou "Cartão", como a família escolheu pagar */
  formaPrevista: FormaPagamento;
  observacao?: string;
};

export type FormaPagamento = "Pix" | "Cartão" | "Dinheiro";

export type Pagamento = {
  id: string;
  familiaId: string;
  data: string; // AAAA-MM-DD
  valor: number; // positivo; estorno = valor negativo
  forma: FormaPagamento;
  obs?: string;
};

export type CategoriaDespesa =
  | "Alimentação e cozinha"
  | "Espaço e hospedagem"
  | "Estrutura (som, luz, tendas)"
  | "Transporte"
  | "Material de apoio";

export type StatusDespesa = "Orçado" | "Aprovado" | "Pago";

export type Despesa = {
  id: string;
  categoria: CategoriaDespesa;
  fornecedor: string;
  descricao: string;
  orcado: number;
  pago: number;
  status: StatusDespesa;
  data?: string;
};

export type Doacao = {
  id: string;
  data: string;
  doador: string;
  valor: number;
  tipo: "Avulsa" | "Apadrinhamento de vaga";
  obs?: string;
};

export type TipoAjuste = "Desconto" | "Isenção" | "Correção de dados" | "Observação";

/** Ajustes ficam na aba Ajustes; a aba Inscrições nunca é alterada pelo sistema. */
export type Ajuste = {
  id: string;
  data: string;
  familiaId: string;
  tipo: TipoAjuste;
  descricao: string;
  /** valor do desconto (R$), usado só em Desconto e Isenção */
  valor: number;
};

export type Base = {
  familias: Familia[];
  pessoas: Pessoa[];
  pagamentos: Pagamento[];
  despesas: Despesa[];
  doacoes: Doacao[];
  ajustes: Ajuste[];
};

export type SituacaoFamilia = "pre" | "pendente" | "parcial" | "quitado" | "isento";
export const CATEGORIAS: CategoriaDespesa[] = [
  "Alimentação e cozinha",
  "Espaço e hospedagem",
  "Estrutura (som, luz, tendas)",
  "Transporte",
  "Material de apoio",
];
