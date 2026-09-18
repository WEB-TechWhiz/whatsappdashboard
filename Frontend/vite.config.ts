import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
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
    // vite-tsconfig-paths must come FIRST so it reads tsconfig paths
    // (@/* -> ./src/*) before any other plugin processes imports.
    viteTsConfigPaths(),

    tanstackStart({
      // Redirect TanStack Start's bundled server entry to src/server.ts (SSR error wrapper).
      server: { entry: "server" },
      router: {
        routeFileIgnorePattern: "^(health|\\[\\.\\.\\.path\\]|gateway)\\.ts$",
      },
    }),

    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      // Explicit alias as a safety net for Rollup/bundler even if
      // vite-tsconfig-paths is present — prevents "failed to resolve @/..." errors.
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
