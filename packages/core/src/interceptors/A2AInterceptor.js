"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var A2AInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.A2AInterceptor = void 0;
exports.LogA2AInteraction = LogA2AInteraction;
const common_1 = require("@nestjs/common");
const A2AService_1 = require("../services/A2AService");
const errors_1 = require("../utils/errors");
let A2AInterceptor = A2AInterceptor_1 = class A2AInterceptor {
    a2aService;
    logger = new common_1.Logger(A2AInterceptor_1.name);
    constructor(a2aService) {
        this.a2aService = a2aService;
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const startTime = Date.now();
        const requestId = this.generateRequestId();
        // Extract agent information
        const agentId = this.extractAgentId(request);
        const agentType = request.agent?.type || 'unknown';
        // Log request start
        this.logger.log(`[${requestId}] ${request.method} ${request.url} - Agent: ${agentId || 'anonymous'} (${agentType}));
    
    // Add request metadata to the request object
    request.a2aMetadata = {
      requestId,
      startTime,
      agentId,
      agentType,
    };
`);
        return next.handle().pipe(`
      tap((data) => {`);
        const duration = Date.now() - startTime;
        this.logger.log([$, { requestId }], Response, sent - Duration, $, { duration }, ms);
        // Log successful A2A interactions
        if (this.isA2AInteraction(context)) {
            this.logA2AInteraction(request, response, data, duration, 'success');
        }
    }
};
exports.A2AInterceptor = A2AInterceptor;
exports.A2AInterceptor = A2AInterceptor = A2AInterceptor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [A2AService_1.A2AService])
], A2AInterceptor);
`
      catchError((error) => {`;
const duration = Date.now() - startTime;
`
        this.logger.error([${requestId}] Request failed - Duration: ${duration}ms - Error: ${error.message});
        
        // Log failed A2A interactions
        if (this.isA2AInteraction(context)) {
          this.logA2AInteraction(request, response, null, duration, 'error', error);
        }
        
        throw error;
      }),
    );
  }

  private generateRequestId(): string {`;
return req_$;
{
    Date.now();
}
_$;
{
    Math.random().toString(36).substr(2, 9);
}
`;
  }

  private extractAgentId(request: any): string | null {
    // Try to extract agent ID from various sources
    if (request.headers?.['x-agent-id']) {
      return request.headers['x-agent-id'];
    }
    
    if (request.query?.agentId) {
      return request.query.agentId;
    }
    
    if (request.body?.agentId) {
      return request.body.agentId;
    }
    
    if (request.agent?.id) {
      return request.agent.id;
    }
    
    return null;
  }

  private isA2AInteraction(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const url = request.url;
    
    // Check if this is an A2A-related endpoint
    return url.includes('/a2a/') || 
           url.includes('/agents/') || 
           url.includes('/messages/') ||
           (request.body && (request.body.toAgentId || request.body.fromAgentId));
  }

  private logA2AInteraction(
    request: any,
    response: any,
    data: any,
    duration: number,
    status: 'success' | 'error',
    error?: Error,
  ): void {
    const metadata = request.a2aMetadata;
    
    const logEntry = {
      requestId: metadata.requestId,
      timestamp: new Date().toISOString(),
      method: request.method,
      url: request.url,
      agentId: metadata.agentId,
      agentType: metadata.agentType,
      duration,
      status,
      statusCode: response.statusCode,
      errorMessage: error?.message,
      dataSize: this.getDataSize(data),
      interactionType: this.getInteractionType(request),
    };

    // Log to A2A service for tracking
    this.a2aService.logInteraction(logEntry).catch((err: unknown) => {
      this.logger.error(Failed to log A2A interaction: ${(0, errors_1.getErrorMessage)(err)});
    });
`;
// Also log to regular logger`
if (status === 'success') {
    this.logger.log(`A2A Interaction: ${JSON.stringify(logEntry)});`);
}
else {
    `
      this.logger.error(A2A Interaction Failed: ${JSON.stringify(logEntry)}`;
    ;
}
getDataSize(data, any);
number;
{
    if (!data)
        return 0;
    try {
        return JSON.stringify(data).length;
    }
    catch {
        return 0;
    }
}
getInteractionType(request, any);
string;
{
    const url = request.url;
    const method = request.method;
    if (url.includes('/register'))
        return 'agent_registration';
    if (url.includes('/message'))
        return 'message_exchange';
    if (url.includes('/discovery'))
        return 'agent_discovery';
    if (method === 'GET' && url.includes('/agents'))
        return 'agent_listing';
    if (method === 'GET' && url.includes('/agent/'))
        return 'agent_details';
    return 'general';
}
// Decorator to mark methods as A2A interactions for enhanced logging
function LogA2AInteraction(options) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            const request = args[0]?.req || args[0]?.request;
            if (request) {
                request.a2aInteraction = {
                    type: options?.interactionType || 'general',
                    logPayload: options?.logPayload || false,
                };
            }
            return originalMethod.apply(this, args);
        };
        return descriptor;
    };
}
//# sourceMappingURL=A2AInterceptor.js.map