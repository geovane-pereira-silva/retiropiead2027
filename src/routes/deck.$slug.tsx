import { createFileRoute, notFound } from "@tanstack/react-router";

import { Slide } from "../deck/Slide";
import { sections } from "../deck/sections";

export const Route = createFileRoute("/deck/$slug")({
  head: ({ params }) => {
    const s = sections.find((x) => x.slug === params.slug);
    const title = s ? `${s.n}. ${s.title} — Retiro 2027` : "Retiro 2027";
    return {
      meta: [
        { title },
        { name: "description", content: s?.lead ?? "Apresentação executiva do Retiro de Carnaval 2027." },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  loader: ({ params }) => {
    const s = sections.find((x) => x.slug === params.slug);
    if (!s) throw notFound();
    return { slug: s.slug };
  },
  component: DeckSlide,
  notFoundComponent: () => (
    <div className="deck-404">
      <h1>Seção não encontrada</h1>
      <a href="/deck" className="btn btn-ghost mt-4">Voltar ao índice</a>
    </div>
  ),
});

function DeckSlide() {
  const { slug } = Route.useLoaderData();
  const s = sections.find((x) => x.slug === slug)!;
  const Component = s.Component;
  return (
    <Slide slug={s.slug} kicker={s.kicker} title={s.title} lead={s.lead}>
      <Component />
    </Slide>
  );
}
