import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import viteTsConfigPaths from "vite-tsconfig-paths";
import path from "path";

// The backend target — used for ALL proxy rules below.
// In dev this is always localhost:4000 (the Express server).
// For production SSR the gateway-dispatcher.ts / SERVICES env-vars take over.
const BACKEND = process.env.BACKEND_URL || "http://localhost:4000";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 3000,
    proxy: {
      // ── Auth & OAuth ─────────────────────────────────────────────────────
      // Explicit auth routes come FIRST so Vite matches them before the
      // catch-all /api/v1 rule below (Vite uses the first matching rule).

      // POST /api/v1/auth/login
      "/api/v1/auth/login": {
        target: BACKEND,
        changeOrigin: true,
        cookieDomainRewrite: { "*": "" }, // strip domain → cookie works on localhost
      },

      // POST /api/v1/auth/signup  /  POST /api/v1/auth/register
      "/api/v1/auth/signup": {
        target: BACKEND,
        changeOrigin: true,
        cookieDomainRewrite: { "*": "" },
      },
      "/api/v1/auth/register": {
        target: BACKEND,
        changeOrigin: true,
        cookieDomainRewrite: { "*": "" },
      },

      // POST /api/v1/auth/logout
      "/api/v1/auth/logout": {
        target: BACKEND,
        changeOrigin: true,
        cookieDomainRewrite: { "*": "" },
      },

      // POST /api/v1/auth/refresh
      "/api/v1/auth/refresh": {
        target: BACKEND,
        changeOrigin: true,
        cookieDomainRewrite: { "*": "" },
      },

      // GET  /api/v1/auth/me
      "/api/v1/auth/me": {
        target: BACKEND,
        changeOrigin: true,
        cookieDomainRewrite: { "*": "" },
      },

      // GET  /api/v1/auth/oauth/google          → redirect to Google
      // GET  /api/v1/auth/oauth/google/callback → Google redirects back here
      "/api/v1/auth/oauth": {
        target: BACKEND,
        changeOrigin: true,
        cookieDomainRewrite: { "*": "" },
        // Follow redirects so the Google callback lands on the backend
        followRedirects: true,
      },

      // ── Catch-all for every other /api/v1/* call ─────────────────────────
      "/api/v1": {
        target: BACKEND,
        changeOrigin: true,
      },
    },
  },

  plugins: [
    // 1. vite-tsconfig-paths: MUST be first — reads tsconfig "@/*" -> "./src/*"
    //    so every downstream plugin (TanStack, Rollup) already knows the alias.
    viteTsConfigPaths(),

    // 2. TanStack Start: framework plugin (SSR routing, file-based routes).
    //    This also configures Nitro internally — do NOT add a separate nitro()
    //    call here, it causes the "no default export" import error.
    tanstackStart({
      server: { entry: "server" },
      router: {
        routeFileIgnorePattern: "^(health|\\[\\.\\.\\.path\\]|gateway)\\.ts$",
      },
    }),

    // 3. React: JSX transform
    react(),

    // 4. Tailwind CSS v4 via Vite plugin
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
