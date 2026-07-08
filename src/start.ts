import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { getServiceConfig, getServiceForPath } from "./lib/gateway-config";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

/**
 * Default backend origin for the Express monolith. Every entry in gateway-config
 * points here during Phase 1, so this env var is the single knob to point the
 * whole app at a deployed backend.
 */
const DEFAULT_BACKEND_ORIGIN =
  process.env.BACKEND_ORIGIN || process.env.AUTH_SERVICE_URL || "http://localhost:4000";

function resolveTargetOrigin(pathname: string): string {
  const serviceName = getServiceForPath(pathname);
  if (serviceName) {
    const config = getServiceConfig(serviceName);
    if (config?.url) return config.url;
  }
  return DEFAULT_BACKEND_ORIGIN;
}

/**
 * API proxy. TanStack Start v1 has no file-based server routes here, so the
 * gateway runs as request middleware: any /api/v1 or /api/health request is
 * forwarded verbatim to the Express backend and short-circuits SSR by returning
 * a Response. All other requests fall through to the app (next()).
 */
const apiProxyMiddleware = createMiddleware().server(async ({ request, pathname, next }) => {
  const isApiRequest = pathname.startsWith("/api/v1") || pathname.startsWith("/api/health");
  if (!isApiRequest) {
    return next();
  }

  const origin = resolveTargetOrigin(pathname);
  const incomingUrl = new URL(request.url);
  const targetUrl = `${origin}${pathname}${incomingUrl.search}`;

  const headers = new Headers(request.headers);
  // Hop-by-hop / host headers must not be forwarded to the upstream.
  headers.delete("host");
  headers.delete("connection");

  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  try {
    const upstream = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: "manual",
    });

    // fetch auto-decodes the body, so drop encoding/length headers that would
    // otherwise describe the original (compressed) payload and corrupt it.
    const responseHeaders = new Headers(upstream.headers);
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");
    responseHeaders.delete("transfer-encoding");

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(`[api-proxy] Failed to reach backend at ${targetUrl}:`, error);
    return new Response(
      JSON.stringify({
        error: "Backend unavailable",
        message: `Could not reach the API backend at ${origin}. Start the Express server or set BACKEND_ORIGIN (or the *_SERVICE_URL vars) to its URL.`,
      }),
      { status: 502, headers: { "content-type": "application/json" } },
    );
  }
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware, apiProxyMiddleware],
}));
