/**
 * Proxy Service
 * Handles routing and load balancing to backend services
 */

import { HttpService } from '@nestjs/axios';
import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';

export interface ServiceConfig {
  name: string;
  baseUrl: string;
  healthPath: string;
  timeout?: number;
  retries?: number;
}

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);
  private readonly services: Map<string, ServiceConfig> = new Map();

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    this.initializeServices();
  }

  private initializeServices() {
    // Register backend services
    // Updated port assignments to avoid conflicts
    this.registerService({
      name: 'backend',
      baseUrl: this.configService.get(
        'BACKEND_SERVICE_URL',
        this.configService.get('BACKEND_URL', 'http://localhost:3004')
      ),
      healthPath: '/health',
      timeout: 30000,
      retries: 3,
    });

    this.registerService({
      name: 'webhooks',
      baseUrl: this.configService.get('WEBHOOKS_SERVICE_URL', 'http://localhost:3002'),
      healthPath: '/health',
      timeout: 30000,
      retries: 3,
    });

    this.registerService({
      name: 'agents',
      baseUrl: this.configService.get(
        'AGENTS_SERVICE_URL',
        this.configService.get('API_URL', 'http://localhost:3001')
      ),
      healthPath: '/health',
      timeout: 30000,
      retries: 3,
    });

    this.registerService({
      name: 'theia-ide',
      baseUrl: this.configService.get('THEIA_IDE_URL', 'http://localhost:3007'),
      healthPath: '/health',
      timeout: 60000,
      retries: 3,
    });

    this.registerService({
      name: 'casin8',
      baseUrl: this.configService.get(
        'CASIN8_SERVICE_URL',
        'https://casin8-games-production-b06e.up.railway.app'
      ),
      healthPath: '/health',
      timeout: 30000,
      retries: 3,
    });

    this.logger.log(`Registered ${this.services.size} backend services`);
  }

  registerService(config: ServiceConfig) {
    this.services.set(config.name, config);
    this.logger.log(`Registered service: ${config.name} -> ${config.baseUrl}`);
  }

  async proxyRequest(
    serviceName: string,
    path: string,
    method: string,
    headers: Record<string, string>,
    body?: any,
    query?: Record<string, string>
  ): Promise<AxiosResponse> {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new BadGatewayException(`Service '${serviceName}' not found`);
    }

    // Prevent edge/domain routing loops by removing inbound host/hop-by-hop headers.
    // We always let axios/node compute the correct Host for the target URL.
    const sanitizedHeaders = Object.fromEntries(
      Object.entries(headers || {}).filter(([key]) => {
        const normalized = key.toLowerCase();
        return ![
          'host',
          'connection',
          'content-length',
          'transfer-encoding',
          'keep-alive',
          'proxy-connection',
          'upgrade',
          'te',
          'trailer',
        ].includes(normalized);
      })
    );

    const url = `${service.baseUrl}${path}`;
    const config: AxiosRequestConfig = {
      method: method as any,
      url,
      headers: {
        ...sanitizedHeaders,
        // Add gateway identification
        'X-Gateway': 'the-new-fuse-api-gateway',
        'X-Forwarded-By': 'api-gateway',
      },
      timeout: service.timeout || 30000,
      params: query,
      maxRedirects: 0,
      // Preserve backend HTTP semantics (4xx/5xx) so gateway controllers
      // can return exact status/data instead of collapsing to 502.
      validateStatus: () => true,
    };

    if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      config.data = body;
    }

    try {
      this.logger.debug(`Proxying ${method.toUpperCase()} ${url}`);
      const response = await firstValueFrom(this.httpService.request(config));
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Proxy request failed for ${serviceName}:`, errorMessage);

      if (
        error instanceof Error &&
        'response' in error &&
        typeof error.response === 'object' &&
        'status' in error.response &&
        'data' in error.response
      ) {
        // Forward the error response from the backend service
        throw new BadGatewayException({
          message: 'Backend service error',
          service: serviceName,
          statusCode: (error.response as { status: number }).status,
          error: (error.response as { data: any }).data,
        });
      }

      throw new BadGatewayException({
        message: 'Service unavailable',
        service: serviceName,
        error: errorMessage,
      });
    }
  }

  async checkServiceHealth(serviceName: string): Promise<boolean> {
    const service = this.services.get(serviceName);
    if (!service) return false;

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${service.baseUrl}${service.healthPath}`, {
          timeout: 5000,
        })
      );
      return response.status === 200;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Health check failed for ${serviceName}: ${errorMessage}`);
      return false;
    }
  }

  async getAllServicesHealth(): Promise<Record<string, boolean>> {
    const healthChecks = Array.from(this.services.keys()).map(async (serviceName) => {
      const isHealthy = await this.checkServiceHealth(serviceName);
      return [serviceName, isHealthy] as [string, boolean];
    });

    const results = await Promise.all(healthChecks);
    return Object.fromEntries(results);
  }

  getServiceConfig(serviceName: string): ServiceConfig | undefined {
    return this.services.get(serviceName);
  }

  getAllServices(): ServiceConfig[] {
    return Array.from(this.services.values());
  }
}
