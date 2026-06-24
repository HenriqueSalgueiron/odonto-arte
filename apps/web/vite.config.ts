import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon-180x180.png"],
      manifest: {
        name: "OdontoArte",
        short_name: "OdontoArte",
        description:
          "Sistema de gestão do laboratório de prótese dentária OdontoArte",
        theme_color: "#1976d2",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        lang: "pt-BR",
        icons: [
          { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // App shell: cacheia HTML/JS/CSS/fontes/imagens estáticas.
        // Requests pra API (mesma origem? não — vão pra :3001 em dev, fly.dev
        // em prod) passam direto, sem cache.
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        // Quando o usuário recarrega uma rota tipo /services, o SW serve
        // index.html (SPA fallback). Mas se a URL bate em /api ou similar,
        // não fazer fallback.
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api/],
        // Default Workbox = 2 MiB. Nosso bundle inicial passa disso por causa
        // de @react-pdf/renderer (Yoga WASM) + MUI sem code-splitting.
        // TODO follow-up: dynamic import do @react-pdf no ExportPdfDialog →
        // bundle inicial cai ~800KB e o limite pode voltar pro default.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
      devOptions: {
        // SW desligado em dev pra não atrapalhar HMR. Só ativa em build/preview.
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
  },
  server: {
    port: 3000,
  },
});
