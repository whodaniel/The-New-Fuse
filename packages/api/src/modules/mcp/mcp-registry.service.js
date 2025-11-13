var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MCPRegistryService_1;
var _a;
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Agent } from '@the-new-fuse/types'; // Import entity types/DTOs
import { firstValueFrom } from 'rxjs';
let MCPRegistryService = MCPRegistryService_1 = class MCPRegistryService {
    httpService;
    logger = new Logger(MCPRegistryService_1.name);
    backendApiUrl;
    apiKey; // Store the API key
    constructor(httpService) {
        this.httpService = httpService;
        // Get configuration from environment variables
        this.backendApiUrl = process.env.API_URL || 'http://localhost:3000/api'; // Default for local dev
        this.apiKey = process.env.MCP_REGISTRY_API_KEY || undefined; // Get API key from config
        if (!this.apiKey) {
            this.logger.error('MCP_REGISTRY_API_KEY is not configured. MCPRegistryService cannot authenticate with the backend API.');
            // Depending on requirements, could throw an error here to prevent startup
        }
        else {
            this.logger.log('MCP Registry API Key loaded.');
        }
    }
    // --- Helper to get Auth Headers ---
    getAuthHeaders() {
        if (!this.apiKey) {
            throw new Error('MCPRegistryService is not configured with an API key.');
        }
        return { 'X-API-Key': this.apiKey };
    }
    // --- MCP Tool Definitions ---
    getTools() {
        return [
            // Agent Tools
            this.registerAgentTool(),
            this.updateAgentProfileTool(),
            this.getAgentProfileTool(),
            this.findAgentsTool(),
            this.updateAgentStatusTool(),
            // Entity Tools
            this.registerEntityTool(),
            this.updateEntityTool(),
            this.getEntityTool(),
            this.findEntitiesTool(),
        ];
    }
    // --- registerAgent Tool Implementation ---
    registerAgentTool() {
        return {
            name: 'registerAgent',
            description: 'Registers a new agent with the central system.',
            parameters: {
                type: 'object',
                properties: {
                    name: { type: 'string', description: "The agent's display name." },
                    type: { type: 'string', description: "The agent's type (e.g., 'developer', 'filesystem')." },
                    metadata: { type: 'object', description: 'Any additional structured data about the agent.', additionalProperties: true },
                },
                required: ['name', 'type'],
            },
            execute: async (params) => {
                return this.registerAgent(params);
            },
        };
    }
    async registerAgent(params) {
        const url = `${this.backendApiUrl}/agents;
    const data: CreateAgentDto = {
      name: params.name,
      type: params.type as any, // Type assertion needed since params.type is string
      metadata: params.metadata,
      // TODO: Add other necessary fields if CreateAgentDto evolves (e.g., initial status, role)
    };
`;
        this.logger.log(`Attempting to register agent '${params.name}`, ' via API: ${url}););
        try {
            const headers = this.getAuthHeaders(); // Get headers with API key
            const response$ = this.httpService.post(url, data, { headers });
            const response = await firstValueFrom(response$);
            `
      this.logger.log(`;
            Successfully;
            registered;
            agent;
            '${params.name}`';
            with (ID)
                : $;
            {
                response.data.id;
            }
            ;
            return response.data;
        }
        catch (error) {
            const axiosError = error;
            const errorDetails = axiosError.response?.data || axiosError.message;
            `
      this.logger.error(Failed to register agent '${params.name}`;
            ': ${JSON.stringify(errorDetails)}, axiosError.stack);`;
            // Re-throw a more specific error or handle as needed for MCP
            throw new Error(Agent, registration, failed, $, { errorDetails });
        }
    }
    // --- updateAgentProfile Tool Implementation ---
    updateAgentProfileTool() {
        return {
            name: 'updateAgentProfile',
            description: 'Updates the profile of an existing agent.',
            parameters: {
                type: 'object',
                properties: {
                    agentId: { type: 'string', description: 'The ID of the agent to update.' },
                    name: { type: 'string', description: 'New name for the agent.' },
                    type: { type: 'string', description: 'New type for the agent.' },
                    metadata: { type: 'object', description: 'New or updated metadata.', additionalProperties: true },
                },
                required: ['agentId'], // Only agentId is strictly required, others are optional updates
            },
            execute: async (params) => {
                return this.updateAgentProfile(params.agentId, { name: params.name, type: params.type, metadata: params.metadata });
            },
        };
    }
    async updateAgentProfile(agentId, updates) {
        `
    const url = ${this.backendApiUrl}` / agents / $;
        {
            agentId;
        }
        ;
        `
    this.logger.log(Attempting to update agent '${agentId}`;
        ' via API: ${url});;
        try {
            const headers = this.getAuthHeaders(); // Get headers with API key
            const response$ = this.httpService.put(url, updates, { headers });
            `
      const response = await firstValueFrom(response$);`;
            this.logger.log(Successfully, updated, agent, '${agentId}`');
            return response.data;
        }
        catch (error) {
            const axiosError = error;
            const errorDetails = axiosError.response?.data || axiosError.message;
            this.logger.error(Failed, to, update, agent, '${agentId}', $, { JSON, : .stringify(errorDetails) }, axiosError.stack);
            `
      throw new Error(Agent update failed: ${errorDetails});
    }
  }

  // --- getAgentProfile Tool Implementation ---

  private getAgentProfileTool(): MCPTool {
    return {
      name: 'getAgentProfile',
      description: 'Retrieves the profile of a specific agent.',
      parameters: {
        type: 'object',
        properties: {
          agentId: { type: 'string', description: 'The ID of the agent to retrieve.' },
        },
        required: ['agentId'],
      },
      execute: async (params: { agentId: string }) => {
        return this.getAgentProfile(params.agentId);
      },
    };
  }

  async getAgentProfile(agentId: string): Promise<Agent> {`;
            const url = $, { this: , backendApiUrl };
            /agents/$;
            {
                agentId;
            }
            `;
    this.logger.log(Attempting to get agent profile '${agentId}' via API: ${url}`;
            ;
            try {
                const headers = this.getAuthHeaders(); // Get headers with API key
                const response$ = this.httpService.get(url, { headers });
                const response = await firstValueFrom(response$);
                this.logger.log(Successfully, retrieved, agent, profile, '${agentId}');
                return response.data;
            }
            catch (error) {
                const axiosError = error;
                const errorDetails = axiosError.response?.data || axiosError.message;
                `
      this.logger.error(Failed to get agent profile '${agentId}': ${JSON.stringify(errorDetails)}, axiosError.stack);`;
                throw new Error(Get, agent, profile, failed, $, { errorDetails } `);
    }
  }

  // --- findAgents Tool Implementation ---

  private findAgentsTool(): MCPTool {
    return {
      name: 'findAgents',
      description: 'Finds agents based on specified criteria.',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: Object.values(AgentStatus), description: 'Filter by agent status.' },
          capability: { type: 'string', description: 'Filter by capability name.' },
          name: { type: 'string', description: 'Filter by agent name (exact match).' },
          role: { type: 'string', description: 'Filter by agent role.' }, // Assuming AgentRole is string-based enum or similar
          type: { type: 'string', description: 'Filter by agent type.' },
        },
        // No required parameters, all are optional filters
      },
      execute: async (params: { status?: AgentStatus; capability?: string; name?: string; role?: string; type?: string }) => {
        return this.findAgents(params);
      },
    };
  }

  async findAgents(
    filters: { status?: AgentStatus; capability?: string; name?: string; role?: string; type?: string }
  ): Promise<Agent[]> {
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.capability) queryParams.append('capability', filters.capability);
    if (filters.name) queryParams.append('name', filters.name);
    if (filters.role) queryParams.append('role', filters.role);
    if (filters.type) queryParams.append('type', filters.type);

    const url = ${this.backendApiUrl}/agents?${queryParams.toString()};
    this.logger.log(Attempting to find agents via API: ${url});

    try {
      const headers = this.getAuthHeaders(); // Get headers with API key`);
                const response$ = this.httpService.get(url, { headers });
                `
      const response = await firstValueFrom(response$);`;
                this.logger.log(Successfully, found, $, { response, : .data.length }, agents);
                return response.data;
            }
            try { }
            catch (error) {
                const axiosError = error;
                const errorDetails = axiosError.response?.data || axiosError.message;
                `
      this.logger.error(Failed to find agents: ${JSON.stringify(errorDetails)}, axiosError.stack);`;
                throw new Error(Find, agents, failed, $, { errorDetails } `);
    }
  }

  // --- updateAgentStatus Tool Implementation ---

  private updateAgentStatusTool(): MCPTool {
    return {
      name: 'updateAgentStatus',
      description: 'Updates only the status of an agent.',
      parameters: {
        type: 'object',
        properties: {
          agentId: { type: 'string', description: 'The ID of the agent to update.' },
          status: { type: 'string', enum: Object.values(AgentStatus), description: 'The new status.' },
        },
        required: ['agentId', 'status'],
      },
      execute: async (params: { agentId: string; status: AgentStatus }) => {
        return this.updateAgentStatus(params.agentId, params.status);
      },
    };
  }

  async updateAgentStatus(agentId: string, status: AgentStatus): Promise<Agent> {
    const url = ${this.backendApiUrl}/agents/${agentId}/status;`, this.logger.log(Attempting, to, update, status));
                for (agent; '${agentId}`'; to)
                    '${status}';
                via;
                API: $;
                {
                    url;
                }
                ;
                try {
                    const headers = this.getAuthHeaders(); // Get headers with API key
                    const response$ = this.httpService.put(url, { status }, { headers });
                    `
      const response = await firstValueFrom(response$);`;
                    this.logger.log(Successfully, updated, status);
                    for (agent; '${agentId}';)
                        ;
                    return response.data;
                    `
    } catch (error) {`;
                    const axiosError = error;
                    `
      const errorDetails = axiosError.response?.data || axiosError.message;
      this.logger.error(Failed to update status for agent '${agentId}': ${JSON.stringify(errorDetails)}, axiosError.stack);`;
                    throw new Error(Agent, status, update, failed, $, { errorDetails });
                }
                finally {
                }
            }
            // --- registerEntity Tool Implementation ---
        }
        // --- registerEntity Tool Implementation ---
    }
    // --- registerEntity Tool Implementation ---
    registerEntityTool() {
        return {
            name: 'registerEntity',
            description: 'Registers a non-agent entity (e.g., AI Model, Service) with the central system. Performs an upsert based on name and type.',
            parameters: {
                type: 'object',
                properties: {
                    name: { type: 'string', description: "The entity's unique name." },
                    type: { type: 'string', description: "The entity's type (e.g., 'AIModel', 'VSCodeExtension')." },
                    metadata: { type: 'object', description: 'Any additional structured data about the entity.', additionalProperties: true },
                },
                required: ['name', 'type'],
            },
            execute: async (params) => {
                return this.registerEntity(params);
            },
        };
    }
};
MCPRegistryService = MCPRegistryService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof HttpService !== "undefined" && HttpService) === "function" ? _a : Object])
], MCPRegistryService);
export { MCPRegistryService };
/entities;
const data = {
    name: params.name,
    type: params.type,
    metadata: params.metadata,
};
`
    this.logger.log(Attempting to register entity '${params.name}' (${params.type}`;
via;
API: $;
{
    url;
}
;
try {
    const headers = this.getAuthHeaders();
    // The POST /entities endpoint performs an upsert`
    const response$ = this.httpService.post(url, data, { headers });
    `
      const response = await firstValueFrom(response$);
      this.logger.log(`;
    Successfully;
    registered / updated;
    entity;
    '${params.name}';
    with (ID)
        : $;
    {
        response.data.id;
    }
    ;
    return response.data;
}
catch (error) {
    `
      const axiosError = error as AxiosError;`;
    const errorDetails = axiosError.response?.data || axiosError.message;
    this.logger.error(Failed, to, register, entity, '${params.name}`', $, { JSON, : .stringify(errorDetails) }, axiosError.stack);
    `
      throw new Error(Entity registration failed: ${errorDetails});
    }
  }

  // --- updateEntity Tool Implementation ---

  private updateEntityTool(): MCPTool {
      return {
          name: 'updateEntity',
          description: 'Updates the profile of an existing registered entity.',
          parameters: {
              type: 'object',
              properties: {
                  entityId: { type: 'string', description: 'The ID of the entity to update.' },
                  name: { type: 'string', description: 'New name for the entity.' },
                  type: { type: 'string', description: 'New type for the entity.' },
                  metadata: { type: 'object', description: 'New or updated metadata.', additionalProperties: true },
              },
              required: ['entityId'], // Only entityId is strictly required
          },
          execute: async (params: { entityId: string; name?: string; type?: string; metadata?: JsonValue }) => {
              return this.updateEntity(params.entityId, { name: params.name, type: params.type, metadata: params.metadata });
          },
      };
  }

  async updateEntity(entityId: string, updates: FuseUpdateEntityDto): Promise<RegisteredEntity> {`;
    const url = $, { this: , backendApiUrl };
    `/entities/${entityId};`;
    this.logger.log(Attempting, to, update, entity, '${entityId}`', via, API, $, { url });
    try {
        const headers = this.getAuthHeaders();
        const response$ = this.httpService.patch(url, updates, { headers });
        `
          const response = await firstValueFrom(response$);`;
        this.logger.log(Successfully, updated, entity, '${entityId}`');
        return response.data;
    }
    catch (error) {
        const axiosError = error;
        const errorDetails = axiosError.response?.data || axiosError.message;
        this.logger.error(Failed, to, update, entity, '${entityId}', $, { JSON, : .stringify(errorDetails) }, axiosError.stack);
        `
          throw new Error(Entity update failed: ${errorDetails});
      }
  }

  // --- getEntity Tool Implementation ---

  private getEntityTool(): MCPTool {
      return {
          name: 'getEntity',
          description: 'Retrieves the profile of a specific registered entity by ID.',
          parameters: {
              type: 'object',
              properties: {
                  entityId: { type: 'string', description: 'The ID of the entity to retrieve.' },
              },
              required: ['entityId'],
          },
          execute: async (params: { entityId: string }) => {
              return this.getEntity(params.entityId);
          },
      };
  }

  async getEntity(entityId: string): Promise<RegisteredEntity> {`;
        const url = $, { this: , backendApiUrl };
        /entities/$;
        {
            entityId;
        }
        `;
      this.logger.log(Attempting to get entity profile '${entityId}' via API: ${url}`;
        ;
        try {
            const headers = this.getAuthHeaders();
            const response$ = this.httpService.get(url, { headers });
            const response = await firstValueFrom(response$);
            this.logger.log(Successfully, retrieved, entity, profile, '${entityId}');
            return response.data;
        }
        catch (error) {
            const axiosError = error;
            const errorDetails = axiosError.response?.data || axiosError.message;
            `
          this.logger.error(Failed to get entity profile '${entityId}': ${JSON.stringify(errorDetails)}, axiosError.stack);`;
            throw new Error(Get, entity, profile, failed, $, { errorDetails } `);
      }
  }

  // --- findEntities Tool Implementation ---

  private findEntitiesTool(): MCPTool {
      return {
          name: 'findEntities',
          description: 'Finds registered entities based on specified criteria.',
          parameters: {
              type: 'object',
              properties: {
                  type: { type: 'string', description: 'Filter by entity type.' },
                  name: { type: 'string', description: 'Filter by entity name (contains search).' },
                  // Add other potential filterable fields from RegisteredEntity if needed
              },
              // No required parameters, all are optional filters
          },
          execute: async (params: { type?: string; name?: string }) => {
              return this.findEntities(params);
          },
      };
  }

  async findEntities(
      filters: { type?: string; name?: string }
  ): Promise<RegisteredEntity[]> {
      const queryParams = new URLSearchParams();
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.name) queryParams.append('name', filters.name); // Controller handles 'contains' logic

      const url = ${this.backendApiUrl}/entities?${queryParams.toString()};
      this.logger.log(Attempting to find entities via API: ${url});
      try {
          const headers = this.getAuthHeaders();`);
            const response$ = this.httpService.get(url, { headers });
            `
          const response = await firstValueFrom(response$);`;
            this.logger.log(Successfully, found, $, { response, : .data.length }, entities);
            return response.data;
        }
        try { }
        catch (error) {
            const axiosError = error;
            const errorDetails = axiosError.response?.data || axiosError.message;
            `
          this.logger.error(Failed to find entities: ${JSON.stringify(errorDetails)}, axiosError.stack);`;
            throw new Error(Find, entities, failed, $, { errorDetails } ``);
        }
    }
}
//# sourceMappingURL=mcp-registry.service.js.map