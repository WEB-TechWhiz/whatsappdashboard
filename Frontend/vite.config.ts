import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import viteTsConfigPaths from "vite-tsconfig-paths";
import path from "path";

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
    viteTsConfigPaths(),

    tanstackStart({
      server: { entry: "server" },
      router: {
        routeFileIgnorePattern: "^(health|\\[\\.\\.\\.path\\]|gateway)\\.ts$",
      },
    }),

    // ✅ YAHAN CHANGE: preset add karo
    nitro({
      preset: "vercel",
    }),

    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
