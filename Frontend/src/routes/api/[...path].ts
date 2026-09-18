/**
 * API Gateway Main Handler
 *
 * This catch-all route intercepts all /api/* requests and routes them
 * to the appropriate microservice based on URL patterns.
 *
 * During Phase 1, all requests route to the monolith (Express backend).
 * As new services are deployed, requests are gradually routed to them.
 */

// @ts-ignore - h3 types are globally available in Nitro environment
import { defineEventHandler, readBody, setResponseStatus, setHeader } from "h3";
import type { H3Event } from "h3";
import { dispatchRequest } from "../../lib/gateway-dispatcher";

export default defineEventHandler(async (event: H3Event) => {
  const path = `${event.node!.req.url || "/"}`;

  // Skip health checks - they're handled separately
  if (path.startsWith("/api/health")) {
    return; // Let the health.ts route handle it
  }

  console.log(`[Gateway] ${event.node!.req.method} ${path}`);

  // Get request body if present
  let body: any;

  if (event.node!.req.method !== "GET" && event.node!.req.method !== "HEAD") {
    try {
      body = await readBody(event);
    } catch (error) {
      console.warn("[Gateway] Could not parse request body:", error);
      // Continue without body
    }
  }

  // Get request headers
  const headers: Record<string, string> = {};
  const forwardHeaders = ["authorization", "content-type", "user-agent", "accept", "x-request-id"];

  for (const headerName of forwardHeaders) {
    const headerValue = event.node!.req.headers[headerName];
    if (headerValue) {
      headers[headerName] = Array.isArray(headerValue)
        ? headerValue.join(", ")
        : (headerValue as string);
    }
  }

  // Dispatch to appropriate service
  const result = await dispatchRequest(path, event.node!.req.method || "GET", body, headers);

  // Set response status
  setResponseStatus(event, result.statusCode);

  // Set response headers
  for (const [name, value] of Object.entries(result.headers)) {
    setHeader(event, name, value);
  }

  // Log the dispatch for debugging
  if (result.error) {
    console.warn(`[Gateway] Error dispatching to ${result.serviceName}:`, result.error);
  } else {
    console.log(`[Gateway] Dispatched to ${result.serviceName}: ${result.statusCode}`);
  }

  return result.responseBody;
});
