/**
 * Gateway Startup Initialization
 *
 * This module handles startup initialization for the API Gateway.
 * It starts health checks and validates service configurations.
 */

import { healthChecker } from "./gateway-health";
import { SERVICES } from "./gateway-config";

let initialized = false;

/**
 * Initialize the API Gateway
 * Call this once when the server starts
 */
export async function initializeGateway(): Promise<void> {
  if (initialized) {
    console.log("[Gateway] Already initialized");
    return;
  }

  console.log("[Gateway] Initializing...");

  // Log configured services
  console.log("[Gateway] Configured services:");
  for (const [name, config] of Object.entries(SERVICES)) {
    console.log(`  - ${name}: ${config.url}`);
  }

  // Start health checks
  healthChecker.start(parseInt(process.env.HEALTH_CHECK_INTERVAL || "30000", 10));

  // Perform initial health check
  await healthChecker.checkAllServices();

  const report = healthChecker.getReport();
  console.log("[Gateway] Initial health check:");
  for (const service of report.services) {
    const status = service.healthy ? "✓" : "✗";
    console.log(`  ${status} ${service.service} (${service.responseTime || "N/A"}ms)`);
  }

  initialized = true;
  console.log("[Gateway] Initialization complete");
}

/**
 * Shutdown the API Gateway
 */
export function shutdownGateway(): void {
  console.log("[Gateway] Shutting down...");
  healthChecker.stop();
  initialized = false;
}

/**
 * Check if gateway is initialized
 */
export function isGatewayInitialized(): boolean {
  return initialized;
}
