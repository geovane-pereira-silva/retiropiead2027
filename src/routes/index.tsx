import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, PlayCircle, Printer, Sparkles } from "lucide-react";

import { retiro, calcCenario, pontoEquilibrio } from "../content/retiro";
import { brl, num } from "../lib/format";
import { sections } from "../deck/sections";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Retiro de Carnaval 2027 — Apresentação Executiva" },
      {
        name: "description",
        content: `Estudo executivo do Retiro de Carnaval 2027 no Sítio Santa Clara. ${retiro.dataTexto}.`,
      },
      { property: "og:title", content: "Retiro de Carnaval 2027 — Apresentação Executiva" },
      { property: "og:description", content: `Viabilidade, cenários, riscos e recomendações — ${retiro.dataTexto}.` },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Cover,
});

function Cover() {
  const meta = retiro.financas.metaParticipantes;
  const cen = calcCenario(meta);
  const pe = pontoEquilibrio();
  const first = sections[0];

  return (
    <div className="cover">
      <header className="cover-topbar">
        <div className="cover-brand"><Sparkles size={16} /> Apresentação Executiva</div>
        <div className="cover-date">{retiro.dataTexto}</div>
      </header>

      <main className="cover-main container-x">
        <div className="cover-hero">
          <span className="kicker">Reunião de Liderança</span>
          <h1 className="cover-title">Retiro de Carnaval <span className="gold">{retiro.edicao}</span></h1>
          <p className="cover-sub">
            Estudo de viabilidade, cenários e recomendações para a realização do retiro no{" "}
            <strong>{retiro.local.nome}</strong>, {retiro.local.cidade}/{retiro.local.uf}.
          </p>

          <div className="cover-kpis">
            <div><div className="k-v">{num(meta)}</div><div className="k-l">Meta de participantes</div></div>
            <div><div className="k-v">{brl(retiro.financas.inscricao)}</div><div className="k-l">Inscrição individual</div></div>
            <div><div className="k-v">{brl(cen.custoTotal)}</div><div className="k-l">Investimento total</div></div>
            <div><div className="k-v">{pe}</div><div className="k-l">Ponto de equilíbrio</div></div>
          </div>

          <div className="cover-cta">
            <Link to="/deck/$slug" params={{ slug: first.slug }} className="btn btn-primary">
              <PlayCircle size={18} /> Iniciar apresentação
            </Link>
            <Link to="/deck/print" className="btn btn-ghost">
              <Printer size={16} /> Ver versão para impressão
            </Link>
          </div>
        </div>

        <section className="cover-index">
          <div className="cover-index-head">
            <span className="kicker">Índice</span>
            <span className="hint">{sections.length} seções · use ← → para navegar</span>
          </div>
          <ol className="cover-list">
            {sections.map((s) => (
              <li key={s.slug}>
                <Link to="/deck/$slug" params={{ slug: s.slug }} className="cover-link">
                  <span className="cover-num">{String(s.n).padStart(2, "0")}</span>
                  <span className="cover-item-title">{s.title}</span>
                  <ArrowRight size={16} />
                </Link>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="cover-foot container-x">
        <span>Ministério de Jovens · Retiro {retiro.edicao}</span>
        <span>Confidencial — uso interno da liderança</span>
      </footer>
    </div>
  );
}
