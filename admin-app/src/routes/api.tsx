import { createFileRoute } from "@tanstack/react-router";
import { atenderAdmin } from "../api/adm.route";

export const Route = createFileRoute("/api")({
  server: {
    handlers: {
      GET: ({ request }) => atenderAdmin(request),
      POST: ({ request }) => atenderAdmin(request),
    },
  },
  component: () => null,
});
