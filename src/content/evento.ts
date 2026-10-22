// ============================================================================
// Conteúdo PÚBLICO da landing page do retiro — fonte única editável.
//
// Para mudar datas, valores, programação, FAQ ou textos, edite apenas este
// arquivo (e src/content/media.json para fotos/vídeos). Nenhum componente
// precisa ser alterado.
//
// Regra do projeto: nada aqui pode ser inventado. Tudo o que ainda não foi
// confirmado pela organização fica como `null`, lista vazia ou marcado
// `status: "a-confirmar"`, e a página mostra "em breve" automaticamente.
// ============================================================================

import type { Faixa } from "../lib/inscricao";

export type { Faixa };

export type ItemProgramacao = { hora?: string; titulo: string; descricao?: string };
export type DiaProgramacao = { titulo: string; data?: string; itens: ItemProgramacao[] };

export type InfoCard = {
  id: "hospedagem" | "alimentacao" | "transporte" | "orientacoes";
  titulo: string;
  status: "confirmado" | "a-confirmar";
  texto: string;
  itens?: string[];
};

export const evento = {
  /** false → a página de inscrição exibe aviso de "inscrições encerradas/em breve" */
  inscricoesAbertas: true,

  nome: "Retiro Conexão Jovem",
  edicao: "2027",
  ministerio: "Conexão Jovem",
  igreja: "Primeira Assembleia de Deus",
  igrejaCidade: "Santa Rita do Sapucaí, MG",

  /** Tema oficial ainda não informado. Preencha com texto para aparecer no topo. */
  tema: null as string | null,

  fraseImpacto: "Uma geração conectada ao céu: louvor, oração e comunhão em um só lugar.",

  // Datas (somente dia). A idade é calculada na data de início.
  inicioData: "2027-02-12",
  fimData: "2027-02-16",
  dataTexto: "12 a 16 de fevereiro de 2027",
  periodoNota: "Sexta a terça-feira de Carnaval",

  // Local conforme o conteúdo já existente no projeto e o nome da pasta de fotos.
  // CONFIRMAR com a organização antes de divulgar.
  local: {
    nome: "Sítio Santa Clara",
    cidade: "Campos do Jordão",
    uf: "SP",
    mapsUrl: null as string | null,
  },

  // Valores definidos pela organização.
  faixas: [
    {
      id: "menor-5",
      rotulo: "Menores de 5 anos",
      idadeMin: 0,
      idadeMax: 4,
      valor: null,
      nota: "Valor a definir pela organização",
    },
    { id: "5-9", rotulo: "De 5 a 9 anos", idadeMin: 5, idadeMax: 9, valor: 200 },
    { id: "10-mais", rotulo: "A partir de 10 anos", idadeMin: 10, idadeMax: null, valor: 400 },
  ] as Faixa[],

  sobre: [
    {
      titulo: "Propósito espiritual",
      texto:
        "Dias separados para buscar a Deus, ser edificado pela Palavra e renovar a fé junto com a igreja.",
    },
    {
      titulo: "Comunhão",
      texto:
        "Fortalecer os laços entre jovens e famílias da Primeira Assembleia de Deus em um ambiente de acolhimento.",
    },
    {
      titulo: "Louvor e oração",
      texto: "Momentos de adoração, intercessão e busca pela presença de Deus.",
    },
    {
      titulo: "Convivência cristã",
      texto:
        "Tempo para conversar, servir uns aos outros, conhecer pessoas e criar memórias com propósito.",
    },
  ],

  // Informações práticas. Só "valores" e as orientações do formulário estão confirmados.
  informacoes: [
    {
      id: "hospedagem",
      titulo: "Hospedagem",
      status: "a-confirmar",
      texto: "Os detalhes de acomodação serão divulgados pela organização.",
    },
    {
      id: "alimentacao",
      titulo: "Alimentação",
      status: "a-confirmar",
      texto:
        "Os detalhes das refeições serão divulgados pela organização. Restrições alimentares podem ser informadas no formulário de inscrição.",
    },
    {
      id: "transporte",
      titulo: "Transporte",
      status: "a-confirmar",
      texto: "As informações de transporte serão divulgadas pela organização.",
    },
    {
      id: "orientacoes",
      titulo: "Orientações",
      status: "confirmado",
      texto: "O que você precisa saber para se inscrever:",
      itens: [
        "O CPF é obrigatório e identifica a inscrição.",
        "Menores de 18 anos devem ter nome e telefone do responsável legal informados.",
        "Informe um contato de emergência.",
        "Necessidades de hospedagem ou alimentação podem ser descritas no formulário.",
        "O envio do formulário é um cadastro e não confirma pagamento.",
      ],
    },
  ] as InfoCard[],

  /** Vazio = a seção mostra "programação em breve". Exemplo de preenchimento ao final do arquivo. */
  programacao: [] as DiaProgramacao[],

  faq: [
    {
      p: "Como faço minha inscrição?",
      r: "Acesse a página de inscrição e preencha o formulário. O valor calculado aparece antes do envio e, ao final, você recebe uma tela de confirmação do cadastro.",
      status: "confirmado" as const,
    },
    {
      p: "Quais são os valores?",
      r: "Menores de 5 anos: valor a definir pela organização. De 5 a 9 anos: R$ 200,00. A partir de 10 anos: R$ 400,00. A idade é calculada na data de início do retiro (12/02/2027).",
      status: "confirmado" as const,
    },
    {
      p: "Enviar o formulário confirma meu pagamento?",
      r: "Não. O formulário registra o cadastro e seus dados. O envio não significa pagamento confirmado.",
      status: "confirmado" as const,
    },
    {
      p: "Crianças menores de 5 anos pagam?",
      r: "O valor para menores de 5 anos ainda será definido pela organização e, por isso, nenhuma cobrança é calculada automaticamente.",
      status: "confirmado" as const,
    },
    {
      p: "E se o participante for menor de 18 anos?",
      r: "No formulário, é obrigatório informar nome e telefone do responsável legal quando o participante tem menos de 18 anos na data de início do retiro.",
      status: "confirmado" as const,
    },
    {
      p: "Por que preciso informar o CPF?",
      r: "O CPF é obrigatório e serve para identificar a inscrição e evitar cadastros duplicados.",
      status: "confirmado" as const,
    },
    {
      p: "Como meus dados são usados?",
      r: "Apenas para organizar o retiro. Veja o aviso de privacidade na página de inscrição.",
      status: "confirmado" as const,
    },
    {
      p: "Como será a hospedagem, a alimentação e o transporte?",
      r: "Esses detalhes ainda serão divulgados pela organização.",
      status: "a-confirmar" as const,
    },
    {
      p: "Como e quando faço o pagamento?",
      r: "As orientações de pagamento ainda serão divulgadas pela organização.",
      status: "a-confirmar" as const,
    },
  ],

  /** Mostrado na confirmação de inscrição. Ajuste quando houver forma de pagamento definida. */
  proximosPassos: [
    "Este cadastro não confirma pagamento.",
    "A organização divulgará as orientações de pagamento e os próximos passos.",
    "Guarde esta tela (um print ajuda) e, em caso de dúvida, procure a liderança da Conexão Jovem.",
  ],

  /** Regras do retiro. Vazio = página mostra "em elaboração". PUBLICAR antes de abrir as inscrições. */
  regras: [] as string[],

  contato: {
    whatsapp: null as string | null, // somente dígitos com DDI, ex.: "5535999999999"
    instagram: null as string | null, // URL completa
    email: null as string | null,
  },

  /** Versão do texto de regras/privacidade aceita no formulário (vai para a planilha). */
  versaoTermos: "2026-10-rascunho",
};

/*
Exemplo de programação (cole em `programacao` quando for confirmada):

programacao: [
  {
    titulo: "Sexta-feira",
    data: "12/02/2027",
    itens: [
      { hora: "18h", titulo: "Chegada e acolhimento" },
      { hora: "20h", titulo: "Culto de abertura" },
    ],
  },
],
*/
