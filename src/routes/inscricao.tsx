import { createFileRoute } from "@tanstack/react-router";

import { evento } from "../content/evento";
import { RegistrationForm } from "../landing/RegistrationForm";
import { Rodape } from "../landing/Landing";
import { Termos } from "../landing/Termos";

export const Route = createFileRoute("/inscricao")({
  head: () => ({
    meta: [
      { title: `Cadastro — ${evento.nome} ${evento.edicao}` },
      {
        name: "description",
        content: `Cadastro individual para o ${evento.nome} ${evento.edicao} (${evento.dataTexto}). Para menor de idade, pai, mãe ou responsável legal faz o cadastro.`,
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
          <h1 className="lp-h2" style={{ marginBottom: "0.35rem", fontSize: "clamp(1.7rem, 5vw, 2.5rem)" }}>
            Cadastro individual
          </h1>
          <p className="lp-lead" style={{ marginBottom: 0 }}>
            {evento.dataTexto} · {evento.local.cidade}/{evento.local.uf}
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
