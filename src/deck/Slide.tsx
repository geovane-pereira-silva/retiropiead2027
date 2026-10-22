import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Home, LayoutGrid, Maximize2 } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { sections } from "./sections";

export function Slide({
  slug,
  kicker,
  title,
  lead,
  children,
}: {
  slug: string;
  kicker?: string;
  title: string;
  lead?: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const idx = sections.findIndex((s) => s.slug === slug);
  const total = sections.length;
  const prev = idx > 0 ? sections[idx - 1] : null;
  const next = idx < total - 1 ? sections[idx + 1] : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        if (next) navigate({ to: "/deck/$slug", params: { slug: next.slug } });
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        if (prev) navigate({ to: "/deck/$slug", params: { slug: prev.slug } });
      } else if (e.key === "Home") {
        navigate({ to: "/deck" });
      } else if (e.key === "End") {
        const last = sections[sections.length - 1];
        navigate({ to: "/deck/$slug", params: { slug: last.slug } });
      } else if (e.key.toLowerCase() === "f") {
        document.documentElement.requestFullscreen?.().catch(() => {});
      } else if (e.key === "Escape" && document.fullscreenElement) {
        document.exitFullscreen?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, next, prev]);

  return (
    <div className="slide-shell">
      <header className="slide-topbar">
        <Link to="/deck" className="slide-topbtn" aria-label="Índice">
          <Home size={16} />
        </Link>
        <div className="slide-topmeta">
          <span className="slide-kicker">{kicker ?? `Seção ${idx + 1}`}</span>
          <span className="slide-index">
            {String(idx + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
        </div>
        <button
          type="button"
          className="slide-topbtn"
          onClick={() => document.documentElement.requestFullscreen?.().catch(() => {})}
          aria-label="Tela cheia"
        >
          <Maximize2 size={16} />
        </button>
      </header>

      <main className="slide-main">
        <div className="slide-inner">
          <h1 className="slide-title">{title}</h1>
          {lead && <p className="slide-lead">{lead}</p>}
          <div className="slide-body">{children}</div>
        </div>
      </main>

      <footer className="slide-footer">
        <button
          type="button"
          className="slide-navbtn"
          disabled={!prev}
          onClick={() => prev && navigate({ to: "/deck/$slug", params: { slug: prev.slug } })}
          aria-label="Anterior"
        >
          <ArrowLeft size={18} />
          <span>{prev?.short ?? "Início"}</span>
        </button>

        <Link to="/deck" className="slide-navbtn slide-navbtn-ghost" aria-label="Ver índice">
          <LayoutGrid size={16} />
          <span>Índice</span>
        </Link>

        <button
          type="button"
          className="slide-navbtn slide-navbtn-primary"
          disabled={!next}
          onClick={() => next && navigate({ to: "/deck/$slug", params: { slug: next.slug } })}
          aria-label="Próximo"
        >
          <span>{next?.short ?? "Fim"}</span>
          <ArrowRight size={18} />
        </button>
      </footer>

      <div className="slide-progress" aria-hidden>
        <div className="slide-progress-fill" style={{ width: `${((idx + 1) / total) * 100}%` }} />
      </div>
    </div>
  );
}
