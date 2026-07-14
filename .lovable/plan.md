# Landing Page — Retiro Conexão Jovem

Substituir totalmente o app atual de slides (PBTX) por uma Landing Page moderna, estilo Apple, para o Retiro Conexão Jovem no sítio Santa Clara (Campos do Jordão – SP). Antes de escrever código, este plano define arquitetura, navegação, wireframe, componentes, dados e estratégia de mídia — conforme você pediu.

---

## 1. Arquitetura das páginas

Site single-page com seções âncora + páginas secundárias para conteúdo denso.

```text
/                     Landing principal (hero + todas as seções)
/local                Santa Clara em detalhe (tour + estrutura)
/galeria              Galeria completa (fotos por categoria + vídeos)
/programacao          Programação expandida com timeline
/inscricao            Checkout / formulário de inscrição
/faq                  FAQ completa
/estudo               Área restrita: viabilidade, riscos, SWOT, regional, família
                      (protegida por senha simples — só líderes/pastor)
```

A landing `/` traz resumos e CTAs; as páginas internas aprofundam.

## 2. Mapa de navegação

```text
Header fixo (glass)
 ├── Logo Conexão Jovem
 ├── Links: Retiro · Local · Galeria · Programação · Valores · FAQ
 └── CTA "Inscreva-se"

Landing /
 ├── Hero (imagem cheia + contador regressivo)
 ├── Sobre o Retiro
 ├── Conheça o Santa Clara         → /local
 ├── Galeria (preview)             → /galeria
 ├── Estrutura (cards)
 ├── Programação (resumo)          → /programacao
 ├── O que está incluso
 ├── Valores + composição do R$400
 ├── Depoimentos
 ├── FAQ (top 5)                   → /faq
 ├── Localização (mapa)
 ├── CTA final
 └── Footer (redes, contato, link discreto /estudo)
```

## 3. Wireframe textual (landing)

```text
┌──────────────────────────────────────────┐
│ HERO — imagem full-bleed + overlay       │
│  "Conexão Jovem 2026"                    │
│  subtítulo curto + versículo             │
│  [Quero participar] [Conheça o local]    │
│  ⏳ 00d 00h 00m 00s                       │
├──────────────────────────────────────────┤
│ SOBRE — 3 cards (Propósito / Visão / Você)│
├──────────────────────────────────────────┤
│ SANTA CLARA — split: foto + bullets      │
│ [Ver tour completo →]                    │
├──────────────────────────────────────────┤
│ GALERIA — abas (Fotos | Vídeos)          │
│  Fotos: chips de categoria + carrossel   │
│  Vídeos: grid de cards separados         │
├──────────────────────────────────────────┤
│ ESTRUTURA — grid de 9 cards com ícones   │
├──────────────────────────────────────────┤
│ PROGRAMAÇÃO — timeline (Manhã/Tarde/Noite)│
├──────────────────────────────────────────┤
│ INCLUSO — 9 chips ✔                       │
├──────────────────────────────────────────┤
│ VALORES — card com R$400, parcelamento,  │
│  PIX/QR + expandível "onde vai seu R$"   │
├──────────────────────────────────────────┤
│ DEPOIMENTOS — carrossel                  │
├──────────────────────────────────────────┤
│ FAQ — accordion (5 principais)           │
├──────────────────────────────────────────┤
│ LOCALIZAÇÃO — mapa + tempo de viagem     │
├──────────────────────────────────────────┤
│ CTA FINAL — full-bleed "Sua vaga espera" │
├──────────────────────────────────────────┤
│ FOOTER                                   │
└──────────────────────────────────────────┘
```

## 4. Componentes necessários

- Layout: `SiteHeader`, `SiteFooter`, `Section`, `Container`
- Hero: `Hero`, `Countdown`, `CtaPair`
- Conteúdo: `FeatureCard`, `IconCard`, `SplitBlock`, `Stat`
- Galeria: `GalleryTabs`, `CategoryChips`, `PhotoCarousel`, `VideoCard`, `Lightbox`
- Programação: `Timeline`, `TimelineItem`, `PeriodTabs`
- Valores: `PriceCard`, `PixQr`, `CostBreakdown` (expansível)
- Sociais: `TestimonialCarousel`, `TestimonialCard`
- Utilidade: `Faq`, `MapEmbed`, `AnchorNav`, `ScrollProgress`
- Estudo (rota protegida): `SwotGrid`, `RiskMatrix`, `BudgetTable`, `ScenarioCard`

Base: shadcn/ui + Tailwind v4 + framer-motion. Ícones lucide-react.

## 5. Estrutura de dados (`src/content/retiro.ts` + JSON)

```ts
type Retiro = {
  edicao: string;               // "2026"
  data: { inicio: string; fim: string };
  local: { nome: string; cidade: string; uf: string; mapsUrl: string };
  hero: { titulo: string; subtitulo: string; versiculo: string; imagem: string };
  sobre: { proposito: string; visao: string; publico: string };
  estrutura: { icone: string; titulo: string; descricao: string }[];
  programacao: { dia: string; blocos: { periodo: "manha"|"tarde"|"noite"; itens: string[] }[] }[];
  incluso: string[];
  valores: { inscricao: number; parcelamento: string; pix: string; qrImage: string;
             composicao: { rotulo: string; valor: number }[] };
  faq: { pergunta: string; resposta: string }[];
  depoimentos: { nome: string; texto: string; foto?: string; videoUrl?: string }[];
};
```

Mídia separada em `src/content/media.json`:

```json
{
  "fotos": {
    "fachada": [], "vista_aerea": [], "salao_principal": [], "auditorio": [],
    "dormitorios": [], "quartos": [], "cozinha": [], "refeitorio": [],
    "area_externa": [], "piscina": [], "salas": [], "convivencia": []
  },
  "videos": {
    "tour_geral": "", "drone": "", "salao": "", "dormitorios": "",
    "piscina": "", "outros": []
  }
}
```

Estudo (rota protegida) em `src/content/estudo.ts`: custos, riscos, SWOT, regional, família, reserva técnica.

## 6. Estratégia de mídia (Google Drive → site)

Recomendação, do mais simples ao mais robusto:

1. **JSON manual (fase 1 — recomendado para começar)**: você cola em `media.json` os IDs/URLs. Para Drive, converter link de compartilhamento em URL direta:
   - Foto: `https://drive.google.com/thumbnail?id=<ID>&sz=w2000`
   - Vídeo: embed `https://drive.google.com/file/d/<ID>/preview`
   Helper `driveImage(id)` / `driveVideo(id)` no código evita boilerplate.
2. **Script de sync (fase 2)**: um script Node lista uma pasta via Google Drive API (API key de leitura pública) e gera `media.json` automaticamente. Basta rodar `bun run sync:media` sempre que subir mídia nova.
3. **Google Photos**: API é limitada (não lista álbuns públicos sem OAuth do dono) — evitar.
4. **Cloudinary / R2**: melhor performance e compressão automática; fica como upgrade futuro.

Começamos com (1), deixamos (2) preparado para quando você tiver a pasta pública.

## 7. Sugestões adicionais (o que ainda não foi considerado)

- **Área do inscrito** (fase futura, com Lovable Cloud): login por e-mail, ver comprovante, baixar termo, ver quarto/ônibus.
- **Termo de responsabilidade** digital (menores de idade) assinável no cadastro.
- **Seguro-viagem/assistência** — item de custo real quase sempre esquecido.
- **Kit de divulgação** (`/kit`) com artes prontas para stories, versículos, contagem regressiva — vira motor de compartilhamento orgânico.
- **Rastreamento**: GA4 + eventos por CTA para medir conversão.
- **PWA já existente**: reaproveitar o service worker para funcionar offline no local (sinal fraco em Campos do Jordão).
- **Modo alto contraste / acessibilidade**: bom para líderes mais velhos apresentarem.
- **Comparativo "retiro anterior × Santa Clara"** — reforça o salto de qualidade.
- **Meta de inscrições** com barra de progresso (gamificação suave).
- **Página de agradecimento pós-inscrição** com próximos passos + grupo de WhatsApp.

## Passos de implementação (após sua aprovação)

1. Remover conteúdo PBTX: `src/lib/pbtxSlides.ts`, `src/routes/index.tsx` atual, CSS de deck, asset do pptx, manifest antigo.
2. Instalar `framer-motion` e componentes shadcn base (button, card, tabs, accordion, dialog, carousel).
3. Criar design tokens no `src/styles.css` (paleta escura sofisticada + serifa display + sans neutra).
4. Montar `SiteHeader`/`SiteFooter` e layout raiz.
5. Landing `/` com todas as seções usando dados de `content/retiro.ts` + `media.json`.
6. Rotas `/local`, `/galeria`, `/programacao`, `/faq`, `/inscricao`, `/estudo` (protegida por senha simples client-side + prompt).
7. Ajustar PWA (nome, ícones, manifest, cache das seções principais).
8. SEO por rota (title, description, og) e sitemap.

## Perguntas rápidas antes de codar

- **Data do retiro** e horário — para o contador regressivo real.
- **Cores de marca** do Conexão Jovem (tem logo/paleta?) ou proponho paleta nova.
- **Fotos/vídeos já disponíveis** (mesmo poucas) para não ficar com placeholders.
- **Inscrição**: só formulário + PIX manual, ou integração com pagamento (Stripe/Mercado Pago)?
- **Página /estudo**: senha simples ou totalmente pública?

Se estiver ok com este plano, respondo suas perguntas curtinhas acima e já começo pela fundação visual + hero.
