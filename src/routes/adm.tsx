import { createFileRoute } from "@tanstack/react-router";

import { Adm } from "../adm/AdmApp";

export const Route = createFileRoute("/adm")({
  head: () => ({
    meta: [
      { title: "Gestão do retiro" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Adm,
});
