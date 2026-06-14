import { z } from 'zod';
export interface AgentTool {
    name: string;
    description: string;
    schema: z.ZodSchema;
    execute(params: any): Promise<any>;
}
export declare const queryAgentStateTool: AgentTool;
export declare const scheduleTaskTool: AgentTool;
export declare const updateCapabilitiesTool: AgentTool;
export declare const cloudflareAgentTools: AgentTool[];
//# sourceMappingURL=tools.d.ts.map