
export interface MCPTool {
    name: string;
    description: string;
    parameters: Record<string, MCPToolParameter>;
    execute: (parameters: any, context: MCPToolContext) => Promise<any>;
}

export interface MCPToolParameter {
    type: string;
    required: boolean;
}

export interface MCPToolContext {
    tabId: number;
}
