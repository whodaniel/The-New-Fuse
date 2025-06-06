/**
 * Model Context Protocol (MCP) types
 */

/**
 * Base MCP message structure
 */
export interface MCPMessage {
  id: string;
  type: 'request' | 'response' | 'notification';
  method?: string;
  params?: Record<string, unknown>;
  result?: unknown;
  error?: MCPError;
}

/**
 * MCP error structure
 */
export interface MCPError {
  code: number;
  message: string;
  data?: unknown;
}

/**
 * MCP tool definition
 */
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

/**
 * MCP resource definition
 */
export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

/**
 * Registered entity in the MCP registry
 */
export interface RegisteredEntity {
  id: string;
  name: string;
  type: string;
  description?: string;
  metadata?: Record<string, unknown>;
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for creating an entity
 */
export interface CreateEntityDto {
  name: string;
  type: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * DTO for updating an entity
 */
export interface UpdateEntityDto {
  name?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  status?: 'active' | 'inactive' | 'pending';
}

/**
 * Parse an MCP message from string
 */
export function parseMCPMessage(data: string): MCPMessage {
  try {
    return JSON.parse(data) as MCPMessage;
  } catch (error) {
    throw new Error(`Invalid MCP message: ${error}`);
  }
}

/**
 * Create an MCP response message
 */
export function createMCPResponse(id: string, result: unknown): MCPMessage {
  return {
    id,
    type: 'response',
    result
  };
}

/**
 * Create an MCP error message
 */
export function createMCPError(id: string, code: number, message: string, data?: unknown): MCPMessage {
  return {
    id,
    type: 'response',
    error: {
      code,
      message,
      data
    }
  };
}
