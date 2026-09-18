import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import viteTsConfigPaths from "vite-tsconfig-paths";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 3000,
    proxy: {
      "/api/v1": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },

  plugins: [
    // 1. vite-tsconfig-paths: MUST be first — reads tsconfig "@/*" -> "./src/*"
    //    so every downstream plugin (TanStack, Rollup) already knows the alias.
    viteTsConfigPaths(),

    // 2. TanStack Start: framework plugin (SSR routing, file-based routes)
    tanstackStart({
      server: { entry: "server" },
      router: {
        routeFileIgnorePattern: "^(health|\\[\\.\\.\\.path\\]|gateway)\\.ts$",
      },
    }),

    // 3. Nitro: server-side bundler / edge-runtime plugin
    nitro(),

    // 4. React: JSX transform
    react(),

    // 5. Tailwind CSS v4 via Vite plugin
    tailwindcss(),
  ],

  resolve: {
    alias: {
      // Explicit Rollup-level alias — acts as a safety net alongside
      // vite-tsconfig-paths so "@/components/ui/button" NEVER fails to resolve.
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
