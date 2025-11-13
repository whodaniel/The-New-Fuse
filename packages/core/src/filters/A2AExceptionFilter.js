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
var A2AExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.A2AAgentNotFoundException = exports.A2AExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const A2AService_1 = require("../services/A2AService");
const errors_1 = require("../utils/errors");
let A2AExceptionFilter = A2AExceptionFilter_1 = class A2AExceptionFilter {
    a2aService;
    logger = new common_1.Logger(A2AExceptionFilter_1.name);
    constructor(a2aService) {
        this.a2aService = a2aService;
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception instanceof common_1.HttpException
            ? exception.getStatus()
            : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const message = exception instanceof common_1.HttpException ? exception.message : (0, errors_1.getErrorMessage)(exception);
        const errorResponse = exception instanceof common_1.HttpException
            ? exception.getResponse()
            : { message };
        // Extract A2A-specific information
        const agentId = this.extractAgentId(request);
        const requestId = request.a2aMetadata?.requestId || this.generateRequestId();
        const interactionType = this.getInteractionType(request);
        // Create A2A-specific error response
        const a2aErrorResponse = {
            error: {
                code: this.getErrorCode(status, exception),
                message,
                details: typeof errorResponse === 'object' && errorResponse !== null ? errorResponse : { message: errorResponse },
                timestamp: new Date().toISOString(),
                requestId,
                agentId: agentId || undefined,
                interactionType,
                path: request.url,
                method: request.method,
            },
            metadata: {
                statusCode: status,
                errorType: this.getErrorType(exception),
                retryable: this.isRetryableError(status, exception),
                suggestedAction: this.getSuggestedAction(status, exception),
            },
        };
        // Log the error with A2A context
        this.logError(exception, request, a2aErrorResponse);
        // Send error to A2A service for tracking if it's an A2A interaction
        if (this.isA2AInteraction(request)) {
            this.a2aService.logError({
                requestId,
                agentId,
                interactionType,
                error: a2aErrorResponse.error,
                metadata: a2aErrorResponse.metadata,
                timestamp: new Date().toISOString(),
            }).catch((err) => {
                this.logger.error(`Failed to log A2A error: ${(0, errors_1.getErrorMessage)(err)});
      });
    }

    // Send the response
    response.status(status).json(a2aErrorResponse);
  }

  private extractAgentId(request: Request): string | null {
    // Try to extract agent ID from various sources
    if (request.headers?.['x-agent-id']) {
      return request.headers['x-agent-id'] as string;
    }

    if (request.query?.agentId) {
      return request.query.agentId as string;
    }

    if (request.body?.agentId) {
      return request.body.agentId;
    }

    if (request.body?.fromAgentId) {
      return request.body.fromAgentId;
    }

    if (request.agent?.id) {
      return request.agent.id;
    }

    return null;
  }

  private generateRequestId(): string {`);
                return `err_${Date.now()}`;
                _$;
                {
                    Math.random().toString(36).substr(2, 9);
                }
                ;
            }, private, getInteractionType(request, Request), string, {
                const: url = request.url,
                const: method = request.method,
                if(url) { }, : .includes('/register')
            });
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
    }
    getErrorCode(status, exception) {
        if (exception instanceof common_1.HttpException) {
            const response = exception.getResponse();
            if (typeof response === 'object' && response !== null && 'error' in response) {
                return response.error;
            }
        }
        // Map HTTP status codes to A2A error codes
        const errorCodeMap = {
            400: 'INVALID_REQUEST',
            401: 'UNAUTHORIZED',
            403: 'FORBIDDEN',
            404: 'AGENT_NOT_FOUND',
            409: 'CONFLICT',
            422: 'VALIDATION_ERROR',
            429: 'RATE_LIMIT_EXCEEDED',
            500: 'INTERNAL_ERROR',
            502: 'GATEWAY_ERROR',
            503: 'SERVICE_UNAVAILABLE',
            504: 'TIMEOUT',
        };
        return errorCodeMap[status] || 'UNKNOWN_ERROR';
    }
    getErrorType(exception) {
        if (exception instanceof common_1.HttpException) {
            return 'HTTP_EXCEPTION';
        }
        if (exception instanceof Error) {
            return exception.constructor.name;
        }
        return 'UNKNOWN_ERROR';
    }
    isRetryableError(status, _exception) {
        // Define retryable errors
        const retryableStatusCodes = [
            common_1.HttpStatus.REQUEST_TIMEOUT,
            common_1.HttpStatus.TOO_MANY_REQUESTS,
            common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            common_1.HttpStatus.BAD_GATEWAY,
            common_1.HttpStatus.SERVICE_UNAVAILABLE,
            common_1.HttpStatus.GATEWAY_TIMEOUT,
        ];
        return retryableStatusCodes.includes(status);
    }
    getSuggestedAction(status, _exception) {
        if (status === common_1.HttpStatus.NOT_FOUND) {
            return 'Verify the agent ID and ensure the agent is registered';
        }
        if (status === common_1.HttpStatus.FORBIDDEN) {
            return 'Check agent permissions and required capabilities';
        }
        if (status === common_1.HttpStatus.UNAUTHORIZED) {
            return 'Provide valid authentication credentials';
        }
        if (status === common_1.HttpStatus.BAD_REQUEST) {
            return 'Review and correct the request parameters';
        }
        if (status === common_1.HttpStatus.TOO_MANY_REQUESTS) {
            return 'Reduce request frequency and implement rate limiting';
        }
        if (status >= common_1.HttpStatus.INTERNAL_SERVER_ERROR) {
            return 'Retry the request or contact system administrator';
        }
        return 'Review the error details and take appropriate action';
    }
    isA2AInteraction(request) {
        const url = request.url;
        return url.includes('/a2a/') ||
            url.includes('/agents/') ||
            url.includes('/messages/') ||
            (request.body && (request.body.toAgentId || request.body.fromAgentId));
    }
    logError(exception, request, a2aErrorResponse) {
        const agentId = a2aErrorResponse.error.agentId;
        const requestId = a2aErrorResponse.error.requestId;
        const status = a2aErrorResponse.metadata.statusCode;
        `
    const logMessage = `[$];
        {
            requestId;
        }
        `] A2A Error - Agent: ${agentId || 'anonymous'} - ${request.method} ${request.url} - Status: ${status};

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(logMessage, exception instanceof Error ? exception.stack : undefined);
    } else {
      this.logger.warn(logMessage);
    }` `
    // Log additional context for debugging`;
        this.logger.debug(Error, details, $, { JSON, : .stringify(a2aErrorResponse.error) });
        `
    this.logger.debug(Request body: ${JSON.stringify(request.body)}`;
        ;
        this.logger.debug(Request, headers, $, { JSON, : .stringify(request.headers) });
    }
};
exports.A2AExceptionFilter = A2AExceptionFilter;
exports.A2AExceptionFilter = A2AExceptionFilter = A2AExceptionFilter_1 = __decorate([
    (0, common_1.Catch)(),
    __metadata("design:paramtypes", [A2AService_1.A2AService])
], A2AExceptionFilter);
// Custom A2A exceptions for specific scenarios
class A2AAgentNotFoundException extends common_1.HttpException {
}
exports.A2AAgentNotFoundException = A2AAgentNotFoundException;
`
  constructor(agentId: string) {`;
super({
    error: 'AGENT_NOT_FOUND',
    message: `Agent not found: ${agentId},
      agentId,
    }, HttpStatus.NOT_FOUND);
  }
}

export class A2AInvalidMessageException extends HttpException {
  constructor(message: string, details?: any) {
    super({
      error: 'INVALID_MESSAGE',
      message,
      details,
    }, HttpStatus.BAD_REQUEST);
  }
}

export class A2ACapabilityMismatchException extends HttpException {
  constructor(requiredCapabilities: string[], agentCapabilities: string[]) {
    super({
      error: 'CAPABILITY_MISMATCH',
      message: 'Agent does not have required capabilities',
      requiredCapabilities,
      agentCapabilities,
    }, HttpStatus.FORBIDDEN);
  }
}

export class A2AAgentOfflineException extends HttpException {
  constructor(agentId: string) {`
} `,
      agentId,
    }, HttpStatus.SERVICE_UNAVAILABLE);
  }
}

export class A2ARateLimitExceededException extends HttpException {
  constructor(agentId: string, limit: number, window: string) {
    super({
      error: 'RATE_LIMIT_EXCEEDED',
      message: Rate limit exceeded for agent: ${agentId}`, agentId, limit, window, common_1.HttpStatus.TOO_MANY_REQUESTS);
//# sourceMappingURL=A2AExceptionFilter.js.map