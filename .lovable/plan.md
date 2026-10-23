# Reestruturação — Apresentação Executiva do Retiro de Carnaval 2027

Transformar o projeto atual (landing page) em uma **apresentação executiva** para reunião de liderança, mantendo toda a base técnica reaproveitável para virar landing pública depois. Antes de mexer, este é o plano.

## Correção de data

O evento acontece **sexta a terça de Carnaval de 2027** → **05/02/2027 (sex) a 09/02/2027 (ter)**. Todo `dataInicio`, `dataFim`, `dataTexto` e a edição em `retiro.ts` serão atualizados. `edicao: "2027"`.

## Nova arquitetura em uma frase

Um **deck web navegável** de 10 seções (slides) sobre a mesma base React/TanStack já existente, com navegação por teclado/swipe/menu lateral, modo apresentação em tela cheia, e um "flag" de modo (`?mode=landing`) que reaproveita os mesmos dados para virar landing pública no futuro — **sem reconstrução**.

## Rotas

```text
/                    Home do deck — capa + índice + botão "Apresentar"
/deck/$slug          Cada seção (slide). slug = resumo, local, comparativo, ...
/deck/print          Todas as seções empilhadas para impressão / PDF
/inscricao (futuro)  Placeholder — vira landing quando ativar mode=landing
```

Navegação: setas ←/→, `Home`/`End`, `P` para presenter, `Esc` sai. Sidebar/índice recolhível.

## Estrutura de dados (única fonte de verdade)

Toda a apresentação é **data-driven** — nada hardcoded em componente. Isso é o que permite reuso na landing depois.

```ts
// src/content/retiro.ts (expandido)
export const retiro = {
  edicao: "2027",
  dataInicio, dataFim, dataTexto,  // 05–09/02/2027
  local, hero, sobre, estrutura, programacao, incluso, valores, faq, depoimentos,
  instagram,

  // NOVOS blocos:
  comparativo:  { criterios: [...], anterior: {...}, santaClara: {...} },
  financas:     { inscricao, composicao, custosFixos, custosVariaveis, transporte, ... },
  cenarios:     { conservador, provavel, otimista },  // { participantes, receita, custo, saldo }
  riscos:       [{ risco, prob: 1-5, impacto: 1-5, mitigacao }],
  custosExtras: [{ item, valor, categoria, obs }],
  swot:         { forcas: [], fraquezas: [], oportunidades: [], ameacas: [] },
  crescimento:  { outrasIgrejas, familias, expansao, comunhao },  // cada um com {vantagens, desafios, impacto}
  conclusao:    { beneficios, riscos, condicoes, recomendacoes, proximosPassos },
}
```

## As 10 seções (slides)

1. **Resumo Executivo** — 4 KPIs (participantes-alvo, investimento total, ticket médio, ponto de equilíbrio) + 4 cards (Objetivo / Justificativa / Benefícios / Desafios).
2. **Local — Santa Clara** — hero visual + info da estrutura, capacidade, diferenciais + mapa. Galeria de fotos e galeria de vídeos em **módulos independentes** (abas).
3. **Comparativo de Locais** — tabela lado a lado (anterior × Santa Clara) por critério, com destaque visual do vencedor por linha.
4. **Estudo Financeiro** — dashboard com: gráfico de pizza (composição do R$400), barras (custos por categoria), indicadores (ponto de equilíbrio, valor líquido/participante), linha (projeção por nº de participantes), comparativo com retiro anterior.
5. **Cenários** — 3 cards grandes (Conservador / Provável / Otimista) com participantes, receita, custo, saldo, margem — visualmente comparáveis.
6. **Gestão de Riscos** — matriz 5×5 (probabilidade × impacto) como **heatmap** colorido com bolhas por risco + tabela lateral com plano de mitigação.
7. **Custos Adicionais** — tabela agrupada por categoria (Ministração, Logística, Estrutura, Reserva) com subtotais e total.
8. **SWOT** — grid 2×2 clássico.
9. **Oportunidades de Crescimento** — 4 estudos (outras igrejas, famílias, expansão, comunhão) — cada um em card com vantagens/desafios/impacto financeiro.
10. **Conclusão** — recomendação executiva, condições para aprovação, próximos passos com timeline.

## Módulos de mídia (fotos, vídeos, Instagram)

Já existe `src/content/media.json` + `src/lib/drive.ts` (Google Drive) + `src/components/InstagramGallery.tsx`. Vou **reusar tudo** dentro da seção "Local":

- **Fotos do Drive**: por categoria (fachada, dormitórios, etc.), carrossel horizontal com lazy-load. Basta colar IDs do Drive em `media.json`.
- **Vídeos do Drive**: cards com `iframe` `drive.google.com/file/d/{id}/preview` sob demanda (só monta ao clicar). Ninguém precisa de conta.
- **Instagram**: já funciona (opção 3 que aplicamos) — card + modal com embed oficial.

## Componentes novos (reutilizáveis)

- `Slide` (wrapper com kicker + título + navegação)
- `Kpi` (número grande + label + tendência opcional)
- `PieChart`, `BarChart`, `LineChart`, `HeatMap` — recharts (leve, já compatível)
- `ComparisonTable` (linhas com destaque de vencedor)
- `ScenarioCard` (com participantes/receita/custo/saldo animados)
- `RiskMatrix` (heatmap 5×5 com bolhas posicionadas)
- `SwotGrid`
- `MoneyBreakdown` (visual da composição do ticket)
- `SlideNav` (setas, dots, atalhos de teclado)
- `PresenterMode` (fullscreen + timer opcional)

## Reaproveitamento futuro para landing

Todas as seções expõem uma prop `mode: "deck" | "landing"`:
- **deck**: uma seção por viewport, com chrome de slide (kicker, footer, contador).
- **landing**: seções empilhadas em scroll, sem chrome, com CTAs de inscrição.

Uma rota `/inscricao` (futura) monta o modo `landing` com as mesmas seções relevantes (Local, Estrutura, Programação, Valores, FAQ, CTA). Zero reescrita — só flip do modo e ordem das seções.

## Design

- Paleta atual (fundo #08090c, dourado #d8b26a, serifa Fraunces) já é executiva e sóbria — **mantém**. Ajustes: mais espaço branco, hierarquia tipográfica clara, cards com bordas hairline (1px) em vez de sombras.
- Gráficos com paleta neutra (dourado como destaque, verde/vermelho apenas para saldo positivo/negativo).
- **Sem parágrafos longos** — bullets curtos, chips, números grandes. Cada slide entrega **uma ideia**.

## Dependências

- `recharts` — biblioteca de gráficos (React nativo, sem D3 pesado, ~90KB gzip). Alternativa: `visx` (mais leve mas verboso). Recomendo recharts.
- Já temos: `framer-motion`, `lucide-react`, TanStack Router. Suficiente.

## Escopo desta primeira entrega

1. Corrigir datas para Carnaval 2027 (05–09/02/2027).
2. Instalar recharts.
3. Ampliar `retiro.ts` com os blocos novos (números **placeholder realistas** que você refina depois).
4. Criar 10 rotas de seção + rota `/` como índice/capa.
5. Componentes: `Slide`, `Kpi`, gráficos, `ComparisonTable`, `RiskMatrix`, `ScenarioCard`, `SwotGrid`.
6. Navegação por teclado + presenter mode (fullscreen).
7. Rota `/deck/print` empilhada, pronta para "Cmd+P → PDF".
8. Manter galerias existentes (Drive + Instagram) na seção Local.

O que fica **fora** desta primeira entrega (para não inflar demais):
- Landing `/inscricao` — só o placeholder da rota.
- Área protegida por senha — não é mais necessária (o deck é a área executiva).
- Sync automático do Drive — segue por JSON manual como hoje.

## Perguntas antes de implementar

1. **Números-base**: uso valores realistas placeholder (ex.: local R$ 10.000, transporte R$ 8.000, inscrição R$ 400, meta de 140 participantes) e você refina, ou você já tem uma planilha para eu importar?
2. **Preletor / cantor convidado**: já há valor estimado (oferta + hospedagem + transporte)?
3. **Retiro anterior** (para o comparativo): tem custo total e nº de participantes reais do último ano?
4. **Cenário conservador / provável / otimista**: sugiro 80 / 120 / 160 participantes — ok?

Se der ok no plano (e me responder o que puder das 4 perguntas), começo pela correção de datas + fundação do deck + seções 1–3. As demais entram na sequência.
