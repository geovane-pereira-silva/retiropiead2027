// ============================================================================
// Retiro de Carnaval 2027 — Fonte única de dados da apresentação executiva.
// Todos os números são placeholder realistas; ajuste sem tocar em componentes.
// ============================================================================

export const retiro = {
  edicao: "2027",
  nome: "Retiro de Carnaval",
  publicoAlvo: "Jovens · Famílias · Convidados",

  dataInicio: "2027-02-05T18:00:00-03:00",
  dataFim: "2027-02-09T14:00:00-03:00",
  dataTexto: "5 a 9 de Fevereiro de 2027 · Carnaval",
  dias: 5,

  local: {
    nome: "Sítio de Retiro Espiritual Campos do Jordão",
    cidade: "Campos do Jordão",
    uf: "SP",
    mapsUrl: "https://maps.google.com/?q=Campos+do+Jord%C3%A3o+SP",
    tempoViagem: "≈ 3h de São Paulo",
    capacidadeCamas: 140,
    capacidadeMax: 200,
  },

  // ─── 1. Resumo Executivo ────────────────────────────────────────────────
  resumo: {
    objetivo:
      "Realizar o Retiro de Carnaval 2027 em novo local, elevando o padrão de estrutura, comunhão e crescimento espiritual.",
    justificativa:
      "O local anterior atingiu seu limite operacional. O sítio de Campos do Jordão oferece mais estrutura, conforto e capacidade de expansão futura.",
    beneficios: [
      "Estrutura completa com dormitórios, refeitório e auditórios",
      "Capacidade para até 200 pessoas — permite crescimento",
      "Ambiente natural e preparado para retiros cristãos",
      "Fortalecimento da comunhão e da identidade do ministério",
    ],
    desafios: [
      "Aumento no custo de transporte (distância maior)",
      "Necessidade de mobilizar mais inscritos para viabilidade",
      "Logística de alimentação e limpeza mais robusta",
      "Coordenação de equipe de apoio ampliada",
    ],
  },

  // ─── 2. Diferenciais do local ───────────────────────────────────────────
  diferenciais: [
    { titulo: "140 camas", desc: "Estrutura para até 200 com colchões extras." },
    { titulo: "Salão principal", desc: "Espaço amplo para cultos e ministrações." },
    { titulo: "Auditório secundário", desc: "Workshops, discipulado e reuniões paralelas." },
    { titulo: "Cozinha industrial", desc: "Refeições completas produzidas no local." },
    { titulo: "Piscina e lazer", desc: "Área externa ampla, natureza da Mantiqueira." },
    { titulo: "Salas de aula", desc: "Ambientes reservados para discipulado." },
  ],

  // ─── 3. Comparativo entre locais ────────────────────────────────────────
  comparativo: {
    anteriorNome: "Local anterior",
    novoNome: "Sítio de Retiro Espiritual Campos do Jordão",
    criterios: [
      { criterio: "Capacidade (camas)",       anterior: "≈ 90",       novo: "140",              melhor: "novo" as const },
      { criterio: "Capacidade máxima",        anterior: "≈ 120",      novo: "200",              melhor: "novo" as const },
      { criterio: "Distância de SP",          anterior: "≈ 1h30",     novo: "≈ 3h",             melhor: "anterior" as const },
      { criterio: "Salão principal",          anterior: "Adequado",   novo: "Amplo e moderno",  melhor: "novo" as const },
      { criterio: "Auditório secundário",     anterior: "Não possui", novo: "Sim",              melhor: "novo" as const },
      { criterio: "Dormitórios",              anterior: "Limitados",  novo: "Amplos e variados", melhor: "novo" as const },
      { criterio: "Áreas de lazer",           anterior: "Básicas",    novo: "Piscina + natureza", melhor: "novo" as const },
      { criterio: "Espaços para cultos",      anterior: "1",          novo: "2",                melhor: "novo" as const },
      { criterio: "Potencial de crescimento", anterior: "Limitado",   novo: "Alto",             melhor: "novo" as const },
      { criterio: "Custo do local",           anterior: "≈ R$ 4.500", novo: "R$ 10.000",        melhor: "anterior" as const },
      { criterio: "Custo transporte",         anterior: "≈ R$ 1.500", novo: "≈ R$ 8.000",       melhor: "anterior" as const },
    ],
  },

  // ─── 4. Estudo Financeiro ───────────────────────────────────────────────
  financas: {
    inscricao: 400,
    metaParticipantes: 140,
    // Composição unitária da inscrição (por pessoa)
    composicaoUnitaria: [
      { rotulo: "Alimentação",            valor: 120 },
      { rotulo: "Camiseta",               valor:  35 },
      { rotulo: "Hospedagem + estrutura", valor: 145 },
      { rotulo: "Transporte",             valor:  60 },
      { rotulo: "Brindes + material",     valor:  25 },
      { rotulo: "Reserva técnica",        valor:  15 },
    ],
    // Custos fixos (independem do nº de inscritos)
    custosFixos: [
      { rotulo: "Locação do sítio",       valor: 10000 },
      { rotulo: "Transporte (ônibus)",    valor:  8000 },
      { rotulo: "Preletor (oferta)",      valor:  2000 },
      { rotulo: "Cantor convidado",       valor:  1500 },
      { rotulo: "Decoração",              valor:  1500 },
      { rotulo: "Equipamentos e som",     valor:  2000 },
      { rotulo: "Reserva técnica",        valor:  2000 },
    ],
    // Custos variáveis (por participante)
    custosVariaveis: [
      { rotulo: "Alimentação (5 dias)",   valor: 120 },
      { rotulo: "Camiseta oficial",       valor:  35 },
      { rotulo: "Kit participante",       valor:  25 },
    ],
    anterior: {
      participantes: 90,
      inscricao: 320,
      receita: 90 * 320,
      custo: 22000,
    },
  },

  // ─── 5. Cenários ────────────────────────────────────────────────────────
  cenarios: [
    { nome: "Conservador", participantes:  80, inscricao: 400 },
    { nome: "Provável",    participantes: 120, inscricao: 400 },
    { nome: "Otimista",    participantes: 160, inscricao: 400 },
  ],

  // ─── 6. Riscos (prob e impacto 1-5) ─────────────────────────────────────
  riscos: [
    { risco: "Baixo número de inscritos",    prob: 3, impacto: 5, mitigacao: "Campanha antecipada, parcelamento, engajamento das células." },
    { risco: "Aumento de combustível",       prob: 4, impacto: 3, mitigacao: "Contratar ônibus com preço travado 90 dias antes." },
    { risco: "Falha no transporte",          prob: 2, impacto: 5, mitigacao: "Contrato com empresa reserva e checklist pré-viagem." },
    { risco: "Falha na alimentação",         prob: 2, impacto: 4, mitigacao: "Cozinha própria + fornecedor local reserva." },
    { risco: "Logística de check-in",        prob: 3, impacto: 2, mitigacao: "App/planilha de conferência, equipe treinada." },
    { risco: "Infraestrutura (energia/água)",prob: 2, impacto: 3, mitigacao: "Vistoria prévia e contatos locais de emergência." },
    { risco: "Equipe voluntária insuficiente",prob: 3, impacto: 4, mitigacao: "Recrutamento com 90 dias, escalas por área." },
    { risco: "Clima adverso",                prob: 3, impacto: 2, mitigacao: "Plano B indoor para atividades externas." },
    { risco: "Custos não previstos",         prob: 4, impacto: 3, mitigacao: "Reserva técnica de 8% do orçamento." },
    { risco: "Inadimplência",                prob: 4, impacto: 3, mitigacao: "Pagamento antecipado + política clara de reembolso." },
  ],

  // ─── 7. Custos adicionais (mapeamento completo) ─────────────────────────
  custosExtras: [
    { categoria: "Ministração", item: "Oferta ao preletor",     valor: 2000 },
    { categoria: "Ministração", item: "Transporte do preletor", valor:  600 },
    { categoria: "Ministração", item: "Hospedagem preletor",    valor:  400 },
    { categoria: "Ministração", item: "Cantor convidado",       valor: 1500 },
    { categoria: "Logística",   item: "Combustível apoio",      valor:  400 },
    { categoria: "Logística",   item: "Pedágios",               valor:  300 },
    { categoria: "Logística",   item: "Internet local",         valor:  200 },
    { categoria: "Estrutura",   item: "Decoração",              valor: 1500 },
    { categoria: "Estrutura",   item: "Brindes e gincanas",     valor: 1200 },
    { categoria: "Estrutura",   item: "Materiais gerais",       valor:  800 },
    { categoria: "Estrutura",   item: "Equipamentos e som",     valor: 2000 },
    { categoria: "Estrutura",   item: "Manutenção",             valor:  500 },
    { categoria: "Saúde",       item: "Primeiros socorros",     valor:  400 },
    { categoria: "Saúde",       item: "Medicamentos básicos",   valor:  200 },
    { categoria: "Reserva",     item: "Reserva técnica (8%)",   valor: 2000 },
  ],

  // ─── 8. SWOT ────────────────────────────────────────────────────────────
  swot: {
    forcas: [
      "Ministério jovem consolidado",
      "Base fiel de participantes recorrentes",
      "Equipe de liderança engajada",
      "Cultura de comunhão e discipulado",
    ],
    fraquezas: [
      "Dependência de poucos organizadores",
      "Fluxo de caixa apertado até as inscrições",
      "Processos de inscrição ainda manuais",
    ],
    oportunidades: [
      "Convite a outras igrejas da região",
      "Ampliação para famílias e casais",
      "Novo local permite crescimento anual",
      "Fortalecer identidade do ministério",
    ],
    ameacas: [
      "Aumento de combustível e alimentação",
      "Concorrência de outros eventos no Carnaval",
      "Instabilidade econômica dos participantes",
    ],
  },

  // ─── 9. Oportunidades de crescimento ────────────────────────────────────
  crescimento: [
    {
      titulo: "Convite a outras igrejas",
      descricao: "Abrir vagas para ADs e igrejas parceiras da região.",
      vantagens: ["Comunhão entre igrejas", "Diluição de custos fixos", "Rede ministerial ampliada"],
      desafios: ["Alinhamento doutrinário", "Coordenação de líderes múltiplos"],
      impacto: "+30 a +50 participantes potenciais.",
    },
    {
      titulo: "Retiro família",
      descricao: "Quartos familiares para casais e famílias com filhos.",
      vantagens: ["Novo público", "Ministração intergeracional", "Fidelização"],
      desafios: ["Programação infantil", "Monitores dedicados"],
      impacto: "+20 a +40 participantes de perfil recorrente.",
    },
    {
      titulo: "Expansão plurianual",
      descricao: "Consolidar Campos do Jordão como sede oficial por 3 anos.",
      vantagens: ["Contrato antecipado com melhor preço", "Curva de aprendizado", "Marca reconhecida"],
      desafios: ["Compromisso financeiro plurianual"],
      impacto: "Redução de custo unitário ao longo do tempo.",
    },
    {
      titulo: "Fortalecimento entre igrejas",
      descricao: "Retiro regional com preletores rotativos.",
      vantagens: ["Impacto regional", "Comunhão do corpo"],
      desafios: ["Governança do evento"],
      impacto: "Posicionamento como referência regional.",
    },
  ],

  // ─── 10. Conclusão ──────────────────────────────────────────────────────
  conclusao: {
    beneficios: [
      "Estrutura superior ao local anterior",
      "Espaço para crescer nos próximos anos",
      "Experiência espiritual mais completa",
    ],
    riscosPrincipais: [
      "Ponto de equilíbrio depende de 90+ inscritos",
      "Custo de transporte quase 5× maior",
    ],
    condicoes: [
      "Iniciar inscrições com 6 meses de antecedência",
      "Fechar contrato do ônibus com 90 dias de antecedência",
      "Reserva técnica mínima de 8% do orçamento",
      "Meta mínima: 90 inscritos até 60 dias antes",
    ],
    recomendacoes: [
      "Aprovar o retiro no Sítio de Retiro Espiritual Campos do Jordão para 2027",
      "Formar comitê organizador com áreas definidas",
      "Abrir inscrições com condição promocional inicial",
    ],
    proximosPassos: [
      { quando: "Ago/2026", oque: "Aprovação formal da liderança" },
      { quando: "Set/2026", oque: "Assinatura do contrato com Campos do Jordão" },
      { quando: "Out/2026", oque: "Abertura das inscrições" },
      { quando: "Nov/2026", oque: "Contratação de transporte" },
      { quando: "Fev/2027", oque: "Realização do retiro" },
    ],
  },

  // ─── Instagram (opcional) ───────────────────────────────────────────────
  instagram: [] as { url: string; titulo: string; descricao?: string; thumb?: string }[],
};

export type Retiro = typeof retiro;

// ─── Helpers financeiros ──────────────────────────────────────────────────
export function calcCenario(participantes: number, inscricao = retiro.financas.inscricao) {
  const custoFixo = retiro.financas.custosFixos.reduce((s, c) => s + c.valor, 0);
  const custoVarUnit = retiro.financas.custosVariaveis.reduce((s, c) => s + c.valor, 0);
  const receita = participantes * inscricao;
  const custoTotal = custoFixo + custoVarUnit * participantes;
  const saldo = receita - custoTotal;
  return { participantes, inscricao, receita, custoFixo, custoVarUnit, custoTotal, saldo };
}

export function pontoEquilibrio(inscricao = retiro.financas.inscricao) {
  const custoFixo = retiro.financas.custosFixos.reduce((s, c) => s + c.valor, 0);
  const custoVarUnit = retiro.financas.custosVariaveis.reduce((s, c) => s + c.valor, 0);
  const margemUnit = inscricao - custoVarUnit;
  if (margemUnit <= 0) return Infinity;
  return Math.ceil(custoFixo / margemUnit);
}

export function totalCustosFixos() {
  return retiro.financas.custosFixos.reduce((s, c) => s + c.valor, 0);
}
export function totalCustosVariaveisPorPessoa() {
  return retiro.financas.custosVariaveis.reduce((s, c) => s + c.valor, 0);
}
