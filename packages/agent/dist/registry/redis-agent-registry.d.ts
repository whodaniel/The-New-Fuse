/**
 * Redis Agent Registry
 *
 * Implements capability-based discovery and dual-registration logic
 * Stores agent metadata in Redis with TTL for presence
 */
import { z } from 'zod';
declare const AgentStatusSchema: z.ZodEnum<{
    error: "error";
    offline: "offline";
    online: "online";
    busy: "busy";
}>;
export type AgentStatus = z.infer<typeof AgentStatusSchema>;
declare const CapabilitySchema: z.ZodObject<{
    name: z.ZodString;
    version: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type Capability = z.infer<typeof CapabilitySchema>;
export declare const AgentMetadata: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    platform: z.ZodOptional<z.ZodString>;
    capabilities: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    status: z.ZodOptional<z.ZodEnum<{
        error: "error";
        offline: "offline";
        online: "online";
        busy: "busy";
    }>>;
    gatewayId: z.ZodOptional<z.ZodString>;
    lastSeen: z.ZodNumber;
    healthScore: z.ZodOptional<z.ZodNumber>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export type AgentMetadata = z.infer<typeof AgentMetadata>;
export interface AgentRegistryConfig {
    redisUrl: string;
    prefix: string;
    ttl: number;
}
export declare class RedisAgentRegistry {
    private redis;
    private upstash;
    private config;
    constructor(config?: Partial<AgentRegistryConfig>);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    /**
     * Register agent with capabilities
     * Also serves as a heartbeat
     */
    register(metadata: Omit<AgentMetadata, 'lastSeen'>): Promise<void>;
    /**
     * Update heartbeat (refresh TTL and lastSeen)
     */
    updateHeartbeat(agentId: string): Promise<void>;
    /**
     * Unregister agent (explicit offline)
     */
    unregister(agentId: string): Promise<void>;
    /**
     * Get agent details
     */
    getAgent(agentId: string): Promise<AgentMetadata | null>;
    private parseAgentData;
    /**
     * Find agents by capability
     */
    findAgentsByCapability(capability: string): Promise<AgentMetadata[]>;
    /**
     * List all online agents using SCAN to avoid blocking Redis
     */
    listAgents(): Promise<AgentMetadata[]>;
    /**
     * Get agents with a health score above a certain threshold
     */
    getHealthyAgents(minScore?: number): Promise<AgentMetadata[]>;
}
export {};
//# sourceMappingURL=redis-agent-registry.d.ts.map