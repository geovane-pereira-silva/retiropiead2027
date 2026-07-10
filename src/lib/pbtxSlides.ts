export type SlidePart =
  | { kind: "heading"; text: string }
  | { kind: "text"; text: string }
  | { kind: "label"; text: string }
  | { kind: "verse"; ref: string; text: string }
  | { kind: "quote"; text: string }
  | { kind: "list"; items: string[] };

export type Slide = {
  id: number;
  kicker: string;
  parts: SlidePart[];
};

export const slides: Slide[] = [
  {
    id: 1,
    kicker: "Slide 1 — Título",
    parts: [
      { kind: "heading", text: "O CLAMOR QUE MOVE A MÃO DE DEUS" },
      { kind: "label", text: "Texto Base" },
      {
        kind: "verse",
        ref: "Juízes 6:6",
        text: "\"Assim Israel ficou muito debilitado com a presença dos midianitas; então os filhos de Israel clamaram ao Senhor.\"",
      },
      { kind: "label", text: "Frase de impacto" },
      { kind: "quote", text: "\"Antes da resposta, Deus procura um coração quebrantado.\"" },
      { kind: "label", text: "Aplicação" },
      { kind: "text", text: "Reconheça a sua dependência de Deus e prepare o coração para clamar." },
    ],
  },
  {
    id: 2,
    kicker: "Slide 2 — O pecado gera consequências",
    parts: [
      { kind: "heading", text: "Deus não ignora a desobediência" },
      {
        kind: "verse",
        ref: "Juízes 6:1",
        text: "\"Porém os filhos de Israel fizeram o que era mau aos olhos do Senhor; e o Senhor os deu nas mãos dos midianitas por sete anos.\"",
      },
      {
        kind: "verse",
        ref: "Gálatas 6:7",
        text: "\"Não vos enganeis: de Deus não se zomba; pois tudo o que o homem semear, isso também ceifará.\"",
      },
      { kind: "label", text: "Frase" },
      { kind: "quote", text: "\"O Senhor não tolera desobediência. Pecados contra a autoridade de Deus trazem consequências.\"" },
      { kind: "label", text: "Aplicação" },
      { kind: "text", text: "Examine sua vida: onde a desobediência tem aberto brechas para o inimigo?" },
    ],
  },
  {
    id: 3,
    kicker: "Slide 3 — O pecado rouba a colheita",
    parts: [
      { kind: "heading", text: "O inimigo ataca justamente quando chega o tempo da colheita." },
      {
        kind: "verse",
        ref: "Juízes 6:3-5",
        text: "\"Porque sucedia que, semeando Israel, os midianitas subiam contra ele, e os amalequitas, e os filhos do oriente, subiam contra ele. E punham-se contra ele em campo, e destruíam os frutos da terra, até chegar a Gaza; e não deixavam mantimento em Israel, nem ovelhas, nem bois, nem jumentos. Porque subiam com os seus gados e as suas tendas; vinham como gafanhotos, em tanta multidão, que não se podiam contar, nem a eles nem aos seus camelos; e entravam na terra, para a destruir.\"",
      },
      { kind: "label", text: "Frase" },
      { kind: "quote", text: "\"Sempre que Israel semeava... os inimigos vinham destruir.\"" },
      { kind: "label", text: "Aplicação" },
      { kind: "text", text: "O inimigo não quer impedir apenas o plantio." },
      { kind: "text", text: "Ele quer impedir a colheita." },
    ],
  },
  {
    id: 4,
    kicker: "Slide 4 — Deus espera o clamor",
    parts: [
      { kind: "heading", text: "O céu responde ao arrependimento sincero" },
      {
        kind: "verse",
        ref: "Juízes 6:6",
        text: "\"Então os filhos de Israel clamaram ao Senhor.\"",
      },
      {
        kind: "verse",
        ref: "2 Crônicas 7:14",
        text: "\"E se o meu povo, que se chama pelo meu nome, se humilhar, e orar, e buscar a minha face, e se converter dos seus maus caminhos, então eu ouvirei dos céus, e perdoarei os seus pecados, e sararei a sua terra.\"",
      },
      { kind: "label", text: "Frase" },
      { kind: "quote", text: "\"Não há resposta enquanto não houver sincero clamor.\"" },
      { kind: "label", text: "Aplicação" },
      { kind: "text", text: "Humilhe-se hoje, clame com sinceridade e busque a face de Deus." },
    ],
  },
  {
    id: 5,
    kicker: "Slide 5 — Antes da solução, Deus confronta",
    parts: [
      { kind: "text", text: "Israel queria livramento." },
      { kind: "text", text: "Deus começou falando do pecado." },
      {
        kind: "verse",
        ref: "Juízes 6:8-10",
        text: "\"Eu vos livrei... mas não destes ouvidos à minha voz.\"",
      },
      { kind: "label", text: "Frase" },
      { kind: "quote", text: "\"O que te tira da crise não é apenas apresentar necessidades; é permitir que Deus trate o coração.\"" },
      { kind: "label", text: "Aplicação" },
      { kind: "text", text: "Permita que Deus trate o seu coração antes de pedir o livramento." },
    ],
  },
  {
    id: 6,
    kicker: "Slide 6 — Confissão produz misericórdia",
    parts: [
      {
        kind: "verse",
        ref: "Provérbios 28:13",
        text: "\"O que encobre as suas transgressões jamais prosperará; mas o que as confessa e deixa alcançará misericórdia.\"",
      },
      {
        kind: "verse",
        ref: "1 João 1:9",
        text: "\"Se confessarmos os nossos pecados, ele é fiel e justo para nos perdoar.\"",
      },
      { kind: "label", text: "Frase" },
      { kind: "quote", text: "\"Pare de usar o tempo da oração para se justificar. Use-o para confessar.\"" },
      { kind: "label", text: "Aplicação" },
      { kind: "text", text: "Confesse os seus pecados sem se justificar e alcance a misericórdia de Deus." },
    ],
  },
  {
    id: 7,
    kicker: "Slide 7 — Deus levanta Gideão",
    parts: [
      { kind: "text", text: "Depois do clamor..." },
      { kind: "text", text: "Depois da Palavra..." },
      { kind: "text", text: "Surge Gideão." },
      {
        kind: "verse",
        ref: "Juízes 6:12",
        text: "\"O Senhor é contigo, homem valente.\"",
      },
      {
        kind: "verse",
        ref: "Juízes 6:16",
        text: "\"Porque eu hei de ser contigo, e tu ferirás os midianitas como se fossem um só homem.\"",
      },
      { kind: "label", text: "Frase" },
      { kind: "quote", text: "\"Gideão foi a resposta de Deus ao clamor de Israel.\"" },
      { kind: "label", text: "Aplicação" },
      { kind: "text", text: "Creia que Deus pode levantar você como resposta, mesmo na sua fraqueza." },
    ],
  },
  {
    id: 8,
    kicker: "Slide 8 — Deus usa a prova para formar caráter",
    parts: [
      {
        kind: "verse",
        ref: "Hebreus 12:6",
        text: "\"Porque o Senhor corrige a quem ama.\"",
      },
      {
        kind: "verse",
        ref: "Romanos 5:3-4",
        text: "\"A tribulação produz perseverança; e a perseverança, experiência.\"",
      },
      { kind: "label", text: "Frase" },
      { kind: "quote", text: "\"A escola que forma o caráter chama-se sofrimento.\"" },
      { kind: "label", text: "Aplicação" },
      { kind: "text", text: "Encare as provações como escola de Deus para formar o seu caráter." },
    ],
  },
  {
    id: 9,
    kicker: "Slide 9 — A vitória depende da presença de Deus",
    parts: [
      { kind: "text", text: "Não era o tamanho do exército." },
      { kind: "text", text: "Era quem estava com Gideão." },
      {
        kind: "verse",
        ref: "Juízes 6:16",
        text: "\"Eu serei contigo.\"",
      },
      {
        kind: "verse",
        ref: "Salmo 34:19",
        text: "\"Muitas são as aflições do justo, mas o Senhor de todas o livra.\"",
      },
      { kind: "label", text: "Frase" },
      { kind: "quote", text: "\"O problema nunca foi o tamanho do inimigo. O problema é perder a presença de Deus.\"" },
      { kind: "label", text: "Aplicação" },
      { kind: "text", text: "Busque a presença de Deus acima de qualquer recurso ou força humana." },
    ],
  },
  {
    id: 10,
    kicker: "Slide 10 — Apelo",
    parts: [
      { kind: "heading", text: "Hoje Deus continua ouvindo quem clama." },
      {
        kind: "verse",
        ref: "Salmos 34:17",
        text: "\"Clamam os justos, e o Senhor os escuta e os livra de todas as suas tribulações.\"",
      },
      {
        kind: "verse",
        ref: "Jeremias 33:3",
        text: "\"Clama a mim, e responder-te-ei, e anunciar-te-ei coisas grandes e ocultas, que não sabes.\"",
      },
      { kind: "label", text: "Conclusão" },
      {
        kind: "list",
        items: [
          "O pecado trouxe a opressão.",
          "O clamor trouxe a resposta.",
          "A Palavra trouxe o confronto.",
          "A confissão trouxe misericórdia.",
          "A presença de Deus trouxe a vitória.",
        ],
      },
      { kind: "label", text: "Frase final" },
      {
        kind: "quote",
        text: "\"Quando há arrependimento sincero, Deus transforma o clamor em chamado, o chamado em propósito e o propósito em vitória.\"",
      },
      { kind: "label", text: "Aplicação" },
      { kind: "text", text: "Clame ao Senhor agora; permita que Ele transforme o seu clamor em chamado, propósito e vitória." },
    ],
  },
];
