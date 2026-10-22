import { createFileRoute } from "@tanstack/react-router";

import { evento } from "../content/evento";
import { Landing } from "../landing/Landing";

const titulo = `${evento.nome} ${evento.edicao} — Inscrições | ${evento.ministerio}`;
const descricao = `${evento.nome} ${evento.edicao} da ${evento.igreja} de ${evento.igrejaCidade}. ${evento.dataTexto}. Veja as informações e faça sua inscrição.`;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: titulo },
      { name: "description", content: descricao },
      { property: "og:title", content: titulo },
      { property: "og:description", content: descricao },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Landing,
});
