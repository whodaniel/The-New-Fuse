import { z } from 'zod';
export declare const ChannelMemorySchema: z.ZodObject<{
    channelId: z.ZodString;
    agentId: z.ZodString;
    context: z.ZodString;
    facts: z.ZodDefault<z.ZodArray<z.ZodObject<{
        content: z.ZodString;
        timestamp: z.ZodNumber;
        source: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    preferences: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    lastUpdated: z.ZodNumber;
}, z.core.$strip>;
export type ChannelMemory = z.infer<typeof ChannelMemorySchema>;
export declare class ChannelMemoryIsolationService {
    private memories;
    private key;
    getMemory(channelId: string, agentId: string): ChannelMemory;
    addFact(channelId: string, agentId: string, content: string, source?: string): void;
    setPreference(channelId: string, agentId: string, key: string, value: unknown): void;
    setContext(channelId: string, agentId: string, context: string): void;
    getIsolatedContext(channelId: string, agentId: string): string;
    clearChannelMemory(channelId: string, agentId?: string): number;
    listChannelsForAgent(agentId: string): string[];
}
//# sourceMappingURL=channelMemoryIsolation.d.ts.map