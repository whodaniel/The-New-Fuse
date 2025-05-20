import { Injectable } from '@nestjs/common';
import { BaseService } from '../core/BaseService.js';
import { PrismaService } from '../../lib/prisma/prisma.service.js';
import { Agent, CreateAgentDto, UpdateAgentDto, AgentStatus } from '@the-new-fuse/types';
import { AgentFactory } from './AgentFactory.js';
import { RedisService } from '../redis/redis.service.js';

@Injectable()
export class AgentService extends BaseService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly agentFactory: AgentFactory,
        private readonly redis: RedisService
    ) {
        super('AgentService');
    }

    async initialize(): Promise<void> {
        await this.redis.connect();
        this.redis.subscribe('agent:events', async (message) => {
            const event = JSON.parse(message);
            await this.handleAgentEvent(event);
        });
    }

    async createAgent(data: CreateAgentDto, userId: string): Promise<Agent> {
        try {
            const agent = await this.prisma.$transaction(async (tx) => {
                const existingAgent = await tx.agent.findFirst({
                    where: { name: data.name, userId, deletedAt: null }
                });

                if (existingAgent) {
                    throw new Error(`Agent with name "${data.name}" already exists`);
                }

                const newAgent = await tx.agent.create({
                    data: {
                        ...data,
                        userId,
                        status: AgentStatus.INITIALIZING
                    }
                });

                const instance = await this.agentFactory.createAgent(
                    data.type,
                    newAgent.id,
                    data.configuration
                );

                return tx.agent.update({
                    where: { id: newAgent.id },
                    data: { instanceId: instance.id, status: AgentStatus.ACTIVE }
                });
            });

            this.emit('agent:created', { agent });
            return agent;
        } catch (error) {
            this.logger.error('Failed to create agent:', error);
            throw error;
        }
    }

    async updateAgent(id: string, updates: UpdateAgentDto, userId: string): Promise<Agent> {
        const agent = await this.prisma.agent.findFirst({
            where: { id, userId, deletedAt: null }
        });

        if (!agent) {
            throw new Error('Agent not found');
        }

        const updatedAgent = await this.prisma.$transaction(async (tx) => {
            if (updates.configuration) {
                await this.agentFactory.updateAgent(
                    agent.instanceId,
                    updates.configuration
                );
            }

            return tx.agent.update({
                where: { id },
                data: updates
            });
        });

        this.emit('agent:updated', { agent: updatedAgent });
        return updatedAgent;
    }

    async deleteAgent(id: string, userId: string): Promise<void> {
        const agent = await this.prisma.agent.findFirst({
            where: { id, userId, deletedAt: null }
        });

        if (!agent) {
            throw new Error('Agent not found');
        }

        await this.prisma.$transaction(async (tx) => {
            await this.agentFactory.destroyAgent(agent.instanceId);
            await tx.agent.update({
                where: { id },
                data: { deletedAt: new Date(), status: AgentStatus.DELETED }
            });
        });

        this.emit('agent:deleted', { agentId: id });
    }

    private async handleAgentEvent(event: unknown): Promise<void> {
        switch (event.type) {
            case 'status_change':
                await this.handleStatusChange(event.agentId, event.status);
                break;
            case 'error':
                await this.handleAgentError(event.agentId, event.error);
                break;
            default:
                this.logger.warn(`Unknown agent event type: ${event.type}`);
        }
    }

    private async handleStatusChange(agentId: string, status: AgentStatus): Promise<void> {
        await this.prisma.agent.update({
            where: { id: agentId },
            data: { status }
        });
        this.emit('agent:status_changed', { agentId, status });
    }

    private async handleAgentError(agentId: string, error: unknown): Promise<void> {
        this.logger.error(`Agent ${agentId} error:`, error);
        this.emit('agent:error', { agentId, error });
    }
}