/**
 * Health Check Endpoint for API Gateway
 * 
 * GET /api/health - Returns overall gateway health status
 * GET /api/health/:service - Returns health status for a specific service
 */

// @ts-ignore - h3 types are globally available in Nitro environment
import { defineEventHandler, setResponseStatus } from 'h3';
import type { H3Event } from 'h3';
import { healthChecker } from '../../lib/gateway-health';

export default defineEventHandler(async (event: H3Event) => {
  // Overall gateway health (default endpoint)
  const report = healthChecker.getReport();

  setResponseStatus(event, report.healthy ? 200 : 503);
  return report;
});
