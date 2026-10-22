import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Printer } from "lucide-react";

import { retiro } from "../content/retiro";
import { sections } from "../deck/sections";

export const Route = createFileRoute("/deck/print")({
  head: () => ({
    meta: [
      { title: "Retiro 2027 — Versão para impressão" },
      { name: "description", content: "Todas as seções da apresentação em uma única página, pronta para PDF." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PrintDeck,
});

function PrintDeck() {
  return (
    <div className="print-shell">
      <div className="print-actions no-print">
        <Link to="/deck" className="btn btn-ghost"><ArrowLeft size={16} /> Voltar</Link>
        <button type="button" className="btn btn-primary" onClick={() => window.print()}>
          <Printer size={16} /> Imprimir / Salvar PDF
        </button>
      </div>

      <div className="print-cover">
        <div className="kicker">Apresentação Executiva</div>
        <h1 className="section-title">Retiro de Carnaval {retiro.edicao}</h1>
        <p className="lead">
          {retiro.dataTexto} · {retiro.local.nome} — {retiro.local.cidade}/{retiro.local.uf}
        </p>
      </div>

      {sections.map((s) => {
        const C = s.Component;
        return (
          <section key={s.slug} className="print-page">
            <header className="print-head">
              <span className="kicker">{s.kicker}</span>
              <h2 className="section-title">{s.title}</h2>
              {s.lead && <p className="lead">{s.lead}</p>}
            </header>
            <C />
          </section>
        );
      })}
    </div>
  );
}
