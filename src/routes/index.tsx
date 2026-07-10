import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

import { slides, type SlidePart } from "../lib/pbtxSlides";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "O Clamor que Move a Mão de Deus" },
      {
        name: "description",
        content: "Ministração em slides — Juízes 6:1-16.",
      },
      { property: "og:title", content: "O Clamor que Move a Mão de Deus" },
      {
        property: "og:description",
        content: "Ministração em slides — Juízes 6:1-16.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Index,
});

function Index() {
  const [active, setActive] = useState(0);
  const total = slides.length;
  const slide = slides[active];

  const go = (next: number) => setActive(Math.min(Math.max(next, 0), total - 1));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setActive((c) => Math.min(c + 1, total - 1));
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setActive((c) => Math.max(c - 1, 0));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total]);

  return (
    <div className="deck">
      <div className="deck-frame">
        <article className="slide" key={slide.id}>
          <header className="slide-kicker">{slide.kicker}</header>
          <div className="slide-body">
            {slide.parts.map((part, i) => (
              <Part key={i} part={part} />
            ))}
          </div>
          <footer className="slide-foot">
            {slide.id} / {total}
          </footer>
        </article>

        <button
          type="button"
          className="tap-zone tap-zone-left"
          onClick={() => go(active - 1)}
          disabled={active === 0}
          aria-label="Slide anterior"
        />
        <button
          type="button"
          className="tap-zone tap-zone-right"
          onClick={() => go(active + 1)}
          disabled={active === total - 1}
          aria-label="Próximo slide"
        />


        <nav className="deck-nav" aria-label="Navegação">
          <button type="button" onClick={() => go(active - 1)} disabled={active === 0} aria-label="Anterior">
            <ArrowLeft aria-hidden="true" />
          </button>
          <div className="deck-dots">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className={i === active ? "dot dot-on" : "dot"}
                onClick={() => go(i)}
                aria-label={`Slide ${s.id}`}
              />
            ))}
          </div>
          <button type="button" onClick={() => go(active + 1)} disabled={active === total - 1} aria-label="Próximo">
            <ArrowRight aria-hidden="true" />
          </button>
        </nav>
      </div>
    </div>
  );
}

function Part({ part }: { part: SlidePart }) {
  switch (part.kind) {
    case "heading":
      return <h1 className="p-heading">{part.text}</h1>;
    case "text":
      return <p className="p-text">{part.text}</p>;
    case "label":
      return <p className="p-label">{part.text}</p>;
    case "quote":
      return <p className="p-quote">{part.text}</p>;
    case "verse":
      return (
        <blockquote className="p-verse">
          <cite className="p-verse-ref">{part.ref}</cite>
          <span className="p-verse-text">{part.text}</span>
        </blockquote>
      );
    case "list":
      return (
        <ul className="p-list">
          {part.items.map((it) => (
            <li key={it}>{it}</li>
          ))}
        </ul>
      );
    default:
      return null;
  }
}
