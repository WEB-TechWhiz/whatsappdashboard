/**
 * API Gateway Service Registry
 *
 * This configuration maps API route patterns to their respective microservices.
 * During Phase 1, all services point to the monolith (localhost:4000).
 * As new services are built (Phase 2+), update environment variables to route traffic to them.
 *
 * Pattern: Each service has a URL and optional health check endpoint.
 */

export interface ServiceConfig {
  url: string;
  healthCheckPath?: string;
  timeout?: number;
}

export const SERVICES: Record<string, ServiceConfig> = {
  auth: {
    url: process.env.AUTH_SERVICE_URL || "http://localhost:4000",
    healthCheckPath: "/health/auth",
    timeout: 30000,
  },
  whatsapp: {
    url: process.env.WHATSAPP_SERVICE_URL || "http://localhost:4000",
    healthCheckPath: "/health/whatsapp",
    timeout: 30000,
  },
  conversations: {
    url: process.env.CONVERSATIONS_SERVICE_URL || "http://localhost:4000",
    healthCheckPath: "/health/conversations",
    timeout: 30000,
  },
  leads: {
    url: process.env.LEADS_SERVICE_URL || "http://localhost:4000",
    healthCheckPath: "/health/leads",
    timeout: 30000,
  },
  analytics: {
    url: process.env.ANALYTICS_SERVICE_URL || "http://localhost:4000",
    healthCheckPath: "/health/analytics",
    timeout: 30000,
  },
  settings: {
    url: process.env.SETTINGS_SERVICE_URL || "http://localhost:4000",
    healthCheckPath: "/health/settings",
    timeout: 30000,
  },
  integrations: {
    url: process.env.INTEGRATIONS_SERVICE_URL || "http://localhost:4000",
    healthCheckPath: "/health/integrations",
    timeout: 30000,
  },
};

/**
 * Route Pattern Matching
 * Maps URL patterns to service names
 *
 * Example: /api/v1/auth/login -> routes to AUTH service
 *          /api/v1/conversations -> routes to CONVERSATIONS service
 */
export const ROUTE_PATTERNS: Record<string, string> = {
  "/api/v1/auth": "auth",
  "/api/v1/whatsapp": "whatsapp",
  "/api/v1/conversations": "conversations",
  "/api/v1/messages": "whatsapp",
  "/api/v1/leads": "leads",
  "/api/v1/analytics": "analytics",
  "/api/v1/settings": "settings",
  "/api/v1/integrations": "integrations",
};

/**
 * Get the target service for a given API path
 * @param path - API path (e.g., /api/v1/auth/login)
 * @returns Service name or null if no match
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
 * @param serviceName - Service name from ROUTE_PATTERNS
 * @returns Service config or null if not found
 */
export function getServiceConfig(serviceName: string): ServiceConfig | null {
  return SERVICES[serviceName] || null;
}
