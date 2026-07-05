import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Expand, Grid3X3, MonitorPlay } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { pbtxSlides, type PbtxSlide } from "../lib/pbtxSlides";

// No head() here: the home route inherits title/description/og/twitter from
// __root.tsx, and ships no og:image so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PBTX — O Chamado para os Gentios" },
      {
        name: "description",
        content: "Apresentação web redesenhada da Lição 1: O Chamado para os Gentios.",
      },
      { property: "og:title", content: "PBTX — O Chamado para os Gentios" },
      {
        property: "og:description",
        content: "Apresentação web clara, visual e navegável da Lição 1.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [active, setActive] = useState(() => {
    if (typeof window === "undefined") return 0;
    const requested = Number(new URLSearchParams(window.location.search).get("slide"));
    return Number.isFinite(requested) ? Math.min(Math.max(requested - 1, 0), pbtxSlides.length - 1) : 0;
  });
  const [overview, setOverview] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const slide = pbtxSlides[active];

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("slide", String(active + 1));
    window.history.replaceState(null, "", url);
    document.title = `${active + 1}/${pbtxSlides.length} — ${slide.title}`;
  }, [active, slide.title]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === " ") {
        event.preventDefault();
        setActive((current) => Math.min(current + 1, pbtxSlides.length - 1));
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setActive((current) => Math.max(current - 1, 0));
      }

      if (event.key.toLowerCase() === "g") setOverview((current) => !current);
      if (event.key === "F5") {
        event.preventDefault();
        stageRef.current?.requestFullscreen?.();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const progress = useMemo(() => `${((active + 1) / pbtxSlides.length) * 100}%`, [active]);

  const goTo = (next: number) => {
    setActive(Math.min(Math.max(next, 0), pbtxSlides.length - 1));
    setOverview(false);
  };

  return (
    <div className="pbtx-app">
      <header className="pbtx-toolbar" aria-label="Controles da apresentação">
        <div className="pbtx-brand">
          <span className="pbtx-mark">PBTX</span>
          <span>Lição 1</span>
        </div>

        <div className="pbtx-toolbar-actions">
          <button className="pbtx-icon-button" type="button" onClick={() => setOverview((current) => !current)} aria-label="Ver grade de slides">
            <Grid3X3 aria-hidden="true" />
          </button>
          <button className="pbtx-icon-button" type="button" onClick={() => stageRef.current?.requestFullscreen?.()} aria-label="Abrir em tela cheia">
            <Expand aria-hidden="true" />
          </button>
          <a className="pbtx-download" href="/__l5e/assets-v1/bdb75cee-e466-46d4-a582-3876a76ef957/Slide_Licao_1_3T_2026_CPAD_ADULTOS.pptx" download>
            PPTX original
          </a>
        </div>
      </header>

      <div className="pbtx-progress" aria-hidden="true">
        <span style={{ width: progress }} />
      </div>

      <main className="pbtx-shell">
        <aside className="pbtx-rail" aria-label="Slides">
          {pbtxSlides.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={index === active ? "pbtx-thumb pbtx-thumb-active" : "pbtx-thumb"}
              onClick={() => goTo(index)}
              aria-label={`Abrir slide ${item.id}: ${item.title}`}
            >
              <span>{String(item.id).padStart(2, "0")}</span>
              <strong>{item.title}</strong>
            </button>
          ))}
        </aside>

        <section ref={stageRef} className="pbtx-stage" aria-live="polite">
          {overview ? (
            <SlideOverview active={active} onSelect={goTo} />
          ) : (
            <>
              <SlideFrame slide={slide} />
              <nav className="pbtx-nav" aria-label="Navegação entre slides">
                <button className="pbtx-round" type="button" onClick={() => goTo(active - 1)} disabled={active === 0} aria-label="Slide anterior">
                  <ArrowLeft aria-hidden="true" />
                </button>
                <span className="pbtx-counter">{active + 1} / {pbtxSlides.length}</span>
                <button className="pbtx-round" type="button" onClick={() => goTo(active + 1)} disabled={active === pbtxSlides.length - 1} aria-label="Próximo slide">
                  <ArrowRight aria-hidden="true" />
                </button>
              </nav>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function SlideOverview({ active, onSelect }: { active: number; onSelect: (index: number) => void }) {
  return (
    <div className="pbtx-overview">
      {pbtxSlides.map((slide, index) => (
        <button
          key={slide.id}
          type="button"
          className={index === active ? "pbtx-overview-card pbtx-overview-card-active" : "pbtx-overview-card"}
          onClick={() => onSelect(index)}
        >
          <span>{String(slide.id).padStart(2, "0")}</span>
          <strong>{slide.title}</strong>
        </button>
      ))}
    </div>
  );
}

function SlideFrame({ slide }: { slide: PbtxSlide }) {
  return (
    <article className={`pbtx-slide pbtx-slide-${slide.layout}`}>
      <div className="pbtx-slide-content">
        <SlideText slide={slide} />
      </div>
      {slide.image ? (
        <figure className="pbtx-slide-figure">
          <img src={slide.image} alt="Cena visual relacionada ao conteúdo da lição" width={1600} height={912} loading={slide.id === 1 ? "eager" : "lazy"} />
        </figure>
      ) : null}
      <footer className="pbtx-slide-footer">
        <span>O Chamado para os Gentios</span>
        <span>{String(slide.id).padStart(2, "0")}</span>
      </footer>
    </article>
  );
}

function SlideText({ slide }: { slide: PbtxSlide }) {
  return (
    <>
      {slide.eyebrow ? <p className="pbtx-eyebrow">{slide.eyebrow}</p> : null}
      <h1 className="pbtx-title">{slide.title}</h1>
      {slide.subtitle ? <p className="pbtx-subtitle">{slide.subtitle}</p> : null}
      {slide.quote ? <blockquote className="pbtx-quote">{slide.quote}</blockquote> : null}
      {slide.answer ? <p className="pbtx-answer">{slide.answer}</p> : null}
      {slide.body ? <BodyLines lines={slide.body} /> : null}
      {slide.bullets ? <BulletLines lines={slide.bullets} /> : null}
      {slide.table ? <SlideTable rows={slide.table} /> : null}
      {slide.layout === "cover" ? <MonitorPlay className="pbtx-watermark" aria-hidden="true" /> : null}
    </>
  );
}

function BodyLines({ lines }: { lines: string[] }) {
  return (
    <div className="pbtx-body-lines">
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  );
}

function BulletLines({ lines }: { lines: string[] }) {
  return (
    <ul className="pbtx-bullets">
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}

function SlideTable({ rows }: { rows: string[][] }) {
  return (
    <table className="pbtx-table">
      <tbody>
        {rows.map((row) => (
          <tr key={row.join("|")}>
            {row.map((cell) => (
              <td key={cell}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
