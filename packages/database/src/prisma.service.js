var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma';
let PrismaService = class PrismaService extends PrismaClient {
    async onModuleInit() {
        await this.$connect();
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
    async enableShutdownHooks(app) {
        // Use process.on instead of deprecated $on('beforeExit')
        process.on('beforeExit', async () => {
            await app.close();
        });
    }
    // Explicitly expose model access properties for better IDE support and type safety
    // Based on the actual models available in the current Prisma client
    get task() {
        return super.task;
    }
    get agent() {
        return super.agent;
    }
    get user() {
        return super.user;
    }
    get message() {
        return super.message;
    }
    get workflow() {
        return super.workflow;
    }
    get workflowExecution() {
        return super.workflowExecution;
    }
    get registeredEntity() {
        return super.registeredEntity;
    }
    // Expose the PrismaClient instance for security package compatibility
    // This allows access via this.prisma.user while maintaining existing getter methods
    get prisma() {
        return this;
    }
};
PrismaService = __decorate([
    Injectable()
], PrismaService);
export { PrismaService };
//# sourceMappingURL=prisma.service.js.map