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
        content: `Faça sua inscrição no ${evento.nome} ${evento.edicao} (${evento.dataTexto}). O valor é calculado antes do envio.`,
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
          <span className="lp-eyebrow" style={{ display: "flex", marginTop: "0.5rem" }}>
            Inscrição
          </span>
          <h1 className="lp-h2" style={{ marginBottom: "0.5rem" }}>
            {evento.nome} {evento.edicao}
          </h1>
          <p className="lp-lead" style={{ marginBottom: 0 }}>
            {evento.dataTexto} · {evento.local.nome}, {evento.local.cidade}/{evento.local.uf}.
            Preencha os dados do participante: o valor é calculado antes do envio.
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
