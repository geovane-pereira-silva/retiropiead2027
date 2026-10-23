// ============================================================================
// Conteúdo PÚBLICO da landing page do retiro — fonte única editável.
//
// Para mudar datas, valores, programação, FAQ ou textos, edite apenas este
// arquivo (e src/content/media.json para fotos/vídeos). Nenhum componente
// precisa ser alterado.
//
// Regra do projeto: nada aqui pode ser inventado. Tudo o que ainda não foi
// confirmado pela organização fica como `null`, lista vazia ou marcado
// `status: "a-confirmar"`, e a página mostra "a divulgar" automaticamente.
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
  tipo: "Retiro para famílias",
  ministerio: "Conexão Jovem",
  igreja: "Primeira Assembleia de Deus",
  igrejaCidade: "Santa Rita do Sapucaí, MG",

  /** Tema oficial ainda não informado. Preencha com texto para aparecer no topo. */
  tema: null as string | null,

  fraseImpacto: "Dias para buscar a Deus juntos, fortalecer a família e renovar a comunhão cristã.",

  // Datas (somente dia; o horário de chegada e saída ainda não foi definido).
  // A idade de cada participante é calculada na data de início.
  inicioData: "2027-02-05",
  fimData: "2027-02-09",
  dataTexto: "5 a 9 de fevereiro de 2027",
  periodoNota: "Sexta a terça-feira · período de Carnaval",

  // CONFIRMAR com a organização antes de divulgar.
  local: {
    nome: "Sítio Santa Clara",
    cidade: "Campos do Jordão",
    uf: "SP",
    mapsUrl: null as string | null,
  },

  /**
   * Valores por pessoa, conforme a idade na data de início.
   * `valor: null` = a definir (nenhuma cobrança automática).
   * ATENÇÃO: confirmar com a organização se continuam válidos para o retiro familiar.
   */
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

  /** Limite técnico de pessoas por envio (evita abuso). Famílias maiores fazem um segundo envio. */
  maxParticipantesPorInscricao: 10,

  sobre: [
    {
      titulo: "Buscar a Deus juntos",
      texto:
        "Cultos, adoração e oração em família, em dias separados para estar na presença do Senhor.",
    },
    {
      titulo: "Estudo da Palavra",
      texto: "Momentos de estudo bíblico para fortalecer a fé de todos os que participam.",
    },
    {
      titulo: "Família fortalecida",
      texto: "Tempo de qualidade para pais, filhos e casais viverem a fé dentro de casa.",
    },
    {
      titulo: "Comunhão e descanso",
      texto: "Convivência entre as famílias da igreja, com espaço também para descansar.",
    },
  ],

  /** Destaques do local. Só o que a organização informou — sem números nem comodidades inventadas. */
  localDestaques: [
    {
      titulo: "Quartos familiares",
      texto: "A hospedagem é pensada para acomodar as famílias.",
      status: "a-confirmar" as const,
      nota: "Distribuição e ocupação dos quartos serão divulgadas pela organização.",
    },
    {
      titulo: "Área para cultos, oração e estudos",
      texto: "Espaço próprio para os cultos, os momentos de oração e os estudos bíblicos.",
      status: "a-confirmar" as const,
      nota: "Detalhes do espaço serão divulgados pela organização.",
    },
    {
      titulo: "Espaços de convivência",
      texto: "Lugares para as famílias conviverem e criarem comunhão.",
      status: "a-confirmar" as const,
      nota: "Detalhes serão divulgados pela organização.",
    },
  ],

  informacoes: [
    {
      id: "hospedagem",
      titulo: "Hospedagem",
      status: "a-confirmar",
      texto:
        "A proposta inclui quartos familiares, destinados à acomodação das famílias. A distribuição dos quartos, a ocupação e demais detalhes serão divulgados pela organização.",
    },
    {
      id: "alimentacao",
      titulo: "Alimentação",
      status: "a-confirmar",
      texto:
        "A organização divulgará quais refeições estão incluídas. Restrições alimentares podem ser informadas no formulário de inscrição.",
    },
    {
      id: "transporte",
      titulo: "Transporte",
      status: "a-confirmar",
      texto:
        "Ainda não há informação confirmada sobre transporte, pontos de saída, horários ou custos. A organização divulgará.",
    },
    {
      id: "orientacoes",
      titulo: "Orientações",
      status: "confirmado",
      texto: "Para a inscrição da família:",
      itens: [
        "Uma pessoa maior de idade faz a inscrição e cadastra todos os integrantes da família que vão participar.",
        "Cada participante informa nome e data de nascimento; o valor é calculado pela idade em 05/02/2027.",
        "O CPF é obrigatório para maiores de 18 anos e opcional para menores.",
        "Informe um contato de emergência e, se houver, necessidades de hospedagem ou alimentação.",
        "O envio do formulário é um cadastro e não confirma pagamento.",
      ],
    },
  ] as InfoCard[],

  /** Proposta geral das atividades. Horários e detalhes ainda não foram definidos. */
  atividades: [
    { titulo: "Cultos e adoração", texto: "Momentos de louvor e de Palavra para toda a família." },
    { titulo: "Oração", texto: "Tempos de oração pessoal, em família e em conjunto." },
    { titulo: "Estudos bíblicos", texto: "Estudo da Palavra de Deus durante o retiro." },
    {
      titulo: "Comunhão entre as famílias",
      texto: "Convivência e partilha entre as famílias da igreja.",
    },
    { titulo: "Convivência e descanso", texto: "Tempo para estar juntos e também para repousar." },
    {
      titulo: "Atividades em família",
      texto: "Serão divulgadas se e quando forem confirmadas pela organização.",
    },
  ],

  /** Vazio = a seção mostra "horários a divulgar". Exemplo de preenchimento ao final do arquivo. */
  programacao: [] as DiaProgramacao[],

  faq: [
    {
      p: "Quem pode participar do retiro?",
      r: "O retiro é voltado às famílias da Primeira Assembleia de Deus de Santa Rita do Sapucaí, com organização da Conexão Jovem. Informações sobre convidados serão divulgadas pela organização.",
      status: "a-confirmar" as const,
    },
    {
      p: "Como funciona a inscrição da família?",
      r: "Uma pessoa maior de idade faz a inscrição e cadastra cada integrante da família que vai participar, com nome e data de nascimento. O valor de cada pessoa e o total aparecem antes do envio, e no final você recebe uma tela de confirmação do cadastro.",
      status: "confirmado" as const,
    },
    {
      p: "Quais são os valores por faixa etária?",
      r: "Menores de 5 anos: valor a definir pela organização. De 5 a 9 anos: R$ 200,00. A partir de 10 anos: R$ 400,00. A idade é calculada em 05/02/2027, data de início do retiro. Os valores serão confirmados pela organização para o formato familiar.",
      status: "confirmado" as const,
    },
    {
      p: "Crianças pagam inscrição?",
      r: "Crianças de 5 a 9 anos pagam R$ 200,00. Para menores de 5 anos, o valor ainda será definido pela organização, e por isso nenhuma cobrança é calculada automaticamente.",
      status: "confirmado" as const,
    },
    {
      p: "Qual é a data e o período do retiro?",
      r: "De sexta-feira, 5 de fevereiro, a terça-feira, 9 de fevereiro de 2027, no período de Carnaval. Os horários de chegada e saída ainda serão divulgados.",
      status: "confirmado" as const,
    },
    {
      p: "Como funciona a hospedagem em quartos familiares?",
      r: "A proposta inclui quartos familiares, destinados à acomodação das famílias. A distribuição dos quartos e as regras de ocupação ainda serão divulgadas pela organização.",
      status: "a-confirmar" as const,
    },
    {
      p: "A alimentação está incluída?",
      r: "Essa informação será divulgada pela organização.",
      status: "a-confirmar" as const,
    },
    {
      p: "Como será organizado o transporte?",
      r: "Essa informação será divulgada pela organização.",
      status: "a-confirmar" as const,
    },
    {
      p: "O que é necessário levar?",
      r: "A lista do que levar será divulgada pela organização.",
      status: "a-confirmar" as const,
    },
    {
      p: "Como será a programação dos cultos e estudos bíblicos?",
      r: "A proposta inclui cultos, oração e estudos bíblicos. Horários, temas e ministradores ainda serão divulgados pela organização.",
      status: "a-confirmar" as const,
    },
    {
      p: "Enviar o formulário confirma meu pagamento?",
      r: "Não. O formulário registra o cadastro da família. O envio não significa pagamento confirmado.",
      status: "confirmado" as const,
    },
    {
      p: "Como confirmo o pagamento?",
      r: "As orientações de pagamento ainda serão divulgadas pela organização.",
      status: "a-confirmar" as const,
    },
    {
      p: "Por que preciso informar o CPF?",
      r: "O CPF identifica a inscrição e evita cadastros duplicados. É obrigatório para maiores de 18 anos e opcional para menores.",
      status: "confirmado" as const,
    },
    {
      p: "Com quem falo em caso de dúvidas?",
      r: "Procure a liderança da Conexão Jovem. Os contatos oficiais serão divulgados nesta página.",
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
    data: "05/02/2027",
    itens: [
      { hora: "18h", titulo: "Chegada e acolhimento" },
      { hora: "20h", titulo: "Culto de abertura" },
    ],
  },
],
*/
