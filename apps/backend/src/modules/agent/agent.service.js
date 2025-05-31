var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
import { Injectable, Logger } from '@nestjs/common';
import { AgentStatus } from '@the-new-fuse/types';
let AgentService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AgentService = _classThis = class {
        constructor(prisma) {
            this.prisma = prisma;
            this.logger = new Logger(AgentService.name);
        }
        transformPrismaAgent(agent) {
            return {
                id: agent.id,
                name: agent.name,
                description: agent.description || undefined,
                systemPrompt: agent.systemPrompt || undefined,
                capabilities: agent.capabilities,
                status: agent.status,
                configuration: agent.configuration,
                createdAt: agent.createdAt.toISOString(),
                updatedAt: agent.updatedAt.toISOString()
            };
        }
        async createAgent(data, userId) {
            try {
                // Use transaction to ensure data consistency
                return await this.prisma.$transaction(async (tx) => {
                    // Check for existing agent with same name
                    const existingAgent = await tx.agent.findFirst({
                        where: { name: data.name, deletedAt: null }
                    });
                    if (existingAgent) {
                        throw new Error(`Agent with name "${data.name}" already exists`);
                    }
                    // Create the agent
                    const agent = await tx.agent.create({
                        data: {
                            name: data.name,
                            description: data.description,
                            systemPrompt: data.systemPrompt,
                            capabilities: data.capabilities || [],
                            status: AgentStatus.INACTIVE,
                            configuration: data.configuration,
                            userId
                        }
                    });
                    this.logger.log(`Created agent: ${agent.id} (${agent.name})`);
                    return this.transformPrismaAgent(agent);
                });
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                this.logger.error(`Failed to create agent: ${errorMessage}`);
                throw error;
            }
        }
        async getAgents(userId) {
            try {
                const agents = await this.prisma.agent.findMany({
                    where: { userId, deletedAt: null }
                });
                return agents.map(this.transformPrismaAgent);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                this.logger.error(`Failed to get agents: ${errorMessage}`);
                throw error;
            }
        }
        async getAgentById(id, userId) {
            try {
                const agent = await this.prisma.agent.findFirst({
                    where: { id, userId, deletedAt: null }
                });
                if (!agent) {
                    throw new Error(`Agent with id "${id}" not found`);
                }
                return this.transformPrismaAgent(agent);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                this.logger.error(`Failed to get agent: ${errorMessage}`);
                throw error;
            }
        }
        async updateAgent(id, updates, userId) {
            try {
                return await this.prisma.$transaction(async (tx) => {
                    // Check if agent exists
                    const existingAgent = await tx.agent.findFirst({
                        where: { id, userId, deletedAt: null }
                    });
                    if (!existingAgent) {
                        throw new Error(`Agent with id "${id}" not found`);
                    }
                    // Check name uniqueness if name is being updated
                    if (updates.name) {
                        const nameExists = await tx.agent.findFirst({
                            where: {
                                name: updates.name,
                                id: { not: id },
                                deletedAt: null
                            }
                        });
                        if (nameExists) {
                            throw new Error(`Agent with name "${updates.name}" already exists`);
                        }
                    }
                    // Update the agent
                    const agent = await tx.agent.update({
                        where: { id },
                        data: {
                            ...updates,
                            updatedAt: new Date()
                        }
                    });
                    this.logger.log(`Updated agent: ${id}`);
                    return this.transformPrismaAgent(agent);
                });
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                this.logger.error(`Failed to update agent: ${errorMessage}`);
                throw error;
            }
        }
        async deleteAgent(id, userId) {
            try {
                await this.prisma.agent.update({
                    where: { id },
                    data: { deletedAt: new Date() }
                });
                this.logger.log(`Deleted agent: ${id}`);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                this.logger.error(`Failed to delete agent: ${errorMessage}`);
                throw error;
            }
        }
        async getAgentsByCapability(capability, userId) {
            try {
                const agents = await this.prisma.agent.findMany({
                    where: {
                        userId,
                        deletedAt: null,
                        capabilities: {
                            has: capability
                        }
                    }
                });
                return agents.map(this.transformPrismaAgent);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                this.logger.error(`Failed to get agents by capability: ${errorMessage}`);
                throw error;
            }
        }
        async getActiveAgents(userId) {
            try {
                const agents = await this.prisma.agent.findMany({
                    where: {
                        userId,
                        deletedAt: null,
                        status: AgentStatus.ACTIVE
                    }
                });
                return agents.map(this.transformPrismaAgent);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                this.logger.error(`Failed to get active agents: ${errorMessage}`);
                throw error;
            }
        }
        async updateAgentStatus(id, status, userId) {
            try {
                const agent = await this.prisma.agent.update({
                    where: { id },
                    data: { status }
                });
                this.logger.log(`Updated agent status: ${id} -> ${status}`);
                return this.transformPrismaAgent(agent);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                this.logger.error(`Failed to update agent status: ${errorMessage}`);
                throw error;
            }
        }
    };
    __setFunctionName(_classThis, "AgentService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AgentService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AgentService = _classThis;
})();
export { AgentService };
