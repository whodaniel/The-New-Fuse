var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AgentProcessor_1;
import { Injectable, Logger } from '@nestjs/common';
let AgentProcessor = AgentProcessor_1 = class AgentProcessor {
    logger = new Logger(AgentProcessor_1.name);
    async processAgent(agent) {
        try {
            this.logger.log('Processing agent', { agentId: agent.config.id });
            // Validate agent configuration
            if (!this.validateAgentConfig(agent.config)) {
                return {
                    success: false,
                    message: 'Invalid agent configuration'
                };
            }
            // Process agent tasks
            const result = await this.executeAgentTasks(agent);
            // Update agent state
            await this.updateAgentStatus(agent.config.id, 'busy');
            return {
                success: true,
                message: 'Agent processed successfully',
                result
            };
        }
        catch (error) {
            this.logger.error('Failed to process agent', { error, agentId: agent.config.id });
            await this.updateAgentStatus(agent.config.id, 'error');
            return {
                success: false,
                message: 'Agent processing failed'
            };
        }
    }
    async updateAgentStatus(id, status) {
        try {
            this.logger.log('Updating agent status', { agentId: id, status });
            // Implementation for updating agent status
            // This would typically involve database operations
        }
        catch (error) {
            this.logger.error('Failed to update agent status', { error, agentId: id, status });
            throw error;
        }
    }
    validateAgentConfig(config) {
        return !!(config.id && config.name && config.type && config.llmConfig);
    }
    async executeAgentTasks(agent) {
        // Implementation for executing agent tasks
        this.logger.log('Executing agent tasks', { agentId: agent.config.id });
        // Process pending tasks
        const results = [];
        for (const task of agent.tasks) {
            if (task.status === 'pending') {
                // Execute task logic here
                results.push({ taskId: task.id, status: 'completed' });
            }
        }
        return results;
    }
};
AgentProcessor = AgentProcessor_1 = __decorate([
    Injectable()
], AgentProcessor);
export { AgentProcessor };
