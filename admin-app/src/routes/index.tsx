import { createFileRoute } from "@tanstack/react-router";

import { Adm } from "../adm/AdmApp";

export const Route = createFileRoute("/")({
  component: Adm,
});
