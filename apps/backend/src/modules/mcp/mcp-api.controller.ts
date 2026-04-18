import { Controller, Get, Logger, Param, Query } from '@nestjs/common';
import { db, sql } from '@the-new-fuse/database';
import type { MCPTool } from '@the-new-fuse/mcp-core';
import { MCPToolRegistry } from './mcp-tool-registry.service.js';

type McpParamType = 'string' | 'number' | 'boolean' | 'object' | 'array';

interface ApiMcpParameter {
  name: string;
  type: McpParamType;
  description: string;
  required?: boolean;
  default?: any;
}

interface ApiMcpTool {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, ApiMcpParameter>;
  returns: {
    type: string;
    description: string;
  };
  serverId?: string;
}

interface ApiMcpServer {
  id: string;
  name: string;
  url: string;
  status: 'online' | 'offline' | 'error';
  tools: ApiMcpTool[];
  metadata?: Record<string, any>;
}

@Controller('api/mcp')
export class McpApiController {
  private readonly logger = new Logger(McpApiController.name);

  constructor(private readonly toolRegistry: MCPToolRegistry) {}

  @Get('servers')
  async listServers(
    @Query('source') source?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
    @Query('search') search?: string
  ): Promise<{ servers: ApiMcpServer[] }> {
    if (source === 'registry') {
      const registryServers = await this.fetchRegistryServers(limit, cursor, search);
      return { servers: registryServers };
    }
    const rows = await db.execute(sql`
      SELECT
        tnf_id,
        name,
        description,
        protocol,
        transport,
        command,
        endpoint_url,
        tools,
        status,
        scope,
        metadata
      FROM tnf_mcp_servers
      ORDER BY name ASC
    `);

    const serverRows = Array.isArray(rows) ? rows : ((rows as any)?.rows ?? []);

    const coreTools = this.toolRegistry.getAllTools().map((tool) => this.mapTool(tool, 'tnf-core'));

    const coreServer: ApiMcpServer = {
      id: 'tnf-core',
      name: 'TNF MCP Core',
      url: process.env.MCP_ENDPOINT_URL || '',
      status: 'online',
      tools: coreTools,
      metadata: {
        source: 'tnf-core',
        description: 'TNF built-in MCP server and tool registry',
      },
    };

    const curatedServers = serverRows.map((row: any) => {
      const toolNames = Array.isArray(row.tools) ? row.tools : [];
      const tools = toolNames.map((toolName) => {
        const tool = this.toolRegistry.getTool(toolName);
        if (tool) {
          return this.mapTool(tool, row.tnf_id);
        }
        return {
          id: toolName,
          name: toolName,
          description: '',
          parameters: {},
          returns: { type: 'object', description: '' },
          serverId: row.tnf_id,
        };
      });

      return {
        id: row.tnf_id || row.id || row.name,
        name: row.name,
        url: row.endpoint_url || row.command || '',
        status: this.mapStatus(row.status),
        tools,
        metadata: {
          source: 'tnf',
          description: row.description,
          protocol: row.protocol,
          transport: row.transport,
          scope: row.scope,
          command: row.command,
          endpointUrl: row.endpoint_url,
          ...((row.metadata as Record<string, any>) || {}),
        },
      } as ApiMcpServer;
    });

    return { servers: [coreServer, ...curatedServers] };
  }

  @Get('servers/:id/tools')
  async listServerTools(@Param('id') id: string): Promise<ApiMcpTool[]> {
    if (id === 'tnf-core') {
      return this.toolRegistry.getAllTools().map((tool) => this.mapTool(tool, id));
    }

    const rows = await db.execute(sql`
      SELECT tools, tnf_id
      FROM tnf_mcp_servers
      WHERE tnf_id = ${id}
      LIMIT 1
    `);
    const row = Array.isArray(rows) ? rows[0] : (rows as any)?.rows?.[0];
    const toolNames = Array.isArray(row?.tools) ? row.tools : [];
    return toolNames.map((toolName: string) => {
      const tool = this.toolRegistry.getTool(toolName);
      if (tool) {
        return this.mapTool(tool, id);
      }
      return {
        id: toolName,
        name: toolName,
        description: '',
        parameters: {},
        returns: { type: 'object', description: '' },
        serverId: id,
      };
    });
  }

  @Get('marketplace/servers')
  async listMarketplaceServers(
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
    @Query('search') search?: string
  ) {
    const registryServers = await this.fetchRegistryServerResponses(limit, cursor, search);
    return registryServers.map((serverResponse) => this.mapRegistryServerResponse(serverResponse));
  }

  private mapRegistryServerResponse(serverResponse: any) {
    const server = serverResponse?.server || {};
    const name = String(server?.name || '').trim();
    const publisher = name.includes('/') ? name.split('/')[0] : 'official-registry';
    const packages = Array.isArray(server?.packages) ? server.packages : [];
    const remotes = Array.isArray(server?.remotes) ? server.remotes : [];
    const repository = server?.repository?.url || null;
    const icon = Array.isArray(server?.icons) ? server.icons[0]?.src : server?.icon?.src;
    const configurationSchema = this.buildRegistryConfigurationSchema(server);
    const requiresConfiguration =
      (configurationSchema && Object.keys(configurationSchema.properties || {}).length > 0) ||
      false;
    const installCommand = this.buildRegistryInstallCommand(packages);
    const args = this.buildRegistryInstallArgs(packages, installCommand);

    return {
      id: name,
      name: server?.title || name,
      description: server?.description || 'Official MCP Registry listing',
      version: server?.version || 'latest',
      publisher,
      category: server?.category || 'registry',
      rating: 0,
      downloads: 0,
      lastUpdated:
        serverResponse?._meta?.['io.modelcontextprotocol.registry/official']?.updatedAt ||
        new Date().toISOString(),
      installCommand,
      args,
      capabilities: server?.capabilities || [],
      requiresConfiguration,
      configurationSchema: configurationSchema || undefined,
      repository,
      websiteUrl: server?.websiteUrl || null,
      icon,
      transport: remotes[0]?.type || packages[0]?.transport?.type || null,
      raw: serverResponse,
    };
  }

  private async fetchRegistryServers(
    limit?: string,
    cursor?: string,
    search?: string
  ): Promise<ApiMcpServer[]> {
    const servers = await this.fetchRegistryServerResponses(limit, cursor, search);
    return servers.map((serverResponse) => this.mapRegistryToApiServer(serverResponse));
  }

  private async fetchRegistryServerResponses(
    limit?: string,
    cursor?: string,
    search?: string
  ): Promise<any[]> {
    const normalizedLimit = Math.max(1, Math.min(Number(limit) || 100, 200));
    const baseUrl = 'https://registry.modelcontextprotocol.io/v0.1/servers';
    const url = new URL(baseUrl);
    url.searchParams.set('limit', String(normalizedLimit));
    url.searchParams.set('version', 'latest');
    if (cursor) url.searchParams.set('cursor', cursor);
    if (search) url.searchParams.set('search', search);

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Registry request failed: ${response.status}`);
      }
      const payload = await response.json();
      return Array.isArray(payload?.servers) ? payload.servers : [];
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Official MCP registry unavailable: ${message}`);
      return [];
    }
  }

  private mapRegistryToApiServer(serverResponse: any): ApiMcpServer {
    const server = serverResponse?.server || {};
    const officialMeta = serverResponse?._meta?.['io.modelcontextprotocol.registry/official'] || {};
    const packages = Array.isArray(server?.packages) ? server.packages : [];
    const remotes = Array.isArray(server?.remotes) ? server.remotes : [];
    const configurationSchema = this.buildRegistryConfigurationSchema(server);

    const metadata = {
      source: 'registry',
      registry: {
        status: officialMeta.status,
        statusMessage: officialMeta.statusMessage,
        publishedAt: officialMeta.publishedAt,
        updatedAt: officialMeta.updatedAt,
        isLatest: officialMeta.isLatest,
      },
      name: server?.name,
      title: server?.title,
      description: server?.description,
      version: server?.version,
      schema: server?.$schema,
      repository: server?.repository || null,
      websiteUrl: server?.websiteUrl || null,
      icons: server?.icons || server?.icon || null,
      packages,
      remotes,
      configurationSchema,
      install: this.buildRegistryInstallMetadata(packages, remotes),
      raw: serverResponse,
    };

    const installHint =
      packages[0]?.identifier ||
      packages[0]?.registryBaseUrl ||
      server?.repository?.url ||
      server?.websiteUrl ||
      '';

    return {
      id: `${server?.name || 'registry'}@${server?.version || 'latest'}`,
      name: server?.title || server?.name || 'Registry MCP Server',
      url: installHint,
      status: officialMeta.status === 'active' ? 'online' : 'offline',
      tools: [],
      metadata,
    };
  }

  private buildRegistryConfigurationSchema(server: any) {
    const packages = Array.isArray(server?.packages) ? server.packages : [];
    const remotes = Array.isArray(server?.remotes) ? server.remotes : [];

    const properties: Record<string, any> = {};
    const required = new Set<string>();

    const addField = (name: string, input: any, source: string) => {
      if (!name || properties[name]) return;
      const schema = this.inputToSchemaProperty(input, source);
      properties[name] = schema;
      if (input?.isRequired) required.add(name);
    };

    for (const pkg of packages) {
      const envVars = Array.isArray(pkg?.environmentVariables) ? pkg.environmentVariables : [];
      for (const envVar of envVars) {
        const envName = String(envVar?.name || '').trim();
        if (!envName) continue;
        addField(envName, envVar, 'environment');
      }

      const runtimeArgs = Array.isArray(pkg?.runtimeArguments) ? pkg.runtimeArguments : [];
      this.addArgumentInputs(runtimeArgs, addField, 'runtimeArgument');

      const packageArgs = Array.isArray(pkg?.packageArguments) ? pkg.packageArguments : [];
      this.addArgumentInputs(packageArgs, addField, 'packageArgument');
    }

    for (const remote of remotes) {
      const variables = remote?.variables || {};
      for (const [key, input] of Object.entries(variables)) {
        const variableName = String(key || '').trim();
        if (!variableName) continue;
        addField(variableName, input, 'remoteVariable');
      }
    }

    if (Object.keys(properties).length === 0) return null;

    return {
      type: 'object',
      required: required.size ? Array.from(required) : undefined,
      properties,
    };
  }

  private addArgumentInputs(
    args: any[],
    addField: (name: string, input: any, source: string) => void,
    source: string
  ) {
    for (const arg of args) {
      const input = arg || {};
      if (input?.value !== undefined && input?.value !== null && input?.value !== '') {
        continue;
      }
      const key = this.normalizeArgumentKey(input);
      if (!key) continue;
      addField(key, input, source);
    }
  }

  private normalizeArgumentKey(input: any) {
    const valueHint = String(input?.valueHint || '').trim();
    if (valueHint) return valueHint;

    const name = String(input?.name || '').trim();
    if (!name) return '';

    return name.replace(/^--?/, '').replace(/[^a-zA-Z0-9_]/g, '_') || name;
  }

  private inputToSchemaProperty(input: any, source: string) {
    const format = input?.format;
    let type = 'string';
    if (format === 'number') type = 'number';
    if (format === 'boolean') type = 'boolean';

    const schema: Record<string, any> = {
      type,
      description: input?.description || input?.placeholder || '',
      default: input?.default,
      enum: Array.isArray(input?.choices) && input.choices.length > 0 ? input.choices : undefined,
      format: format === 'filepath' ? 'filepath' : undefined,
      'x-mcp-source': source,
      'x-secret': input?.isSecret || false,
    };

    Object.keys(schema).forEach((key) => schema[key] === undefined && delete schema[key]);
    return schema;
  }

  private buildRegistryInstallMetadata(packages: any[], remotes: any[]) {
    const primaryPackage = packages?.[0];
    return {
      primaryPackage: primaryPackage || null,
      remotes: remotes || [],
      installCommand: this.buildRegistryInstallCommand(packages),
      args: this.buildRegistryInstallArgs(packages, this.buildRegistryInstallCommand(packages)),
    };
  }

  private buildRegistryInstallCommand(packages: any[]) {
    const primaryPackage = packages?.[0];
    if (!primaryPackage) return '';

    if (primaryPackage?.runtimeHint) return primaryPackage.runtimeHint;

    switch (primaryPackage?.registryType) {
      case 'npm':
        return 'npx';
      case 'pypi':
        return 'uvx';
      case 'oci':
        return 'docker run';
      case 'nuget':
        return 'dotnet';
      default:
        return primaryPackage?.identifier || '';
    }
  }

  private buildRegistryInstallArgs(packages: any[], installCommand: string) {
    const primaryPackage = packages?.[0];
    if (!primaryPackage) return [];

    const args: string[] = [];
    const runtimeArgs = Array.isArray(primaryPackage?.runtimeArguments)
      ? primaryPackage.runtimeArguments
      : [];
    const packageArgs = Array.isArray(primaryPackage?.packageArguments)
      ? primaryPackage.packageArguments
      : [];

    const formatArgument = (arg: any) => {
      const type = arg?.type;
      const value = arg?.value;
      const valueHint = arg?.valueHint ? `<${arg.valueHint}>` : '';

      if (type === 'named') {
        if (value !== undefined && value !== null && value !== '') {
          return `${arg?.name} ${value}`;
        }
        return `${arg?.name} ${valueHint}`.trim();
      }

      if (value !== undefined && value !== null && value !== '') {
        return String(value);
      }

      return valueHint || '';
    };

    for (const arg of runtimeArgs) {
      const token = formatArgument(arg);
      if (token) args.push(token);
    }

    if (
      installCommand &&
      primaryPackage?.identifier &&
      installCommand !== primaryPackage.identifier
    ) {
      args.push(primaryPackage.identifier);
    }

    for (const arg of packageArgs) {
      const token = formatArgument(arg);
      if (token) args.push(token);
    }

    return args;
  }

  private mapTool(tool: MCPTool, serverId: string): ApiMcpTool {
    const inputSchema: any = tool?.inputSchema || {};
    const properties: Record<string, any> = inputSchema.properties || {};
    const requiredSet = new Set(Array.isArray(inputSchema.required) ? inputSchema.required : []);

    const parameters = Object.entries(properties).reduce<Record<string, ApiMcpParameter>>(
      (acc, [name, config]) => {
        const rawType = Array.isArray(config?.type) ? config.type[0] : config?.type;
        const type = this.normalizeType(rawType);
        acc[name] = {
          name,
          type,
          description: config?.description || '',
          required: requiredSet.has(name),
          default: config?.default,
        };
        return acc;
      },
      {}
    );

    const outputSchema: any = tool?.outputSchema || {};
    const outputType = Array.isArray(outputSchema.type) ? outputSchema.type[0] : outputSchema.type;

    return {
      id: tool.name,
      name: tool.name,
      description: tool.description,
      parameters,
      returns: {
        type: outputType || 'object',
        description: outputSchema.description || 'Execution result',
      },
      serverId,
    };
  }

  private normalizeType(type?: string): McpParamType {
    switch (type) {
      case 'number':
      case 'integer':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'object':
        return 'object';
      case 'array':
        return 'array';
      default:
        return 'string';
    }
  }

  private mapStatus(status?: string): 'online' | 'offline' | 'error' {
    switch (status) {
      case 'available':
      case 'active':
      case 'online':
        return 'online';
      case 'offline':
      case 'inactive':
        return 'offline';
      default:
        return 'error';
    }
  }
}
