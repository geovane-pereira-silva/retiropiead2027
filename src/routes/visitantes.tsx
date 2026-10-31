import { createFileRoute } from "@tanstack/react-router";

import { evento } from "../content/evento";
import { Rodape } from "../landing/Landing";
import { Termos } from "../landing/Termos";
import { VisitorForm } from "../landing/VisitorForm";

export const Route = createFileRoute("/visitantes")({
  head: () => ({
    meta: [
      { title: `Visitantes — ${evento.nome} ${evento.edicao}` },
      { name: "description", content: `Cadastro de day use para visitantes do ${evento.nome} ${evento.edicao}.` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Visitantes,
});

function Visitantes() {
  return (
    <div className="lp">
      <header className="lp-formhead">
        <div className="lp-wrap lp-formhead-conteudo">
          <a href="/#visitantes" className="lp-back">← Visitantes</a>
          <h1 className="lp-h2">Cadastro de visitante</h1>
          <p className="lp-lead">Day use no Retiro Conexão Jovem 2027 · 5 a 9 de fevereiro</p>
        </div>
      </header>
      <main className="lp-wrap lp-visitante-main">
        <VisitorForm />
        <Termos />
      </main>
      <Rodape />
    </div>
  );
}
