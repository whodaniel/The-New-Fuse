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

export function parseMCPMessage(data: unknown): MCPMessage {
  // Implementation would go here
  return data as MCPMessage;
}

export function createMCPResponse(id: string, result: unknown): MCPMessage {
  return {
    id,
    type: 'response',
    data: result,
    timestamp: new Date()
  };
}

export function createMCPError(id: string, error: MCPError): MCPMessage {
  return {
    id,
    type: 'error',
    data: error,
    timestamp: new Date()
  };
}
