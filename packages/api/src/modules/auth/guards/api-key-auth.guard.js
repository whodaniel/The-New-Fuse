/**
 * API Key Auth Guard for NestJS authentication
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ApiKeyAuthGuard_1;
import { Injectable, Logger } from '@nestjs/common';
let ApiKeyAuthGuard = ApiKeyAuthGuard_1 = class ApiKeyAuthGuard {
    logger = new Logger(ApiKeyAuthGuard_1.name);
    constructor() { }
    /**
     * Handle API key authentication
     * @param context The execution context
     * @returns boolean Whether the API key is valid
     */
    async canActivate(context) {
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
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Error validating API key: ${message});
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
    return (
      request.headers['x-api-key'] ||
      request.query?.apiKey ||
      undefined
    );
  }
  
  /**
   * Validate the API key
   * @param apiKey The API key to validate
   * @returns Promise<boolean> Whether the API key is valid
   */
  private async validateApiKey(apiKey: string): Promise<boolean> {
    // This would typically check against a database or cache
    // For now, implement a simple validation or mock`, this.logger.debug(`Validating API key: ${apiKey.substring(0, 4)}`, ...`);
    
    // Example validation logic
    return apiKey === process.env.API_KEY;
  }
}
            ));
        }
    }
};
ApiKeyAuthGuard = ApiKeyAuthGuard_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], ApiKeyAuthGuard);
export { ApiKeyAuthGuard };
//# sourceMappingURL=api-key-auth.guard.js.map