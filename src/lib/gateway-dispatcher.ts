/**
 * Gateway Route Dispatcher
 * 
 * Routes API requests to the appropriate microservice based on URL patterns.
 * This is the core of the API Gateway - determines where each request goes.
 */

import { getServiceForPath, getServiceConfig } from './gateway-config';

export interface DispatchResult {
  serviceName: string;
  targetUrl: string;
  statusCode: number;
  responseBody: any;
  headers: Record<string, string>;
  error?: string;
}

/**
 * Dispatch a request to the appropriate service
 * 
 * @param path - API path (e.g., /api/v1/auth/login)
 * @param method - HTTP method (GET, POST, etc.)
 * @param body - Request body (optional)
 * @param headers - Request headers
 * @returns Dispatch result with response
 */
export async function dispatchRequest(
  path: string,
  method: string,
  body?: any,
  headers?: Record<string, string>,
): Promise<DispatchResult> {
  // Determine which service should handle this request
  const serviceName = getServiceForPath(path);

  if (!serviceName) {
    return {
      serviceName: 'unknown',
      targetUrl: 'unknown',
      statusCode: 404,
      responseBody: { error: 'No service registered for this path' },
      headers: { 'content-type': 'application/json' },
      error: 'Route not found',
    };
  }

  // Get service configuration
  const serviceConfig = getServiceConfig(serviceName);
  if (!serviceConfig) {
    return {
      serviceName,
      targetUrl: 'unknown',
      statusCode: 503,
      responseBody: { error: 'Service not configured' },
      headers: { 'content-type': 'application/json' },
      error: 'Service configuration missing',
    };
  }

  // Construct target URL
  const targetUrl = `${serviceConfig.url}${path}`;

  try {
    // Prepare request options
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'content-type': 'application/json',
        ...headers,
      },
    };

    // Add body if present
    if (body && method !== 'GET' && method !== 'HEAD') {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    // Make the request to the target service
    // Use AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      serviceConfig.timeout || 30000,
    );

    try {
      const response = await fetch(targetUrl, {
        ...fetchOptions,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      return await handleResponse(response, serviceName, targetUrl);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw fetchError;
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error during dispatch';

    console.error(`[Gateway] Dispatch error for ${serviceName}:`, errorMessage);

    return {
      serviceName,
      targetUrl,
      statusCode: 503,
      responseBody: {
        error: 'Service unavailable',
        message: errorMessage,
      },
      headers: { 'content-type': 'application/json' },
      error: errorMessage,
    };
  }
}

/**
 * Handle response from target service
 */
async function handleResponse(
  response: Response,
  serviceName: string,
  targetUrl: string,
): Promise<DispatchResult> {
  // Parse response body
  let responseBody: any;
  const contentType = response.headers.get('content-type');

  if (contentType?.includes('application/json')) {
    try {
      responseBody = await response.json();
    } catch {
      responseBody = null;
    }
  } else {
    responseBody = await response.text();
  }

  // Build response headers to forward back to client
  const responseHeaders: Record<string, string> = {};
  const headersToForward = [
    'content-type',
    'cache-control',
    'authorization',
    'set-cookie',
  ];

  for (const headerName of headersToForward) {
    const headerValue = response.headers.get(headerName);
    if (headerValue) {
      responseHeaders[headerName] = headerValue;
    }
  }

  return {
    serviceName,
    targetUrl,
    statusCode: response.status,
    responseBody,
    headers: responseHeaders,
  };
}

/**
 * Construct a Response object from dispatch result
 */
export function buildResponse(result: DispatchResult): Response {
  const responseBody =
    typeof result.responseBody === 'string'
      ? result.responseBody
      : JSON.stringify(result.responseBody);

  const headers = new Headers(result.headers);

  return new Response(responseBody, {
    status: result.statusCode,
    headers,
  });
}
