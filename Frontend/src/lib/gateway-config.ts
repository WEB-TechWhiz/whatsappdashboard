/**
 * API Gateway Service Registry
 *
 * This configuration maps API route patterns to their respective microservices.
 * During Phase 1, all services point to the monolith (Render backend).
 * As new services are built (Phase 2+), update the env vars (VITE_*) to route traffic.
 *
 * IMPORTANT: Only VITE_* prefixed env vars are available in browser.
 *            Never use process.env in client-side code.
 */

export interface ServiceConfig {
  url: string;
  healthCheckPath?: string;
  timeout?: number;
}

/**
 * Safely read a Vite env var (works in browser + SSR).
 * Falls back to the provided default if not set.
 */
function readEnv(key: string, fallback: string): string {
  try {
    // Browser + Vite build-time env
    if (typeof import.meta !== "undefined" && import.meta.env) {
      const value = (import.meta.env as Record<string, string | undefined>)[key];
      if (value && value.trim()) return value.trim();
    }
  } catch {
    // ignore
  }

  // SSR fallback (Node) — only if process exists
  try {
    if (typeof process !== "undefined" && process.env) {
      const value = process.env[key];
      if (value && value.trim()) return value.trim();
    }
  } catch {
    // ignore
  }

  return fallback;
}

// Base backend URL (without /api/v1)
const BACKEND_URL = readEnv(
  "VITE_API_URL",
  "https://whatsappdashboardbackend.onrender.com/api/v1",
).replace(/\/api\/v1\/?$/, "");

const DEFAULT_SERVICE_URL = BACKEND_URL;

export const SERVICES: Record<string, ServiceConfig> = {
  auth: {
    url: readEnv("VITE_AUTH_SERVICE_URL", DEFAULT_SERVICE_URL),
    healthCheckPath: "/health",
    timeout: 30000,
  },
  whatsapp: {
    url: readEnv("VITE_WHATSAPP_SERVICE_URL", DEFAULT_SERVICE_URL),
    healthCheckPath: "/health",
    timeout: 30000,
  },
  conversations: {
    url: readEnv("VITE_CONVERSATIONS_SERVICE_URL", DEFAULT_SERVICE_URL),
    healthCheckPath: "/health",
    timeout: 30000,
  },
  leads: {
    url: readEnv("VITE_LEADS_SERVICE_URL", DEFAULT_SERVICE_URL),
    healthCheckPath: "/health",
    timeout: 30000,
  },
  analytics: {
    url: readEnv("VITE_ANALYTICS_SERVICE_URL", DEFAULT_SERVICE_URL),
    healthCheckPath: "/health",
    timeout: 30000,
  },
  settings: {
    url: readEnv("VITE_SETTINGS_SERVICE_URL", DEFAULT_SERVICE_URL),
    healthCheckPath: "/health",
    timeout: 30000,
  },
  integrations: {
    url: readEnv("VITE_INTEGRATIONS_SERVICE_URL", DEFAULT_SERVICE_URL),
    healthCheckPath: "/health",
    timeout: 30000,
  },
  dashboard: {
    url: readEnv("VITE_DASHBOARD_SERVICE_URL", DEFAULT_SERVICE_URL),
    healthCheckPath: "/health",
    timeout: 30000,
  },
  notifications: {
    url: readEnv("VITE_NOTIFICATIONS_SERVICE_URL", DEFAULT_SERVICE_URL),
    healthCheckPath: "/health",
    timeout: 30000,
  },
  billing: {
    url: readEnv("VITE_BILLING_SERVICE_URL", DEFAULT_SERVICE_URL),
    healthCheckPath: "/health",
    timeout: 30000,
  },
  admin: {
    url: readEnv("VITE_ADMIN_SERVICE_URL", DEFAULT_SERVICE_URL),
    healthCheckPath: "/health",
    timeout: 30000,
  },
  automation: {
    url: readEnv("VITE_AUTOMATION_SERVICE_URL", DEFAULT_SERVICE_URL),
    healthCheckPath: "/health",
    timeout: 30000,
  },
  webhooks: {
    url: readEnv("VITE_WEBHOOKS_SERVICE_URL", DEFAULT_SERVICE_URL),
    healthCheckPath: "/health",
    timeout: 30000,
  },
};

/**
 * Route Pattern Matching
 * Maps URL patterns to service names
 *
 * Example: /api/v1/auth/login -> routes to AUTH service
 */
export const ROUTE_PATTERNS: Record<string, string> = {
  "/api/v1/auth": "auth",
  "/api/v1/workspace": "auth",
  "/api/v1/whatsapp": "whatsapp",
  "/api/v1/conversations": "conversations",
  "/api/v1/messages": "whatsapp",
  "/api/v1/leads": "leads",
  "/api/v1/analytics": "analytics",
  "/api/v1/settings": "settings",
  "/api/v1/integrations": "integrations",
  "/api/v1/dashboard": "dashboard",
  "/api/v1/notifications": "notifications",
  "/api/v1/billing": "billing",
  "/api/v1/admin": "admin",
  "/api/v1/automation": "automation",
  "/api/v1/webhooks": "webhooks",
};

/**
 * Get the target service for a given API path
 */
export function getServiceForPath(path: string): string | null {
  for (const [pattern, service] of Object.entries(ROUTE_PATTERNS)) {
    if (path.startsWith(pattern)) {
      return service;
    }
  }
  return null;
}

/**
 * Get full service URL for making requests
 */
export function getServiceConfig(serviceName: string): ServiceConfig | null {
  return SERVICES[serviceName] || null;
}