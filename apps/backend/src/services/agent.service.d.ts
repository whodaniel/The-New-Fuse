import { PrismaService } from '../prisma/prisma.service.js';
export declare class AgentService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createAgent(data: any, userId: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        userId: string;
        type: string;
        description: string | null;
        status: import("@prisma/client").$Enums.AgentStatus;
        systemPrompt: string | null;
        capabilities: string[];
        config: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    getAgents(userId: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        userId: string;
        type: string;
        description: string | null;
        status: import("@prisma/client").$Enums.AgentStatus;
        systemPrompt: string | null;
        capabilities: string[];
        config: import("@prisma/client/runtime/library").JsonValue | null;
    }[]>;
    getAgentById(id: string, userId: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        userId: string;
        type: string;
        description: string | null;
        status: import("@prisma/client").$Enums.AgentStatus;
        systemPrompt: string | null;
        capabilities: string[];
        config: import("@prisma/client/runtime/library").JsonValue | null;
    } | null>;
    updateAgentStatus(id: string, status: string, userId: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        userId: string;
        type: string;
        description: string | null;
        status: import("@prisma/client").$Enums.AgentStatus;
        systemPrompt: string | null;
        capabilities: string[];
        config: import("@prisma/client/runtime/library").JsonValue | null;
    } | null>;
}
