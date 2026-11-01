import { Outlet, HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";

import styles from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "robots", content: "noindex, nofollow" },
      { title: "Gestão do Retiro 2027" },
    ],
    links: [{ rel: "stylesheet", href: styles }],
  }),
  shellComponent: ({ children }: { children: ReactNode }) => (
    <html lang="pt-BR"><head><HeadContent /></head><body>{children}<Scripts /></body></html>
  ),
  component: () => <Outlet />,
});