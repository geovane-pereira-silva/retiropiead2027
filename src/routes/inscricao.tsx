import { createFileRoute } from "@tanstack/react-router";

import { evento } from "../content/evento";
import { RegistrationForm } from "../landing/RegistrationForm";
import { Rodape } from "../landing/Landing";
import { Termos } from "../landing/Termos";

export const Route = createFileRoute("/inscricao")({
  head: () => ({
    meta: [
      { title: `Inscrição — ${evento.nome} ${evento.edicao}` },
      {
        name: "description",
        content: `Inscrição da família no ${evento.nome} ${evento.edicao} (${evento.dataTexto}). O valor de cada pessoa é calculado antes do envio.`,
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Inscricao,
});

function Inscricao() {
  return (
    <div className="lp">
      <header className="lp-formhead">
        <div className="lp-wrap" style={{ maxWidth: "46rem" }}>
          <a href="/" className="lp-back">
            ← {evento.ministerio}
          </a>
          <h1 className="lp-h2" style={{ marginBottom: "0.5rem" }}>
            Inscrição da família
          </h1>
          <p className="lp-lead" style={{ marginBottom: 0 }}>
            {evento.dataTexto}, no {evento.local.nome}, em {evento.local.cidade}/{evento.local.uf}.
            Cadastre o responsável e os integrantes da família: o valor de cada pessoa e o total
            aparecem antes do envio.
          </p>
        </div>
      </header>
      <main className="lp-wrap" style={{ paddingBottom: "4rem", paddingTop: "1.5rem" }}>
        <RegistrationForm />
        <Termos />
      </main>
      <Rodape />
    </div>
  );
}
