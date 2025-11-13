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
var A2AMessagePipe_1, A2AAgentIdPipe_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.A2APipe = exports.A2AAgentIdPipe = exports.A2AMessagePipe = void 0;
const common_1 = require("@nestjs/common");
const A2AService_1 = require("../services/A2AService");
const errors_1 = require("../utils/errors");
let A2AMessagePipe = A2AMessagePipe_1 = class A2AMessagePipe {
    a2aService;
    logger = new common_1.Logger(A2AMessagePipe_1.name);
    constructor(a2aService) {
        this.a2aService = a2aService;
    }
    async transform(value, metadata) {
        if (metadata.type !== 'body') {
            return value;
        }
        // Validate A2A message structure
        if (this.isA2AMessage(value)) {
            return this.validateA2AMessage(value);
        }
        // Validate agent registration data
        if (this.isAgentRegistration(value)) {
            return this.validateAgentRegistration(value);
        }
        // Validate agent discovery request
        if (this.isAgentDiscovery(value)) {
            return this.validateAgentDiscovery(value);
        }
        return value;
    }
    isA2AMessage(value) {
        return value &&
            (value.toAgentId !== undefined || value.fromAgentId !== undefined) &&
            (value.content !== undefined || value.type !== undefined);
    }
    isAgentRegistration(value) {
        return value &&
            (value.name !== undefined || value.agentId !== undefined) &&
            value.capabilities !== undefined;
    }
    isAgentDiscovery(value) {
        return value &&
            (value.filter !== undefined || value.capabilities !== undefined) &&
            !value.toAgentId && !value.fromAgentId;
    }
    async validateA2AMessage(value) {
        const errors = [];
        // Required fields
        if (!value.toAgentId) {
            errors.push('toAgentId is required');
        }
        if (!value.fromAgentId) {
            errors.push('fromAgentId is required');
        }
        if (!value.content) {
            errors.push('content is required');
        }
        if (!value.type) {
            errors.push('type is required');
        }
        // Validate agent IDs exist
        if (value.toAgentId) {
            try {
                const toAgent = await this.a2aService.getAgent(value.toAgentId);
                if (!toAgent) {
                    errors.push(`Target agent not found: ${value.toAgentId});
        }
      } catch (error) {
        const errorMessage = getErrorMessage(error);`, errors.push(`Error validating target agent: ${errorMessage}`));
                }
            }
            finally {
            }
            if (value.fromAgentId) {
                try {
                    const fromAgent = await this.a2aService.getAgent(value.fromAgentId);
                    if (!fromAgent) {
                        errors.push(Source, agent, not, found, $, { value, : .fromAgentId });
                    }
                }
                catch (error) {
                    const errorMessage = (0, errors_1.getErrorMessage)(error);
                    `
        errors.push(Error validating source agent: ${errorMessage}`;
                    ;
                }
            }
            // Validate message type
            const validTypes = ['text', 'json', 'binary', 'command', 'response', 'error'];
            if (value.type && !validTypes.includes(value.type)) {
                errors.push(Invalid, message, type, $, { value, : .type }.Valid, types, $, { validTypes, : .join(', ') } `);
    }

    // Validate content based on type
    if (value.type === 'json' && value.content) {
      try {
        if (typeof value.content === 'string') {
          JSON.parse(value.content);
        }
      } catch (error) {
        errors.push('Content must be valid JSON for type "json"');
      }
    }

    if (value.type === 'binary' && value.content) {
      if (typeof value.content !== 'string' || !this.isBase64(value.content)) {
        errors.push('Content must be base64 encoded string for type "binary"');
      }
    }

    // Validate priority if provided
    if (value.priority !== undefined) {
      const priority = parseInt(value.priority);
      if (isNaN(priority) || priority < 1 || priority > 10) {
        errors.push('Priority must be a number between 1 and 10');
      }
    }

    // Validate TTL if provided
    if (value.ttl !== undefined) {
      const ttl = parseInt(value.ttl);
      if (isNaN(ttl) || ttl < 0) {
        errors.push('TTL must be a non-negative number');
      }
    }

    if (errors.length > 0) {
      this.logger.error(A2A message validation failed: ${errors.join(', ')});
      throw new BadRequestException(errors);
    }` `
    this.logger.log(`, A2A, message, validated, successfully);
                for (agents; ; )
                    : $;
                {
                    value.fromAgentId;
                }
                - > $;
                {
                    value.toAgentId;
                }
                ;
                return value;
            }
        }
    }
    async validateAgentRegistration(value) {
        const errors = [];
        // Required fields
        if (!value.name && !value.agentId) {
            errors.push('Either name or agentId is required');
        }
        if (!value.capabilities || !Array.isArray(value.capabilities)) {
            errors.push('capabilities must be an array');
        }
        // Validate capabilities
        if (value.capabilities && Array.isArray(value.capabilities)) {
            if (value.capabilities.length === 0) {
                errors.push('At least one capability must be specified');
            }
            // Check for duplicate capabilities
            const uniqueCapabilities = [...new Set(value.capabilities)];
            if (uniqueCapabilities.length !== value.capabilities.length) {
                errors.push('Duplicate capabilities found');
            }
            // Validate capability format (alphanumeric with underscores)
            const validCapabilityRegex = /^[a-zA-Z0-9_]+$/;
            for (const capability of value.capabilities) {
                if (typeof capability !== 'string') {
                    errors.push('All capabilities must be strings');
                    break;
                }
                `
        if (!validCapabilityRegex.test(capability)) {`;
                errors.push(`Invalid capability format: ${capability}. Use alphanumeric characters and underscores only);
        }
      }
    }

    // Validate endpoint if provided
    if (value.endpoint) {
      try {
        new URL(value.endpoint);
      } catch (error) {`, errors.push(Invalid, endpoint, URL, $, { value, : .endpoint } `);
      }
    }

    // Validate agent type if provided
    if (value.type) {
      const validTypes = ['ai', 'human', 'system', 'service'];
      if (!validTypes.includes(value.type)) {
        errors.push(Invalid agent type: ${value.type}. Valid types: ${validTypes.join(', ')}`));
            }
        }
        // Validate metadata if provided
        if (value.metadata && typeof value.metadata !== 'object') {
            errors.push('metadata must be an object');
        }
        if (errors.length > 0) {
            this.logger.error(Agent, registration, validation, failed, $, { errors, : .join(', ') });
            throw new common_1.BadRequestException(errors);
        }
        const agentName = value.name || value.agentId;
        `
    this.logger.log(Agent registration validated successfully: ${agentName}`;
        ;
        return value;
    }
    validateAgentDiscovery(value) {
        const errors = [];
        // Validate filter if provided
        if (value.filter && typeof value.filter !== 'object') {
            errors.push('filter must be an object');
        }
        // Validate capabilities filter if provided
        if (value.capabilities) {
            if (!Array.isArray(value.capabilities)) {
                errors.push('capabilities must be an array');
            }
            else {
                // Validate capability format
                const validCapabilityRegex = /^[a-zA-Z0-9_]+$/;
                for (const capability of value.capabilities) {
                    if (typeof capability !== 'string') {
                        errors.push('All capabilities must be strings');
                        break;
                    }
                    if (!validCapabilityRegex.test(capability)) {
                        errors.push(Invalid, capability, format, $, { capability } `);
          }
        }
      }
    }

    // Validate agent type filter if provided
    if (value.agentType) {
      const validTypes = ['ai', 'human', 'system', 'service'];
      if (!validTypes.includes(value.agentType)) {
        errors.push(Invalid agent type filter: ${value.agentType}. Valid types: ${validTypes.join(', ')});
      }
    }

    // Validate limit if provided
    if (value.limit !== undefined) {
      const limit = parseInt(value.limit);
      if (isNaN(limit) || limit < 1 || limit > 100) {
        errors.push('limit must be a number between 1 and 100');
      }
    }
`);
                        if (errors.length > 0) {
                            `
      this.logger.error(Agent discovery validation failed: ${errors.join(', ')}`;
                            ;
                            throw new common_1.BadRequestException(errors);
                        }
                        this.logger.log('Agent discovery request validated successfully');
                        return Promise.resolve(value);
                    }
                }
            }
        }
    }
    isBase64(str) {
        try {
            return btoa(atob(str)) === str;
        }
        catch (err) {
            return false;
        }
    }
};
exports.A2AMessagePipe = A2AMessagePipe;
exports.A2APipe = A2AMessagePipe;
exports.A2APipe = exports.A2AMessagePipe = A2AMessagePipe = A2AMessagePipe_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [A2AService_1.A2AService])
], A2AMessagePipe);
// Additional pipe for validating agent IDs
let A2AAgentIdPipe = A2AAgentIdPipe_1 = class A2AAgentIdPipe {
    a2aService;
    logger = new common_1.Logger(A2AAgentIdPipe_1.name);
    constructor(a2aService) {
        this.a2aService = a2aService;
    }
    async transform(value, metadata) {
        if (metadata.type !== 'param' && metadata.type !== 'body') {
            return value;
        }
        const agentId = metadata.type === 'param' ? value : value?.agentId;
        if (!agentId) {
            throw new common_1.BadRequestException('Agent ID is required');
        }
        try {
            const agent = await this.a2aService.getAgent(agentId);
            if (!agent) {
                throw new common_1.BadRequestException(Agent, not, found, $, { agentId });
            }
            `
`;
            this.logger.log(Agent, ID, validated, $, { agentId } `);
      
      // Return the full agent object if it's a body parameter, otherwise return the ID
      return metadata.type === 'body' ? { ...value, agent: agent } : agent;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage = getErrorMessage(error);
      throw new BadRequestException(Error validating agent ID: ${errorMessage}`);
        }
        finally {
        }
    }
};
exports.A2AAgentIdPipe = A2AAgentIdPipe;
exports.A2AAgentIdPipe = A2AAgentIdPipe = A2AAgentIdPipe_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [A2AService_1.A2AService])
], A2AAgentIdPipe);
//# sourceMappingURL=A2APipe.js.map