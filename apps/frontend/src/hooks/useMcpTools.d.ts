import { MCPServer, MCPTool } from '@/services/MCPService';
export declare const useMcpTools: () => {
    servers: MCPServer[];
    tools: MCPTool[];
    loading: boolean;
    error: Error | null;
    loadServers: () => Promise<void>;
    executeTool: (toolId: string, parameters: Record<string, any>) => Promise<any>;
};
export default useMcpTools;
export type { MCPServer, MCPTool };
