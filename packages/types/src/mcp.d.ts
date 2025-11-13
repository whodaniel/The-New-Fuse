export interface MCPMessage {
    id: string;
    type: string;
    data: unknown;
    timestamp: Date;
}
export interface MCPError {
    code: number;
    message: string;
    data?: unknown;
}
export interface MCPTool {
    name: string;
    description: string;
    parameters: unknown;
    execute?: (params: any) => Promise<any>;
}
export interface MCPResource {
    uri: string;
    name: string;
    description?: string;
    mimeType?: string;
}
export interface RegisteredEntity {
    id: string;
    name: string;
    type: string;
    metadata: unknown;
    createdAt: Date;
}
export interface CreateEntityDto {
    name: string;
    type: string;
    metadata?: unknown;
}
export interface UpdateEntityDto {
    name?: string;
    type?: string;
    metadata?: unknown;
}
export declare function parseMCPMessage(data: unknown): MCPMessage;
export declare function createMCPResponse(id: string, result: unknown): MCPMessage;
export declare function createMCPError(id: string, error: MCPError): MCPMessage;
//# sourceMappingURL=mcp.d.ts.map