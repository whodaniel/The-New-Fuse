/**
 * Comprehensive MCP API Wrapper for The New Fuse Platform
 * Wraps ALL API endpoints as MCP tools and resources
 * 
 * This server exposes every API endpoint through MCP, enabling:
 * - External MCP clients to interact with the platform programmatically
 * - AI agents to access platform functionality via MCP
 * - Complete platform automation through MCP protocol
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  Tool,
  Resource,
  TextContent,
} from '@modelcontextprotocol/sdk/types.js';

// Types for API operations
interface ApiRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  data?: any;
  params?: Record<string, string>;
  query?: Record<string, string>;
  headers?: Record<string, string>;
}

interface AuthContext {
  token?: string;
  apiKey?: string;
  userId?: string;
}

class TheNewFuseApiWrapper {
  private server: Server;
  private baseUrl: string;
  private authContext: AuthContext = {};

  constructor() {
    this.server = new Server(
      {
        name: 'the-new-fuse-api-wrapper',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.baseUrl = process.env.TNF_API_BASE_URL || 'http://localhost:8080/v1';
    this.setupHandlers();
  }

  private setupHandlers() {
    // List all available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // Authentication Tools
          ...this.getAuthenticationTools(),
          
          // Agent Management Tools
          ...this.getAgentManagementTools(),
          
          // Chat & Communication Tools
          ...this.getChatTools(),
          
          // Webhook Management Tools
          ...this.getWebhookTools(),
          
          // MCP Server Management Tools
          ...this.getMcpManagementTools(),
          
          // Workflow Management Tools
          ...this.getWorkflowTools(),
          
          // User Management Tools
          ...this.getUserManagementTools(),
          
          // Marketplace Tools
          ...this.getMarketplaceTools(),
          
          // Agency Hub Tools
          ...this.getAgencyHubTools(),
          
          // Admin & Monitoring Tools
          ...this.getAdminTools(),
          
          // Integration Tools
          ...this.getIntegrationTools(),
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        // Route tool calls to appropriate handlers
        if (name.startsWith('auth_')) {
          return await this.handleAuthTool(name, args);
        } else if (name.startsWith('agent_')) {
          return await this.handleAgentTool(name, args);
        } else if (name.startsWith('chat_')) {
          return await this.handleChatTool(name, args);
        } else if (name.startsWith('webhook_')) {
          return await this.handleWebhookTool(name, args);
        } else if (name.startsWith('mcp_')) {
          return await this.handleMcpTool(name, args);
        } else if (name.startsWith('workflow_')) {
          return await this.handleWorkflowTool(name, args);
        } else if (name.startsWith('user_')) {
          return await this.handleUserTool(name, args);
        } else if (name.startsWith('marketplace_')) {
          return await this.handleMarketplaceTool(name, args);
        } else if (name.startsWith('agency_')) {
          return await this.handleAgencyTool(name, args);
        } else if (name.startsWith('admin_')) {
          return await this.handleAdminTool(name, args);
        } else if (name.startsWith('integration_')) {
          return await this.handleIntegrationTool(name, args);
        }
        
        throw new Error(`Unknown tool: ${name}`);
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing tool ${name}: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'the-new-fuse://api/schema',
            name: 'API Schema',
            description: 'Complete OpenAPI schema for The New Fuse platform',
            mimeType: 'application/json',
          },
          {
            uri: 'the-new-fuse://api/endpoints',
            name: 'API Endpoints',
            description: 'Complete list of all available API endpoints',
            mimeType: 'application/json',
          },
          {
            uri: 'the-new-fuse://platform/status',
            name: 'Platform Status',
            description: 'Real-time platform health and service status',
            mimeType: 'application/json',
          },
          {
            uri: 'the-new-fuse://auth/context',
            name: 'Authentication Context',
            description: 'Current authentication context and permissions',
            mimeType: 'application/json',
          },
        ],
      };
    });

    // Handle resource reads
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      
      switch (uri) {
        case 'the-new-fuse://api/schema':
          return await this.getApiSchema();
        case 'the-new-fuse://api/endpoints':
          return await this.getApiEndpoints();
        case 'the-new-fuse://platform/status':
          return await this.getPlatformStatus();
        case 'the-new-fuse://auth/context':
          return await this.getAuthContext();
        default:
          throw new Error(`Unknown resource: ${uri}`);
      }
    });
  }

  // ========== AUTHENTICATION TOOLS ==========
  private getAuthenticationTools(): Tool[] {
    return [
      {
        name: 'auth_login',
        description: 'Login with email and password',
        inputSchema: {
          type: 'object',
          properties: {
            email: { type: 'string', description: 'User email address' },
            password: { type: 'string', description: 'User password' },
          },
          required: ['email', 'password'],
        },
      },
      {
        name: 'auth_register',
        description: 'Register a new user account',
        inputSchema: {
          type: 'object',
          properties: {
            email: { type: 'string', description: 'User email address' },
            password: { type: 'string', description: 'User password' },
            name: { type: 'string', description: 'User full name' },
          },
          required: ['email', 'password', 'name'],
        },
      },
      {
        name: 'auth_refresh',
        description: 'Refresh authentication token',
        inputSchema: {
          type: 'object',
          properties: {
            refreshToken: { type: 'string', description: 'Refresh token' },
          },
          required: ['refreshToken'],
        },
      },
      {
        name: 'auth_logout',
        description: 'Logout current user',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'auth_set_token',
        description: 'Set authentication token for subsequent requests',
        inputSchema: {
          type: 'object',
          properties: {
            token: { type: 'string', description: 'JWT authentication token' },
            apiKey: { type: 'string', description: 'API key (optional)' },
          },
          required: ['token'],
        },
      },
    ];
  }

  // ========== AGENT MANAGEMENT TOOLS ==========
  private getAgentManagementTools(): Tool[] {
    return [
      {
        name: 'agent_list',
        description: 'Get all agents with optional filtering',
        inputSchema: {
          type: 'object',
          properties: {
            capability: { type: 'string', description: 'Filter by capability' },
            status: { type: 'string', description: 'Filter by status' },
            type: { type: 'string', description: 'Filter by agent type' },
            name: { type: 'string', description: 'Filter by name' },
          },
        },
      },
      {
        name: 'agent_create',
        description: 'Create a new AI agent',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Agent name' },
            type: { type: 'string', description: 'Agent type' },
            capabilities: { type: 'array', items: { type: 'string' }, description: 'Agent capabilities' },
            config: { type: 'object', description: 'Agent configuration' },
            description: { type: 'string', description: 'Agent description' },
          },
          required: ['name', 'type'],
        },
      },
      {
        name: 'agent_get',
        description: 'Get agent details by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Agent ID' },
          },
          required: ['id'],
        },
      },
      {
        name: 'agent_update',
        description: 'Update an existing agent',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Agent ID' },
            name: { type: 'string', description: 'Agent name' },
            capabilities: { type: 'array', items: { type: 'string' }, description: 'Agent capabilities' },
            config: { type: 'object', description: 'Agent configuration' },
            description: { type: 'string', description: 'Agent description' },
          },
          required: ['id'],
        },
      },
      {
        name: 'agent_update_status',
        description: 'Update agent status',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Agent ID' },
            status: { type: 'string', enum: ['active', 'inactive', 'suspended'], description: 'New status' },
          },
          required: ['id', 'status'],
        },
      },
      {
        name: 'agent_delete',
        description: 'Delete an agent',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Agent ID' },
          },
          required: ['id'],
        },
      },
      {
        name: 'agent_list_active',
        description: 'Get all active agents',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ];
  }

  // ========== CHAT & COMMUNICATION TOOLS ==========
  private getChatTools(): Tool[] {
    return [
      {
        name: 'chat_sessions_list',
        description: 'Get all chat sessions',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'chat_session_create',
        description: 'Create a new chat session',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Session title' },
            agentId: { type: 'string', description: 'Agent ID for the session' },
            context: { type: 'object', description: 'Session context' },
          },
        },
      },
      {
        name: 'chat_messages_get',
        description: 'Get messages from a chat session',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string', description: 'Chat session ID' },
            limit: { type: 'number', description: 'Number of messages to retrieve' },
            offset: { type: 'number', description: 'Offset for pagination' },
          },
          required: ['sessionId'],
        },
      },
      {
        name: 'chat_message_send',
        description: 'Send a message to a chat session',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string', description: 'Chat session ID' },
            message: { type: 'string', description: 'Message content' },
            type: { type: 'string', enum: ['user', 'system', 'agent'], description: 'Message type' },
            metadata: { type: 'object', description: 'Message metadata' },
          },
          required: ['sessionId', 'message'],
        },
      },
      {
        name: 'chat_history_get',
        description: 'Get chat history with pagination',
        inputSchema: {
          type: 'object',
          properties: {
            page: { type: 'number', description: 'Page number' },
            limit: { type: 'number', description: 'Items per page' },
          },
        },
      },
      {
        name: 'chat_clear',
        description: 'Clear chat history',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string', description: 'Session ID to clear (optional, clears all if not provided)' },
          },
        },
      },
    ];
  }

  // ========== WEBHOOK MANAGEMENT TOOLS ==========
  private getWebhookTools(): Tool[] {
    return [
      {
        name: 'webhook_register',
        description: 'Register a new webhook configuration',
        inputSchema: {
          type: 'object',
          properties: {
            source: { type: 'string', enum: ['stripe', 'paypal', 'salesforce', 'hubspot', 'pipedrive'], description: 'Integration source' },
            endpointUrl: { type: 'string', description: 'Webhook endpoint URL' },
            secretKey: { type: 'string', description: 'Secret key for signature validation' },
            configuration: { type: 'object', description: 'Platform-specific configuration' },
          },
          required: ['source', 'endpointUrl', 'secretKey'],
        },
      },
      {
        name: 'webhook_status_get',
        description: 'Get webhook configuration status',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Webhook configuration ID' },
          },
          required: ['id'],
        },
      },
      {
        name: 'webhook_events_history',
        description: 'Get event history for organization',
        inputSchema: {
          type: 'object',
          properties: {
            startDate: { type: 'string', description: 'Start date (ISO 8601)' },
            endDate: { type: 'string', description: 'End date (ISO 8601)' },
            eventTypes: { type: 'string', description: 'Comma-separated event types' },
            limit: { type: 'number', description: 'Maximum events to return' },
          },
          required: ['startDate', 'endDate'],
        },
      },
      {
        name: 'webhook_event_retry',
        description: 'Retry failed event processing',
        inputSchema: {
          type: 'object',
          properties: {
            eventId: { type: 'string', description: 'Event ID to retry' },
          },
          required: ['eventId'],
        },
      },
      {
        name: 'webhook_incoming_handle',
        description: 'Handle incoming webhook (for testing purposes)',
        inputSchema: {
          type: 'object',
          properties: {
            source: { type: 'string', description: 'Integration source platform' },
            payload: { type: 'object', description: 'Webhook payload' },
            headers: { type: 'object', description: 'Webhook headers' },
          },
          required: ['source', 'payload'],
        },
      },
    ];
  }

  // ========== MCP SERVER MANAGEMENT TOOLS ==========
  private getMcpManagementTools(): Tool[] {
    return [
      {
        name: 'mcp_servers_list',
        description: 'Get all MCP server configurations',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'mcp_server_register',
        description: 'Register a new MCP server',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Server name' },
            command: { type: 'string', description: 'Server command' },
            args: { type: 'array', items: { type: 'string' }, description: 'Command arguments' },
            env: { type: 'object', description: 'Environment variables' },
            description: { type: 'string', description: 'Server description' },
          },
          required: ['name', 'command'],
        },
      },
      {
        name: 'mcp_server_status',
        description: 'Get MCP server status',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Server ID' },
          },
          required: ['id'],
        },
      },
      {
        name: 'mcp_server_update',
        description: 'Update MCP server configuration',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Server ID' },
            name: { type: 'string', description: 'Server name' },
            command: { type: 'string', description: 'Server command' },
            args: { type: 'array', items: { type: 'string' }, description: 'Command arguments' },
            env: { type: 'object', description: 'Environment variables' },
            description: { type: 'string', description: 'Server description' },
          },
          required: ['id'],
        },
      },
      {
        name: 'mcp_server_remove',
        description: 'Remove MCP server configuration',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Server ID' },
          },
          required: ['id'],
        },
      },
      {
        name: 'mcp_oauth_discovery',
        description: 'Get MCP OAuth Authorization Server discovery metadata',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ];
  }

  // Continue with remaining tool definitions...
  // (Due to length constraints, I'll create additional files for the remaining tools)

  private async makeApiRequest(request: ApiRequest): Promise<any> {
    const url = new URL(request.endpoint, this.baseUrl);
    
    // Add query parameters
    if (request.query) {
      Object.entries(request.query).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'User-Agent': 'TNF-MCP-Wrapper/1.0.0',
      ...request.headers,
    };

    // Add authentication
    if (this.authContext.token) {
      headers['Authorization'] = `Bearer ${this.authContext.token}`;
    }
    if (this.authContext.apiKey) {
      headers['X-API-Key'] = this.authContext.apiKey;
    }

    // Make request
    const response = await fetch(url.toString(), {
      method: request.method,
      headers,
      body: request.data ? JSON.stringify(request.data) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  // ========== TOOL HANDLERS ==========
  
  private async handleAuthTool(toolName: string, args: any) {
    switch (toolName) {
      case 'auth_login':
        const loginResult = await this.makeApiRequest({
          method: 'POST',
          endpoint: '/auth/login',
          data: { email: args.email, password: args.password },
        });
        
        // Store token for subsequent requests
        if (loginResult.token) {
          this.authContext.token = loginResult.token;
          this.authContext.userId = loginResult.user?.id;
        }
        
        return {
          content: [{
            type: 'text' as const,
            text: `Login successful. Token stored for subsequent requests. User: ${loginResult.user?.email}`,
          }],
        };

      case 'auth_register':
        const registerResult = await this.makeApiRequest({
          method: 'POST',
          endpoint: '/auth/register',
          data: { email: args.email, password: args.password, name: args.name },
        });
        
        return {
          content: [{
            type: 'text' as const,
            text: `Registration successful. User created: ${registerResult.user?.email}`,
          }],
        };

      case 'auth_refresh':
        const refreshResult = await this.makeApiRequest({
          method: 'POST',
          endpoint: '/auth/refresh',
          data: { refreshToken: args.refreshToken },
        });
        
        if (refreshResult.token) {
          this.authContext.token = refreshResult.token;
        }
        
        return {
          content: [{
            type: 'text' as const,
            text: 'Token refreshed successfully.',
          }],
        };

      case 'auth_logout':
        await this.makeApiRequest({
          method: 'POST',
          endpoint: '/auth/logout',
        });
        
        // Clear auth context
        this.authContext = {};
        
        return {
          content: [{
            type: 'text' as const,
            text: 'Logout successful. Authentication context cleared.',
          }],
        };

      case 'auth_set_token':
        this.authContext.token = args.token;
        if (args.apiKey) {
          this.authContext.apiKey = args.apiKey;
        }
        
        return {
          content: [{
            type: 'text' as const,
            text: 'Authentication token set successfully.',
          }],
        };

      default:
        throw new Error(`Unknown auth tool: ${toolName}`);
    }
  }

  private async handleAgentTool(toolName: string, args: any) {
    switch (toolName) {
      case 'agent_list':
        const agents = await this.makeApiRequest({
          method: 'GET',
          endpoint: '/agents',
          query: args,
        });
        
        return {
          content: [{
            type: 'text' as const,
            text: `Found ${agents.data?.length || 0} agents:\n${JSON.stringify(agents, null, 2)}`,
          }],
        };

      case 'agent_create':
        const newAgent = await this.makeApiRequest({
          method: 'POST',
          endpoint: '/agents',
          data: args,
        });
        
        return {
          content: [{
            type: 'text' as const,
            text: `Agent created successfully:\n${JSON.stringify(newAgent, null, 2)}`,
          }],
        };

      case 'agent_get':
        const agent = await this.makeApiRequest({
          method: 'GET',
          endpoint: `/agents/${args.id}`,
        });
        
        return {
          content: [{
            type: 'text' as const,
            text: `Agent details:\n${JSON.stringify(agent, null, 2)}`,
          }],
        };

      case 'agent_update':
        const { id, ...updateData } = args;
        const updatedAgent = await this.makeApiRequest({
          method: 'PUT',
          endpoint: `/agents/${id}`,
          data: updateData,
        });
        
        return {
          content: [{
            type: 'text' as const,
            text: `Agent updated successfully:\n${JSON.stringify(updatedAgent, null, 2)}`,
          }],
        };

      case 'agent_update_status':
        const statusResult = await this.makeApiRequest({
          method: 'PUT',
          endpoint: `/agents/${args.id}/status`,
          data: { status: args.status },
        });
        
        return {
          content: [{
            type: 'text' as const,
            text: `Agent status updated to ${args.status}:\n${JSON.stringify(statusResult, null, 2)}`,
          }],
        };

      case 'agent_delete':
        await this.makeApiRequest({
          method: 'DELETE',
          endpoint: `/agents/${args.id}`,
        });
        
        return {
          content: [{
            type: 'text' as const,
            text: `Agent ${args.id} deleted successfully.`,
          }],
        };

      case 'agent_list_active':
        const activeAgents = await this.makeApiRequest({
          method: 'GET',
          endpoint: '/agents/active',
        });
        
        return {
          content: [{
            type: 'text' as const,
            text: `Active agents:\n${JSON.stringify(activeAgents, null, 2)}`,
          }],
        };

      default:
        throw new Error(`Unknown agent tool: ${toolName}`);
    }
  }

  // Additional handlers will be implemented in subsequent files...
  // (Continuing in next file due to length constraints)

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('The New Fuse MCP API Wrapper server running on stdio');
  }
}

// Export for use
export { TheNewFuseApiWrapper };

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new TheNewFuseApiWrapper();
  server.run().catch(console.error);
}