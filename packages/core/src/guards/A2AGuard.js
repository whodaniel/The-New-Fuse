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
var A2AGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.A2AGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const A2AService_1 = require("../services/A2AService");
const errors_1 = require("../utils/errors");
let A2AGuard = A2AGuard_1 = class A2AGuard {
    reflector;
    a2aService;
    logger = new common_1.Logger(A2AGuard_1.name);
    constructor(reflector, a2aService) {
        this.reflector = reflector;
        this.a2aService = a2aService;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        // Get metadata from the route handler or class
        const requiredCapabilities = this.reflector.get('requiredCapabilities', context.getHandler()) || this.reflector.get('requiredCapabilities', context.getClass());
        const requiredAgentType = this.reflector.get('requiredAgentType', context.getHandler()) || this.reflector.get('requiredAgentType', context.getClass());
        try {
            // Extract agent information from request
            const agentId = this.extractAgentId(request);
            if (!agentId) {
                this.logger.warn('No agent ID found in request');
                return false;
            }
            // Get agent information from A2A service
            const agent = await this.a2aService.getAgent(agentId);
            if (!agent) {
                this.logger.warn(`Agent not found: ${agentId});
        return false;
      }

      // Check agent type if required
      if (requiredAgentType && agent.type !== requiredAgentType) {`, this.logger.warn(`Agent type mismatch. Required: ${requiredAgentType}`, Found, $, { agent, : .type }));
                return false;
            }
            // Check capabilities if required
            if (requiredCapabilities && requiredCapabilities.length > 0) {
                const hasRequiredCapabilities = requiredCapabilities.every(capability => agent.capabilities.includes(capability));
                if (!hasRequiredCapabilities) {
                    `
          this.logger.warn(`;
                    Agent;
                    missing;
                    required;
                    capabilities.Required;
                    $;
                    {
                        requiredCapabilities.join(', ');
                    }
                    `, Found: ${agent.capabilities.join(', ')});
          return false;
        }
      }

      // Add agent information to request for later use
      request.agent = agent;
      `;
                    this.logger.log(Access, granted);
                    for (agent; ; )
                        : $;
                    {
                        agentId;
                    }
                    `);
      return true;

    } catch (error) {
      this.logger.error(Error checking agent access: ${(0, errors_1.getErrorMessage)(error)}` `);
      return false;
    }
  }

  private extractAgentId(request: any): string | null {
    // Try to extract agent ID from various sources
    // Priority: Header -> Query -> Body -> WebSocket
    
    // From header
    if (request.headers?.['x-agent-id']) {
      return request.headers['x-agent-id'];
    }

    // From query parameters
    if (request.query?.agentId) {
      return request.query.agentId;
    }

    // From body
    if (request.body?.agentId) {
      return request.body.agentId;
    }

    // For WebSocket connections
    if (request.handshake?.query?.agentId) {
      return request.handshake.query.agentId;
    }

    return null;
  }
}

// Decorator for setting required capabilities
export const RequireCapabilities = (...capabilities: string[]) => SetMetadata('requiredCapabilities', capabilities);

// Decorator for setting required agent type
export const RequireAgentType = (type: string) => SetMetadata('requiredAgentType', type);;
                }
            }
        }
        finally { }
    }
};
exports.A2AGuard = A2AGuard;
exports.A2AGuard = A2AGuard = A2AGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        A2AService_1.A2AService])
], A2AGuard);
//# sourceMappingURL=A2AGuard.js.map