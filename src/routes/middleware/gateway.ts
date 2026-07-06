/**
 * API Gateway Middleware
 * 
 * This middleware initializes the API Gateway on the first request.
 * It ensures health checks and service registry are ready before routing requests.
 */

// @ts-ignore - h3 types are globally available in Nitro environment
import { defineEventHandler } from 'h3';
import type { H3Event } from 'h3';
import { initializeGateway, isGatewayInitialized } from '../../lib/gateway-startup';

// Initialize gateway on first request
let initPromise: Promise<void> | null = null;

export default defineEventHandler(async (event: H3Event) => {
  // Only initialize on /api requests
  if (!event.node!.req.url?.startsWith('/api')) {
    return;
  }

  // Initialize gateway once (use promise to avoid race conditions)
  if (!isGatewayInitialized()) {
    if (!initPromise) {
      initPromise = initializeGateway();
    }
    await initPromise;
  }
});
