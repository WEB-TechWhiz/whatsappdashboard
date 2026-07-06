/**
 * Gateway Health Check System
 * 
 * Monitors the health of all registered microservices.
 * If a service is down, requests can be rerouted to fallback services or return 503.
 */

import { SERVICES, type ServiceConfig } from './gateway-config';

export interface HealthStatus {
  service: string;
  healthy: boolean;
  lastCheck: Date;
  responseTime?: number;
  error?: string;
}

class HealthChecker {
  private healthCache: Map<string, HealthStatus> = new Map();
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private readonly CACHE_TTL = 10000; // 10 seconds

  /**
   * Initialize health checks for all services
   */
  public start(intervalMs: number = 30000): void {
    if (this.checkInterval) return;

    console.log('[Gateway] Starting health checks every', intervalMs, 'ms');
    this.checkInterval = setInterval(() => {
      void this.checkAllServices();
    }, intervalMs);

    // Initial check
    this.checkAllServices();
  }

  /**
   * Stop health checks
   */
  public stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Check health of all services
   */
  public async checkAllServices(): Promise<void> {
    const promises = Object.entries(SERVICES).map(([name, config]) =>
      this.checkService(name, config),
    );
    await Promise.all(promises);
  }

  /**
   * Check health of a single service
   */
  public async checkService(
    serviceName: string,
    config: ServiceConfig,
  ): Promise<HealthStatus> {
    const status: HealthStatus = {
      service: serviceName,
      healthy: false,
      lastCheck: new Date(),
    };

    if (!config.healthCheckPath) {
      status.healthy = true;
      this.healthCache.set(serviceName, status);
      return status;
    }

    try {
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        config.timeout || 5000,
      );

      try {
        const response = await fetch(
          `${config.url}${config.healthCheckPath}`,
          {
            method: 'GET',
            signal: controller.signal,
          },
        );

        clearTimeout(timeoutId);
        status.responseTime = Date.now() - startTime;
        status.healthy = response.ok && response.status < 500;

        if (!status.healthy) {
          status.error = `HTTP ${response.status}`;
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      status.healthy = false;
      status.error = error instanceof Error ? error.message : 'Unknown error';
    }

    this.healthCache.set(serviceName, status);
    return status;
  }

  /**
   * Get current health status of a service
   */
  public getStatus(serviceName: string): HealthStatus | null {
    return this.healthCache.get(serviceName) || null;
  }

  /**
   * Check if a service is healthy (uses cached status)
   */
  public isHealthy(serviceName: string): boolean {
    const status = this.getStatus(serviceName);
    if (!status) return false;

    // Consider cache expired after CACHE_TTL
    const isStale = Date.now() - status.lastCheck.getTime() > this.CACHE_TTL;
    if (isStale) {
      // Optimistically return true if stale (prefer availability over accuracy)
      return true;
    }

    return status.healthy;
  }

  /**
   * Get all service statuses
   */
  public getAllStatus(): HealthStatus[] {
    return Array.from(this.healthCache.values());
  }

  /**
   * Get health report for monitoring/debugging
   */
  public getReport(): {
    timestamp: Date;
    services: HealthStatus[];
    healthy: boolean;
  } {
    const statuses = this.getAllStatus();
    const healthy = statuses.length > 0 && statuses.every((s) => s.healthy);

    return {
      timestamp: new Date(),
      services: statuses,
      healthy,
    };
  }
}

// Export singleton instance
export const healthChecker = new HealthChecker();
