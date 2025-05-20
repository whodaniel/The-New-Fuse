import { z } from "zod";
/**
 * Base interface for MCP capability parameters
 */
export interface MCPCapabilityParams {
  description: string;
  parameters: z.ZodSchema;
  execute: (params: unknown, context?: Record<string, any>) => Promise<unknown>;
  permissions?: string[];
}
/**
 * Base interface for MCP tool parameters
 */
export interface MCPToolParams {
  description: string;
  parameters: z.ZodSchema;
  execute: (params: unknown) => Promise<unknown>;
  permissions?: string[];
}
/**
 * Configuration options for MCP Server
 */
export interface MCPServerOptions {
  capabilities?: Record<string, MCPCapabilityParams>;
  tools?: Record<string, MCPToolParams>;
  security?: {
    sandboxing?: {
      enabled: boolean;
      timeout?: number;
      memoryLimit?: string;
    };
    authentication?: {
      type: "JWT" | "API_KEY";
      issuer?: string;
      audience?: string[];
    };
    permissions?: {
      granular: boolean;
      defaultDeny: boolean;
    };
  };
  performance?: {
    caching?: {
      enabled: boolean;
      strategy?: "adaptive" | "fixed";
      ttl?: number;
    };
    streaming?: {
      enabled: boolean;
      chunkSize?: number;
      compression?: boolean;
    };
    loadBalancing?: {
      strategy?: "least-connections" | "round-robin";
      healthCheck?: boolean;
    };
  };
}
/**
 * Base MCP Server class that implements the Model-Controller-Provider protocol
 * This serves as the foundation for all MCP servers in the system
 */
export declare class MCPServer {
  protected readonly logger: unknown;
  protected capabilities: Record<string, MCPCapabilityParams>;
  protected tools: Record<string, MCPToolParams>;
  protected options: MCPServerOptions;
  constructor(options?: MCPServerOptions);
  /**
   * Register a new capability to the server
   */
  registerCapability(name: string, capability: MCPCapabilityParams): void;
  /**
   * Register a new tool to the server
   */
  registerTool(name: string, tool: MCPToolParams): void;
  /**
   * Execute a capability by name
   */
  executeCapability(name: string, params: unknown): Promise<unknown>;
  /**
   * Execute a tool by name
   */
  executeTool(name: string, params: unknown): Promise<unknown>;
  /**
   * Get all registered capabilities
   */
  getCapabilities(): Record<string, Omit<MCPCapabilityParams, "execute">>;
  /**
   * Get all registered tools
   */
  getTools(): Record<string, Omit<MCPToolParams, "execute">>;
  protected initializeSecurity(): Promise<void>;
  protected discoverCapability(
    type: string,
    id: string,
  ): Promise<MCPCapabilityParams>;
  protected executeInSandbox(
    nodeDef: MCPCapabilityParams,
    inputs: unknown,
    context: Record<string, any>,
  ): Promise<unknown>;
}
