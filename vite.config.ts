// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: null,
        filename: "sw.js",
        devOptions: { enabled: false },
        workbox: {
          navigateFallback: "/",
          navigateFallbackDenylist: [/^\/~oauth/, /^\/api\//],
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.mode === "navigate",
              handler: "NetworkFirst",
              options: {
                cacheName: "html-navigations",
                networkTimeoutSeconds: 3,
              },
            },
            {
              urlPattern: ({ url, sameOrigin }) =>
                sameOrigin && /\.(?:js|css|woff2?|png|svg|ico|json)$/.test(url.pathname),
              handler: "CacheFirst",
              options: {
                cacheName: "static-assets",
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
            {
              urlPattern: ({ url }) => url.origin === "https://fonts.googleapis.com" || url.origin === "https://fonts.gstatic.com",
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts",
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
          ],
        },
        manifest: {
          name: "O Clamor que Move a Mão de Deus",
          short_name: "O Clamor",
          description: "Ministração em slides — Juízes 6:1-16.",
          display: "standalone",
          background_color: "#f2f2f2",
          theme_color: "#1a1a1a",
          start_url: "/",
          icons: [
            { src: "/favicon.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
          ],
        },
      }),
    ],
  },
});

