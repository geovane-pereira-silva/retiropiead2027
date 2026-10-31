// ============================================================================
// Conteúdo PÚBLICO da landing page do retiro — fonte única editável.
//
// Para mudar datas, valores, agenda, FAQ ou textos, edite apenas este arquivo
// (e src/content/media.json para fotos/vídeos). Nenhum componente precisa mudar.
//
// Regra do projeto: nada aqui pode ser inventado. O que a organização ainda não
// confirmou fica como `null`, lista vazia ou marcado como "a divulgar".
// Informações OFICIAIS (confirmadas pela organização) estão marcadas abaixo.
// ============================================================================

import type { Faixa } from "../lib/inscricao";

export type { Faixa };

export const evento = {
  /** false → a página de inscrição exibe o aviso de "inscrições não abertas" */
  inscricoesAbertas: true,

  // ─── Identidade (oficial) ────────────────────────────────────────────────
  nome: "Retiro Conexão Jovem",
  edicao: "2027",
  publico: "Retiro cristão para famílias, adultos e jovens",
  ministerio: "Conexão Jovem",
  igreja: "Primeira Assembleia de Deus",
  igrejaCidade: "Santa Rita do Sapucaí/MG",

  mensagemPrincipal: "Dias para buscar a Deus juntos, fortalecer a família e renovar a comunhão cristã.",

  /** Tema oficial ainda não informado. Se preenchido, aparece no topo. */
  tema: null as string | null,

  // ─── Datas (oficial): 5 a 9 de fevereiro de 2027, sexta a terça ──────────
  inicioData: "2027-02-05",
  fimData: "2027-02-09",
  dataTexto: "5 a 9 de fevereiro de 2027",
  dataCurta: { de: "5", ate: "9", mes: "fevereiro", ano: "2027" },
  diaInicioTexto: "sexta-feira, 5 de fevereiro de 2027",
  diaFimTexto: "terça-feira, 9 de fevereiro de 2027",
  periodoNota: "De sexta a terça-feira, no período de Carnaval",

  // ─── Local (oficial) ─────────────────────────────────────────────────────
  local: {
    nome: "Sítio de Retiro Espiritual Campos do Jordão",
    /** Forma de exibição: a cidade aparece uma única vez. */
    chamada: "Sítio de retiro em Campos do Jordão",
    cidade: "Campos do Jordão",
    uf: "SP",
    /** Link do mapa: só preencher com o endereço confirmado pela organização. */
    mapsUrl: null as string | null,
  },

  /** Diferenciais do local informados pela organização. Não acrescentar nada sem confirmação. */
  estrutura: [
    {
      destaque: "2",
      titulo: "ambientes para cultos e atividades espirituais",
      texto: "Dois espaços destinados aos cultos, à oração e às atividades espirituais do retiro.",
    },
    {
      destaque: "Recreação",
      titulo: "ambiente de recreação",
      texto: "Um ambiente próprio para a recreação e a convivência.",
    },
    {
      destaque: "Jardim",
      titulo: "jardim amplo",
      texto: "Área verde ampla dentro do sítio.",
    },
    {
      destaque: "15 min",
      titulo: "do centro de Campos do Jordão",
      texto: "O sítio fica a aproximadamente 15 minutos do centro da cidade.",
    },
  ],

  // ─── Agenda (oficial). Horários, pregadores e temas ainda não definidos. ──
  rotina: [
    {
      periodo: "Todas as manhãs",
      itens: [
        { titulo: "Devocional", texto: "Começar o dia diante de Deus." },
        {
          titulo: "Gincanas",
          texto: "Para adultos e jovens, realizadas separadamente.",
        },
      ],
    },
    {
      periodo: "Todas as tardes",
      itens: [
        {
          titulo: "Gincanas",
          texto: "Para adultos e jovens, realizadas separadamente.",
        },
      ],
    },
    {
      periodo: "Todas as noites",
      itens: [{ titulo: "Culto de louvor e adoração", texto: "Toda a família reunida." }],
    },
  ],
  vigilia: {
    titulo: "Vigília pentecostal",
    texto:
      "Em uma das noites, uma vigília com oração, louvor, busca espiritual e ministração da Palavra.",
    nota: "O dia da vigília ainda será definido.",
  },
  /** Dias do retiro. `nota` só onde há informação oficial (ida e retorno). */
  dias: [
    { rotulo: "sex", numero: "5", nota: "Ida de ônibus" },
    { rotulo: "sáb", numero: "6", nota: "" },
    { rotulo: "dom", numero: "7", nota: "" },
    { rotulo: "seg", numero: "8", nota: "" },
    { rotulo: "ter", numero: "9", nota: "Retorno de ônibus" },
  ],
  agendaNota: "Horários, pregadores e temas serão divulgados pela organização.",

  // ─── Hospedagem (oficial) ────────────────────────────────────────────────
  hospedagem: {
    familias: {
      titulo: "Famílias",
      texto:
        "Os quartos das famílias são compartilhados, com várias camas. A organização buscará manter cada família acomodada separadamente das demais.",
    },
    jovens: {
      titulo: "Jovens",
      texto: "Os jovens ficam em quartos separados por sexo: quartos para meninas e quartos para meninos.",
    },
    nota: "A distribuição dos quartos será divulgada pela organização.",
  },

  // ─── O que o valor inclui (oficial) ──────────────────────────────────────
  incluso: [
    { titulo: "Hospedagem", texto: "Durante todo o retiro." },
    { titulo: "Quatro refeições por dia", texto: "Durante o retiro." },
    { titulo: "Transporte de ônibus", texto: "Na ida e no retorno." },
  ],
  inclusoCarro:
    "Quem for de carro próprio continua com a hospedagem e as refeições incluídas, e não usa o ônibus da organização.",

  /**
   * Valores por pessoa, conforme a idade em `inicioData`.
   * `valor: null` = a definir (sem cobrança automática); `0` = gratuito.
   * ATENÇÃO: confirmar com a organização se continuam válidos para o formato familiar.
   */
  faixas: [
    { id: "menor-5", rotulo: "Menores de 5 anos", idadeMin: 0, idadeMax: 4, valor: 0 },
    { id: "5-9", rotulo: "De 5 a 9 anos", idadeMin: 5, idadeMax: 9, valor: 200 },
    { id: "10-mais", rotulo: "A partir de 10 anos", idadeMin: 10, idadeMax: null, valor: 400 },
  ] as Faixa[],

  /** Limite técnico de pessoas por envio (evita abuso). Famílias maiores fazem um segundo envio. */
  maxParticipantesPorInscricao: 10,

  // ─── Transporte (oficial) ────────────────────────────────────────────────
  transporte: {
    ida: { dia: "Sexta-feira, 5 de fevereiro de 2027", texto: "Ida de ônibus." },
    retorno: { dia: "Terça-feira, 9 de fevereiro de 2027", texto: "Retorno de ônibus." },
    carroProprio: "Quem preferir pode ir de carro próprio.",
    pendente: "Horários, pontos de embarque e itinerário serão divulgados pela organização.",
  },

  orientacoes: [
    "Uma pessoa maior de idade faz a inscrição e cadastra todos os integrantes da família que vão participar.",
    "Informe a data de nascimento de cada pessoa: o valor é calculado pela idade em 5 de fevereiro de 2027.",
    "Escolha, para cada participante, se vai de ônibus da organização ou de carro próprio.",
    "O CPF é obrigatório para maiores de 18 anos e opcional para menores.",
    "Informe um contato de emergência e, se houver, necessidades de hospedagem ou alimentação.",
    "O envio do formulário registra o cadastro e não confirma pagamento.",
  ],

  faq: [
    {
      p: "O que é o retiro e para quem é?",
      r: "É um retiro cristão para famílias, adultos e jovens, organizado pela Conexão Jovem da Primeira Assembleia de Deus de Santa Rita do Sapucaí/MG. A proposta é buscar a Deus juntos, fortalecer a família e viver a comunhão cristã.",
      aberto: true,
    },
    {
      p: "Quando e onde acontece?",
      r: "De sexta-feira, 5 de fevereiro, a terça-feira, 9 de fevereiro de 2027, no sítio de retiro em Campos do Jordão/SP, a aproximadamente 15 minutos do centro da cidade. O período coincide com o Carnaval.",
    },
    {
      p: "Como funciona a inscrição da família?",
      r: "Uma pessoa maior de idade preenche o formulário e cadastra o responsável e cada integrante da família que vai participar, com nome, data de nascimento e a escolha de transporte. O valor de cada pessoa e o total aparecem antes do envio.",
    },
    {
      p: "Quais são os valores?",
      r: "Menores de 5 anos: gratuito. De 5 a 9 anos: R$ 200,00. A partir de 10 anos: R$ 400,00. A idade é contada em 5 de fevereiro de 2027, data de início do retiro.",
    },
    {
      p: "O que está incluído no valor?",
      r: "Hospedagem, quatro refeições por dia durante o retiro e transporte de ônibus na ida e no retorno.",
    },
    {
      p: "Posso ir de carro próprio?",
      r: "Sim. Quem for de carro próprio continua com a hospedagem e as refeições incluídas e não usa o ônibus da organização.",
    },
    {
      p: "Como será o transporte de ônibus?",
      r: "A ida é na sexta-feira, 5 de fevereiro, e o retorno na terça-feira, 9 de fevereiro de 2027. Horários, pontos de embarque e itinerário serão divulgados pela organização.",
    },
    {
      p: "Como funciona a hospedagem?",
      r: "Os quartos das famílias são compartilhados, com várias camas, e a organização buscará manter cada família separada das demais. Os jovens ficam em quartos separados por sexo.",
    },
    {
      p: "Como são os dias do retiro?",
      r: "Todas as manhãs têm devocional e gincanas; as tardes têm gincanas, sempre separadas para adultos e jovens; e todas as noites há culto de louvor e adoração. Em uma das noites haverá uma vigília pentecostal, em dia ainda a definir.",
    },
    {
      p: "O que é necessário levar?",
      r: "Essa informação será divulgada pela organização.",
      pendente: true,
    },
    {
      p: "Enviar o formulário confirma meu pagamento?",
      r: "Não. O formulário registra o cadastro da família. O envio não significa pagamento confirmado.",
    },
    {
      p: "Como faço o pagamento?",
      r: "As orientações de pagamento serão divulgadas pela organização.",
      pendente: true,
    },
    {
      p: "Por que preciso informar o CPF?",
      r: "O CPF identifica a inscrição e evita cadastros duplicados. É obrigatório para maiores de 18 anos e opcional para menores.",
    },
    {
      p: "Com quem falo em caso de dúvidas?",
      r: "Procure a liderança da Conexão Jovem. Os contatos oficiais serão divulgados nesta página.",
      pendente: true,
    },
  ] as Array<{ p: string; r: string; aberto?: boolean; pendente?: boolean }>,

  /** Mostrado na confirmação de inscrição. Ajuste quando houver forma de pagamento definida. */
  proximosPassos: [
    "Este cadastro não confirma pagamento.",
    "A organização divulgará as orientações de pagamento, os horários e os pontos de embarque do ônibus.",
    "Guarde esta tela (um print ajuda) e, em caso de dúvida, procure a liderança da Conexão Jovem.",
  ],

  /** Regras do retiro. Vazio = a página mostra "em elaboração". PUBLICAR antes de abrir as inscrições. */
  regras: [] as string[],

  contato: {
    whatsapp: null as string | null, // somente dígitos com DDI, ex.: "5535999999999"
    instagram: null as string | null, // URL completa
    email: null as string | null,
  },

  /** Versão do texto de regras/privacidade aceita no formulário (vai para a planilha). */
  versaoTermos: "2026-10-rascunho",
};
