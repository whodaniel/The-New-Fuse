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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComposerService = void 0;
const common_1 = require("@nestjs/common");
const RedisService_1 = require("./RedisService");
const agent_service_1 = require("./agent.service");
let ComposerService = class ComposerService {
    redisService;
    agentService;
    constructor(redisService, agentService) {
        this.redisService = redisService;
        this.agentService = agentService;
    }
    async onModuleInit() {
        // Subscribe to agent messages using the public method instead of directly accessing subClient
        await this.redisService.subscribeToChannel('agent:messages', async (message) => {
            try {
                const data = JSON.parse(message);
                // Process the agent message
                console.log('Received agent message:', data);
                // Handle different message types
                if (data.type === 'status_update') {
                    await this.handleStatusUpdate(data);
                }
                else if (data.type === 'communication') {
                    await this.handleCommunication(data);
                }
            }
            catch (error) {
                console.error('Error processing agent message:', error);
            }
        });
    }
    async handleStatusUpdate(data) {
        const { agentId, status, userId } = data;
        try {
            // Update the agent status
            await this.agentService.updateAgentStatus(agentId, status, userId);
            console.log(`Updated agent ${agentId} status to ${status}`);
        }
        catch (error) {
            console.error('Error updating agent status:', error);
        }
    }
    async handleCommunication(data) {
        const { fromAgentId, toAgentId, content, userId } = data;
        try {
            // Validate both agents exist and belong to the user
            const [fromAgent, toAgent] = await Promise.all([
                this.agentService.getAgentById(fromAgentId, userId),
                this.agentService.getAgentById(toAgentId, userId)
            ]);
            if (!fromAgent || !toAgent) {
                console.error('One or both agents not found or not authorized');
                return;
            }
            // Process the communication between agents
            console.log(`Communication from ${fromAgent.name} to ${toAgent.name}: ${content}`);
            // Forward the message to the target agent's channel
            await this.redisService.publish(`agent:${toAgentId}`, JSON.stringify({
                type: 'message',
                fromAgentId,
                fromAgentName: fromAgent.name,
                content,
                timestamp: new Date().toISOString()
            }));
        }
        catch (error) {
            console.error('Error handling agent communication:', error);
        }
    }
};
exports.ComposerService = ComposerService;
exports.ComposerService = ComposerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [RedisService_1.RedisService,
        agent_service_1.AgentService])
], ComposerService);
//# sourceMappingURL=composer.service.js.map