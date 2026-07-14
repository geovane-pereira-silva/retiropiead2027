export type MediaItem = { id?: string; url?: string; caption?: string };

export const retiro = {
  edicao: "2026",
  nome: "Conexão Jovem",
  tema: "Retiro de Jovens",
  dataInicio: "2026-07-10T18:00:00-03:00",
  dataFim: "2026-07-12T14:00:00-03:00",
  dataTexto: "10 a 12 de Julho de 2026",
  local: {
    nome: "Sítio Santa Clara",
    cidade: "Campos do Jordão",
    uf: "SP",
    mapsUrl: "https://maps.google.com/?q=Campos+do+Jord%C3%A3o+SP",
    tempoViagem: "≈ 3h de São Paulo",
  },
  hero: {
    titulo: "Retiro de Jovens",
    subtitulo: "Retiro Conexão Jovem 2026",
    versiculo: "“Como o cervo brama pelas correntes das águas, assim brama a minha alma por ti, ó Deus.” — Salmos 42:1",
  },
  sobre: [
    {
      titulo: "Propósito",
      texto: "Três dias reservados para buscar a Deus, restaurar amizades e mergulhar mais fundo no evangelho.",
    },
    {
      titulo: "Visão",
      texto: "Uma nova geração enraizada em Cristo — firme no caráter, viva na comunhão, ousada na fé.",
    },
    {
      titulo: "Para você",
      texto: "Jovens, líderes, casais e famílias que desejam sair renovados e mais próximos uns dos outros.",
    },
  ],
  estrutura: [
    { icon: "Bed", titulo: "Dormitórios", desc: "140 camas + estrutura para 200 pessoas." },
    { icon: "Church", titulo: "Salão principal", desc: "Espaço para cultos e ministrações." },
    { icon: "Presentation", titulo: "Auditório", desc: "Espaço secundário para workshops." },
    { icon: "GraduationCap", titulo: "Salas de aula", desc: "Ambientes para discipulado." },
    { icon: "UtensilsCrossed", titulo: "Cozinha industrial", desc: "Alimentação completa no local." },
    { icon: "Coffee", titulo: "Refeitório", desc: "Refeições em comunhão." },
    { icon: "Waves", titulo: "Piscina", desc: "Área de lazer supervisionada." },
    { icon: "Trees", titulo: "Áreas verdes", desc: "Natureza da Mantiqueira ao redor." },
    { icon: "Car", titulo: "Estacionamento", desc: "Amplo espaço para veículos e ônibus." },
  ],
  programacao: [
    {
      dia: "Sexta",
      blocos: [
        { periodo: "Tarde", itens: ["Check-in e boas-vindas", "Distribuição dos quartos", "Lanche de chegada"] },
        { periodo: "Noite", itens: ["Culto de abertura", "Ministração", "Momento de oração"] },
      ],
    },
    {
      dia: "Sábado",
      blocos: [
        { periodo: "Manhã", itens: ["Devocional", "Café da manhã", "Estudo bíblico"] },
        { periodo: "Tarde", itens: ["Almoço", "Gincanas e lazer", "Tempo livre"] },
        { periodo: "Noite", itens: ["Culto principal", "Ceia", "Fogueira e comunhão"] },
      ],
    },
    {
      dia: "Domingo",
      blocos: [
        { periodo: "Manhã", itens: ["Devocional final", "Café da manhã", "Culto de encerramento"] },
        { periodo: "Tarde", itens: ["Almoço", "Fotos oficiais", "Retorno"] },
      ],
    },
  ],
  incluso: [
    "Hospedagem",
    "Alimentação completa",
    "Transporte",
    "Camiseta oficial",
    "Kit participante",
    "Programação completa",
    "Gincanas e lazer",
    "Devocionais",
    "Cultos e ministrações",
  ],
  instagram: [
    // Cole aqui links de posts/reels públicos do Instagram.
    // thumb é opcional — se ausente, o card usa gradiente com o título.
    // Exemplo:
    // { url: "https://www.instagram.com/reel/XXXXXXXXXXX/", titulo: "Retiro 2024 — Melhores momentos", descricao: "Um resumo do que Deus fez.", thumb: "" },
  ] as { url: string; titulo: string; descricao?: string; thumb?: string }[],
  valores: {
    inscricao: 400,
    parcelamento: "Em até 4x sem juros no cartão",
    pix: "conexaojovem@igreja.com",
    composicao: [
      { rotulo: "Alimentação", valor: 120 },
      { rotulo: "Camiseta", valor: 35 },
      { rotulo: "Hospedagem, transporte e estrutura", valor: 245 },
    ],
  },
  faq: [
    { q: "Quem pode participar?", a: "Jovens a partir de 13 anos, líderes, casais e famílias da igreja e convidados." },
    { q: "Posso levar crianças?", a: "Sim — teremos quartos familiares e programação adaptada. Combine com a liderança." },
    { q: "Como funciona o transporte?", a: "Ônibus fretado saindo da igreja. Também é possível ir por conta própria." },
    { q: "Posso parcelar?", a: "Sim — em até 4x sem juros no cartão, ou à vista via PIX com desconto especial." },
    { q: "E se eu precisar desistir?", a: "Reembolso conforme política — fale com a secretaria do retiro em até 30 dias antes." },
  ],
  depoimentos: [
    { nome: "Ana", texto: "Voltei renovada. O ambiente do retiro me aproximou de Deus como poucas vezes." },
    { nome: "Lucas", texto: "Fiz amigos para a vida e encontrei um chamado que eu vinha adiando." },
    { nome: "Família Silva", texto: "Como casal, voltamos mais unidos. Nossos filhos amaram cada minuto." },
  ],
};

export type Retiro = typeof retiro;
