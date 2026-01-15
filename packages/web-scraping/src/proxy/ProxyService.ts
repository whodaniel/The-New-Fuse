/**
 * Proxy Service for CORS-free web requests
 *
 * Provides serverless-compatible proxy functionality for AI agents
 * to access any website without CORS restrictions.
 */

import { isValidPublicUrl } from '@the-new-fuse/utils';
import axios from 'axios';
import { ProxyRequest, ProxyResponse, SecurityPolicy } from '../types';
// Simple error and monitoring implementations for proxy service
class BaseErrorHandler {
  async handleError(error: Error, context?: any): Promise<void> {
    // eslint-disable-next-line no-console
    console.error('[Proxy Error]', error.message, context || {});
  }
}

class BaseMonitoringSystem {
  recordMetric(name: string, value: number, tags?: any): void {
    // eslint-disable-next-line no-console
    console.log(`[Proxy Metric] ${name}: ${value}`, tags || {});
  }

  getMetrics(): any {
    return { totalRequests: 0, successRate: 1.0, averageResponseTime: 0 };
  }
}

export class ProxyService {
  private readonly errorHandler: BaseErrorHandler;
  private readonly monitoring: BaseMonitoringSystem;
  private readonly securityPolicy: SecurityPolicy;
  private readonly requestCounts = new Map<string, { count: number; resetTime: number }>();

  constructor(securityPolicy: SecurityPolicy = {}) {
    this.errorHandler = new BaseErrorHandler();
    this.monitoring = new BaseMonitoringSystem();
    this.securityPolicy = {
      maxFileSize: 10 * 1024 * 1024, // 10MB for proxy
      allowedContentTypes: [
        'text/html',
        'text/plain',
        'application/json',
        'application/xml',
        'text/xml',
        'text/css',
        'application/javascript',
        'text/javascript',
      ],
      rateLimit: {
        requests: 50,
        windowMs: 60000, // 1 minute
      },
      contentFiltering: true,
      ...securityPolicy,
    };
  }

  /**
   * Proxy a web request
   */
  async proxyRequest(request: ProxyRequest): Promise<ProxyResponse> {
    const startTime = Date.now();
    const { url, method = 'GET', headers = {}, body, config = {} } = request;

    try {
      // Rate limiting check
      await this.checkRateLimit(this.getClientId(request));

      // Security validation
      await this.validateProxyRequest(request);

      this.monitoring.recordMetric('proxy_request', 1, { method, url });

      // Prepare request configuration
      const axiosConfig = {
        method: method.toLowerCase() as any,
        url,
        headers: {
          'User-Agent': config.userAgent || 'Mozilla/5.0 (compatible; TheNewFuse-Proxy/1.0)',
          ...this.sanitizeHeaders(headers),
        },
        timeout: config.timeout || 15000,
        maxRedirects: config.maxRedirects || 5,
        maxContentLength: this.securityPolicy.maxFileSize,
        validateStatus: () => true, // Accept all status codes
        data: body,
      };

      // Make the request
      const response = await axios(axiosConfig);

      // Validate response content type
      const contentType = response.headers['content-type'] || '';
      if (!this.isAllowedContentType(contentType)) {
        throw new Error(`Response content type not allowed: ${contentType}`);
      }

      // Filter response headers
      const filteredHeaders = this.filterResponseHeaders(response.headers);

      const proxyResponse: ProxyResponse = {
        success: true,
        statusCode: response.status,
        headers: filteredHeaders,
        body: response.data,
        contentType: contentType.split(';')[0].trim(),
        metadata: {
          url,
          method,
          executionTime: Date.now() - startTime,
          timestamp: new Date(),
        },
      };

      this.monitoring.recordMetric('proxy_success', 1, { method });
      return proxyResponse;
    } catch (error) {
      this.monitoring.recordMetric('proxy_error', 1, { method });

      const errorMessage = error instanceof Error ? error.message : 'Proxy request failed';
      await this.errorHandler.handleError(error as Error, { url, method });

      return {
        success: false,
        statusCode: 500,
        headers: {},
        body: '',
        error: errorMessage,
        metadata: {
          url,
          method,
          executionTime: Date.now() - startTime,
          timestamp: new Date(),
        },
      };
    }
  }

  /**
   * Validate proxy request for security
   */
  private async validateProxyRequest(request: ProxyRequest): Promise<void> {
    const { url, method, body } = request;

    // Validate URL
    const validationResult = await isValidPublicUrl(url);
    if (!validationResult.valid) {
      throw new Error(validationResult.reason);
    }

    const parsedUrl = new URL(url);

    // Check domain restrictions
    if (this.securityPolicy.allowedDomains) {
      const isAllowed = this.securityPolicy.allowedDomains.some((domain) =>
        parsedUrl.hostname.endsWith(domain)
      );
      if (!isAllowed) {
        throw new Error(`Domain not in allowlist: ${parsedUrl.hostname}`);
      }
    }

    if (this.securityPolicy.blockedDomains) {
      const isBlocked = this.securityPolicy.blockedDomains.some((domain) =>
        parsedUrl.hostname.endsWith(domain)
      );
      if (isBlocked) {
        throw new Error(`Domain is blocked: ${parsedUrl.hostname}`);
      }
    }

    // Validate method
    const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'];
    if (!allowedMethods.includes(method || 'GET')) {
      throw new Error(`HTTP method not allowed: ${method}`);
    }

    // Validate body size
    if (body && Buffer.byteLength(body, 'utf8') > (this.securityPolicy.maxFileSize || 0)) {
      throw new Error('Request body too large');
    }
  }

  /**
   * Check rate limiting
   */
  private async checkRateLimit(clientId: string): Promise<void> {
    if (!this.securityPolicy.rateLimit) {
      return;
    }

    const now = Date.now();
    const { requests, windowMs } = this.securityPolicy.rateLimit;

    const clientData = this.requestCounts.get(clientId);

    if (!clientData || now > clientData.resetTime) {
      // Reset or initialize counter
      this.requestCounts.set(clientId, {
        count: 1,
        resetTime: now + windowMs,
      });
      return;
    }

    if (clientData.count >= requests) {
      throw new Error(`Rate limit exceeded. Max ${requests} requests per ${windowMs}ms`);
    }

    clientData.count++;
  }

  /**
   * Get client identifier for rate limiting
   */
  private getClientId(_request: ProxyRequest): string {
    // In a real implementation, this would use IP address or API key
    // For now, use a simple hash of the request
    return 'default-client';
  }

  /**
   * Sanitize request headers
   */
  private sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sanitized: Record<string, string> = {};
    const allowedHeaders = [
      'accept',
      'accept-language',
      'accept-encoding',
      'cache-control',
      'content-type',
      'referer',
      'user-agent',
    ];

    for (const [key, value] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase();
      if (allowedHeaders.includes(lowerKey)) {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Filter response headers
   */
  private filterResponseHeaders(headers: Record<string, any>): Record<string, string> {
    const filtered: Record<string, string> = {};
    const allowedHeaders = [
      'content-type',
      'content-length',
      'content-encoding',
      'cache-control',
      'expires',
      'last-modified',
      'etag',
    ];

    for (const [key, value] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase();
      if (allowedHeaders.includes(lowerKey) && typeof value === 'string') {
        filtered[key] = value;
      }
    }

    // Add CORS headers for browser compatibility
    filtered['Access-Control-Allow-Origin'] = '*';
    filtered['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    filtered['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';

    return filtered;
  }

  /**
   * Check if content type is allowed
   */
  private isAllowedContentType(contentType: string): boolean {
    if (!this.securityPolicy.allowedContentTypes) {
      return true;
    }

    const mainType = contentType.split(';')[0].trim().toLowerCase();
    return this.securityPolicy.allowedContentTypes.includes(mainType);
  }

  /**
   * Get proxy statistics
   */
  getStatistics() {
    return {
      metrics: this.monitoring.getMetrics(),
      activeClients: this.requestCounts.size,
      rateLimitInfo: Array.from(this.requestCounts.entries()).map(([clientId, data]) => ({
        clientId,
        requestCount: data.count,
        resetTime: new Date(data.resetTime),
      })),
    };
  }

  /**
   * Clear rate limit data (for cleanup)
   */
  clearRateLimitData(): void {
    const now = Date.now();
    for (const [clientId, data] of this.requestCounts.entries()) {
      if (now > data.resetTime) {
        this.requestCounts.delete(clientId);
      }
    }
  }
}
