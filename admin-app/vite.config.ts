import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const isVercelBuild = Boolean(process.env.VERCEL);

export default defineConfig({
  tanstackStart: { server: { entry: "server" } },
  nitro: isVercelBuild ? { preset: "vercel" } : true,
  vite: { base: "/adm/" },
});
