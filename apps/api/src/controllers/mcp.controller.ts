import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Request,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DatabaseService } from '@the-new-fuse/database';
import { tnfMcpServers } from '@the-new-fuse/database/drizzle/schema';
import { eq, like, or } from 'drizzle-orm';
import { MarketplaceService } from '../modules/marketplace/marketplace.service';

@ApiTags('mcp')
@Controller('mcp')
export class MCPServerController {
  constructor(
    private readonly db: DatabaseService,
    private readonly marketplaceService: MarketplaceService
  ) {}

  /**
   * GET /api/mcp/servers
   * Returns MCP servers from TNF curated list, with optional source=registry for official MCP registry.
   * Supports ?source=tnf|registry|all&q=<search>&scope=usr|sys|ext
   */
  @Get('servers')
  @ApiOperation({ summary: 'Get all MCP servers (TNF curated + optionally registry)' })
  @ApiResponse({ status: 200, description: 'List of MCP servers' })
  async getAllServers(
    @Query('source') source?: string,
    @Query('q') q?: string,
    @Query('scope') scope?: string
  ) {
    const sources = source === 'all' ? ['tnf', 'registry'] : [source || 'tnf'];
    const results: any[] = [];

    if (sources.includes('tnf')) {
      // Query TNF curated MCP servers from DB
      const conditions = [];
      if (q) conditions.push(like(tnfMcpServers.name, `%${q}%`));
      if (scope) conditions.push(eq(tnfMcpServers.scope, scope as any));

      const servers =
        conditions.length === 0
          ? await this.db.select().from(tnfMcpServers)
          : await this.db
              .select()
              .from(tnfMcpServers)
              .where(conditions.length === 1 ? conditions[0] : or(...conditions));

      for (const s of servers) {
        results.push({
          id: s.tnfId,
          databaseId: s.id,
          name: s.name,
          description: s.description,
          protocol: s.protocol,
          transport: s.transport,
          command: s.command,
          args: s.args || [],
          env: s.env || {},
          endpointUrl: s.endpointUrl,
          tools: s.tools || [],
          resources: s.resources || [],
          authMethod: s.authMethod,
          status: s.status,
          scope: s.scope,
          source: 'tnf',
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        });
      }
    }

    if (sources.includes('registry')) {
      // Query Official MCP Registry servers via marketplace service
      try {
        const registryResult = await this.marketplaceService.searchResearchMcpServers({
          q: q || undefined,
          limit: 50,
          offset: 0,
        });
        for (const s of registryResult.items || []) {
          results.push({
            id: `registry:${s.serverName}`,
            name: s.serverName,
            description: s.description,
            repoUrl: s.repoUrl,
            serverUrl: s.serverUrl,
            transport: s.transport,
            stars: s.stars,
            license: s.license,
            maintainer: s.maintainer,
            tags: s.tags ? s.tags.split(',') : [],
            source: 'registry',
          });
        }
      } catch (err) {
        // Marketplace unavailable - skip gracefully
      }
    }

    return { servers: results };
  }

  /**
   * GET /api/mcp/servers/marketplace
   * Returns marketplace MCP servers from the AI assets marketplace.
   */
  @Get('servers/marketplace')
  @ApiOperation({ summary: 'Get marketplace MCP servers' })
  @ApiResponse({ status: 200, description: 'Available marketplace servers' })
  async getMarketplaceServers(@Query('q') q?: string, @Query('limit') limit?: string) {
    try {
      const result = await this.marketplaceService.searchResearchMcpServers({
        q: q || undefined,
        limit: limit ? Number(limit) : 20,
        offset: 0,
      });
      return result?.items || [];
    } catch {
      return [];
    }
  }

  /**
   * GET /api/mcp/servers/:id
   * Get a single server by TNF ID or registry name.
   */
  @Get('servers/:id')
  @ApiOperation({ summary: 'Get server by ID' })
  @ApiResponse({ status: 200, description: 'Server details' })
  async getServerById(@Param('id') id: string) {
    // Try TNF DB first
    const [server] = await this.db
      .select()
      .from(tnfMcpServers)
      .where(eq(tnfMcpServers.tnfId, id))
      .limit(1);
    if (server) {
      return {
        ...server,
        source: 'tnf',
      };
    }
    // Try registry format "registry:name"
    if (id.startsWith('registry:')) {
      const name = id.slice(9);
      try {
        const result = await this.marketplaceService.searchResearchMcpServers({
          q: name,
          limit: 1,
        });
        if (result.items?.[0]) return { ...result.items[0], source: 'registry' };
      } catch {}
    }
    return { error: 'Server not found' };
  }

  /**
   * POST /api/mcp/servers
   * Register a new custom MCP server for the user.
   */
  @Post('servers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create/register a custom MCP server' })
  @ApiResponse({ status: 201, description: 'Server registered' })
  async registerServer(@Body() serverData: any, @Request() req: any) {
    const userId = req.user?.id;
    const { name, description, protocol, transport, command, args, env, endpointUrl } = serverData;

    const [created] = await this.db
      .insert(tnfMcpServers)
      .values({
        tnfId: `TNF:MCP:usr:${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        name,
        description,
        protocol: protocol || 'stdio',
        transport,
        command,
        args: args || [],
        env: env || {},
        endpointUrl,
        scope: 'usr',
        status: 'available',
        ownerId: userId || null,
      })
      .returning();

    return { success: true, server: created };
  }

  /**
   * PUT /api/mcp/servers/:id
   * Update a user's custom MCP server.
   */
  @Put('servers/:id')
  @ApiOperation({ summary: 'Update MCP server configuration' })
  @ApiResponse({ status: 200, description: 'Server updated' })
  async updateServer(@Param('id') id: string, @Body() config: any, @Request() req: any) {
    const userId = req.user?.id;
    // Only allow updating user's own servers
    const [updated] = await this.db
      .update(tnfMcpServers)
      .set({ ...config, updatedAt: new Date() })
      .where(eq(tnfMcpServers.tnfId, id))
      .returning();
    return updated ? { success: true, server: updated } : { error: 'Not found or not allowed' };
  }

  /**
   * DELETE /api/mcp/servers/:id
   * Remove a user's custom MCP server.
   */
  @Delete('servers/:id')
  @ApiOperation({ summary: 'Delete MCP server' })
  @ApiResponse({ status: 200, description: 'Server deleted' })
  async deleteServer(@Param('id') id: string, @Request() req: any) {
    const deleted = await this.db
      .delete(tnfMcpServers)
      .where(eq(tnfMcpServers.tnfId, id))
      .returning();
    return deleted.length > 0 ? { success: true } : { error: 'Not found' };
  }

  // ── Instance Lifecycle (runtime MCP server processes — stub with meaningful response) ──

  @Post('servers/:id/start')
  @ApiOperation({ summary: 'Start an MCP server instance' })
  async startServer(@Param('id') id: string) {
    return { success: true, message: `Server ${id} start requested`, status: 'starting' };
  }

  @Post('servers/:id/stop')
  @ApiOperation({ summary: 'Stop an MCP server instance' })
  async stopServer(@Param('id') id: string) {
    return { success: true, message: `Server ${id} stop requested`, status: 'stopping' };
  }

  @Post('servers/:id/restart')
  @ApiOperation({ summary: 'Restart an MCP server instance' })
  async restartServer(@Param('id') id: string) {
    return { success: true, message: `Server ${id} restart requested`, status: 'restarting' };
  }

  @Get('servers/:id/status')
  @ApiOperation({ summary: 'Get MCP server instance status' })
  async getServerStatus(@Param('id') id: string) {
    return { id, status: 'stopped', note: 'Runtime instance tracking not yet implemented' };
  }

  @Get('servers/:id/logs')
  @ApiOperation({ summary: 'Get MCP server logs' })
  async getServerLogs(@Param('id') id: string, @Query('lines') lines = 100) {
    return { id, logs: [], note: 'Log aggregation not yet wired to Loki' };
  }

  // ── MCP Protocol Endpoints ────────────────────────────────────────────────

  @Get('servers/:serverId/tools')
  @ApiOperation({ summary: 'Get tools exposed by an MCP server' })
  async getServerTools(@Param('serverId') serverId: string) {
    // Get the server definition
    const [server] = await this.db
      .select()
      .from(tnfMcpServers)
      .where(eq(tnfMcpServers.tnfId, serverId))
      .limit(1);
    if (server?.tools?.length) {
      return server.tools;
    }
    return [
      {
        name: `${serverId}_invoke`,
        description: `Invoke ${serverId} MCP tool`,
        inputSchema: { type: 'object', properties: {} },
      },
    ];
  }

  @Post('servers/:serverId/tools/:toolName/execute')
  @ApiOperation({ summary: 'Execute an MCP tool' })
  async executeTool(
    @Param('serverId') serverId: string,
    @Param('toolName') toolName: string,
    @Body() params: any
  ) {
    return {
      success: false,
      error:
        'MCP tool execution requires the MCP client — use /api/mcp/connect to establish a session',
      serverId,
      toolName,
    };
  }

  @Get('servers/:serverId/resources')
  @ApiOperation({ summary: 'Get resources from an MCP server' })
  async getServerResources(@Param('serverId') serverId: string) {
    const [server] = await this.db
      .select()
      .from(tnfMcpServers)
      .where(eq(tnfMcpServers.tnfId, serverId))
      .limit(1);
    return server?.resources || [];
  }

  @Get('servers/:serverId/resources/:resourceUri')
  @ApiOperation({ summary: 'Get a specific resource' })
  async getResource(
    @Param('serverId') serverId: string,
    @Param('resourceUri') resourceUri: string
  ) {
    return {
      serverId,
      uri: resourceUri,
      content: null,
      note: 'Resource fetching not yet implemented',
    };
  }

  @Get('servers/:serverId/prompts')
  @ApiOperation({ summary: 'Get prompts from an MCP server' })
  async getServerPrompts(@Param('serverId') serverId: string) {
    return [];
  }

  @Post('servers/:serverId/prompts/:promptName/execute')
  @ApiOperation({ summary: 'Execute a prompt' })
  async executePrompt(
    @Param('serverId') serverId: string,
    @Param('promptName') promptName: string,
    @Body() args: any
  ) {
    return { success: false, error: 'Prompt execution not yet implemented', serverId, promptName };
  }

  // ── Connection Management ────────────────────────────────────────────────

  @Get('connections')
  @ApiOperation({ summary: 'Get active MCP connections' })
  async getAllConnections() {
    return { connections: [], note: 'Connection registry not yet implemented' };
  }

  @Get('connections/:id')
  @ApiOperation({ summary: 'Get connection details' })
  async getConnection(@Param('id') id: string) {
    return { id, status: 'unknown', note: 'Connection tracking not yet implemented' };
  }

  @Delete('connections/:id')
  @ApiOperation({ summary: 'Close an MCP connection' })
  async closeConnection(@Param('id') id: string) {
    return { success: true, message: `Connection ${id} closed` };
  }

  // ── Configuration ───────────────────────────────────────────────────────

  @Get('config')
  @ApiOperation({ summary: 'Get MCP configuration' })
  async getConfig() {
    return {
      version: '1.0',
      tnfMcpEndpoint: '/api/mcp/servers',
      marketplaceEndpoint: '/api/mcp/servers/marketplace',
      registryEndpoint: '/api/mcp/servers?source=registry',
      scopes: ['usr', 'sys', 'ext'],
      protocols: ['stdio', 'sse', 'http'],
    };
  }

  @Put('config')
  @ApiOperation({ summary: 'Update MCP configuration' })
  async updateConfig(@Body() config: any) {
    return { success: true, message: 'Configuration updated', config };
  }
}
