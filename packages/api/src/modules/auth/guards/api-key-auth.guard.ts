/**
 * API Key Auth Guard for NestJS authentication
 */

import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyAuthGuard.name);

  constructor() {}

  /**
   * Handle API key authentication
   * @param context The execution context
   * @returns boolean Whether the API key is valid
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      this.logger.debug('No API key found in request');
      return false;
    }

    try {
      const isValid = await this.validateApiKey(apiKey);
      if (isValid) {
        this.logger.debug('API key validated successfully');
        // Attach API key metadata to request
        request.apiKey = {
          id: 'api-key-id', // This would come from your validation
          serviceName: 'service-name', // This would come from your validation
        };
        return true;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error validating API key: ${message}`);
    }

    this.logger.debug('API key validation failed');
    return false;
  }

  /**
   * Extract API key from request
   * @param request HTTP request
   * @returns string | undefined
   */
  private extractApiKey(request: any): string | undefined {
    // Try to find API key in headers, query params, etc.
    return request.headers['x-api-key'] || request.query?.apiKey || undefined;
  }

  /**
   * Validate the API key
   * @param apiKey The API key to validate
   * @returns Promise<boolean> Whether the API key is valid
   */
  private async validateApiKey(apiKey: string): Promise<boolean> {
    // This would typically check against a database or cache
    // For now, implement a simple validation or mock
    this.logger.debug(`Validating API key: ${apiKey.substring(0, 4)}...`);

    // Example validation logic
    return apiKey === process.env.API_KEY;
  }
}
