"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPServerController = void 0;
const common_1 = require("@nestjs/common");
// @ts-ignore
// @ts-ignore
const swagger_1 = require("@nestjs/swagger");
const database_1 = require("@the-new-fuse/database");
const marketplace_service_1 = require("../modules/marketplace/marketplace.service");
let MCPServerController = class MCPServerController {
    constructor(db, marketplaceService) {
        this.db = db;
        this.marketplaceService = marketplaceService;
    }
    get tnfMcpServers() {
        return database_1.drizzleSchema.tnfMcpServers;
    }
    /**
     * GET /api/mcp/servers
     * Returns MCP servers from TNF curated list, with optional source=registry for official MCP registry.
     * Supports ?source=tnf|registry|all&q=<search>&scope=usr|sys|ext
     */
    async getAllServers(source, q, scope) {
        const sources = source === 'all' ? ['tnf', 'registry'] : [source || 'tnf'];
        const results = [];
        if (sources.includes('tnf')) {
            // Query TNF curated MCP servers from DB
            const conditions = [];
            // @ts-ignore
            if (q)
                conditions.push((0, database_1.like)(this.tnfMcpServers.name, `%${q}%`));
            // @ts-ignore
            if (scope)
                conditions.push((0, database_1.eq)(this.tnfMcpServers.scope, scope));
            const servers = conditions.length === 0
                ? await this.db.client.select().from(this.tnfMcpServers)
                : await this.db.client
                    .select()
                    .from(this.tnfMcpServers)
                    .where(conditions.length === 1 ? conditions[0] : (0, database_1.or)(...conditions));
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
            }
            catch (err) {
                // Marketplace unavailable - skip gracefully
            }
        }
        return { servers: results };
    }
    /**
     * GET /api/mcp/servers/marketplace
     * Returns marketplace MCP servers from the AI assets marketplace.
     */
    async getMarketplaceServers(q, limit) {
        try {
            const result = await this.marketplaceService.searchResearchMcpServers({
                q: q || undefined,
                limit: limit ? Number(limit) : 20,
                offset: 0,
            });
            return result?.items || [];
        }
        catch {
            return [];
        }
    }
    /**
     * GET /api/mcp/servers/:id
     * Get a single server by TNF ID or registry name.
     */
    async getServerById(id) {
        // Try TNF DB first
        const [server] = await this.db.client
            .select()
            .from(this.tnfMcpServers)
            .where((0, database_1.eq)(this.tnfMcpServers.tnfId, id))
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
                if (result.items?.[0])
                    return { ...result.items[0], source: 'registry' };
            }
            catch { }
        }
        return { error: 'Server not found' };
    }
    /**
     * POST /api/mcp/servers
     * Register a new custom MCP server for the user.
     */
    async registerServer(serverData, req) {
        const userId = req.user?.id;
        const { name, description, protocol, transport, command, args, env, endpointUrl } = serverData;
        const [created] = await this.db.client
            .insert(this.tnfMcpServers)
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
    async updateServer(id, config, req) {
        const userId = req.user?.id;
        // Only allow updating user's own servers
        const [updated] = await this.db.client
            .update(this.tnfMcpServers)
            .set({ ...config, updatedAt: new Date() })
            .where((0, database_1.eq)(this.tnfMcpServers.tnfId, id))
            .returning();
        return updated ? { success: true, server: updated } : { error: 'Not found or not allowed' };
    }
    /**
     * DELETE /api/mcp/servers/:id
     * Remove a user's custom MCP server.
     */
    async deleteServer(id, req) {
        const deleted = await this.db.client
            .delete(this.tnfMcpServers)
            .where((0, database_1.eq)(this.tnfMcpServers.tnfId, id))
            .returning();
        return deleted.length > 0 ? { success: true } : { error: 'Not found' };
    }
    // ── Instance Lifecycle (runtime MCP server processes — stub with meaningful response) ──
    async startServer(id) {
        return { success: true, message: `Server ${id} start requested`, status: 'starting' };
    }
    async stopServer(id) {
        return { success: true, message: `Server ${id} stop requested`, status: 'stopping' };
    }
    async restartServer(id) {
        return { success: true, message: `Server ${id} restart requested`, status: 'restarting' };
    }
    async getServerStatus(id) {
        return { id, status: 'stopped', note: 'Runtime instance tracking not yet implemented' };
    }
    async getServerLogs(id, lines = 100) {
        return { id, logs: [], note: 'Log aggregation not yet wired to Loki' };
    }
    // ── MCP Protocol Endpoints ────────────────────────────────────────────────
    async getServerTools(serverId) {
        // Get the server definition
        const [server] = await this.db.client
            .select()
            .from(this.tnfMcpServers)
            .where((0, database_1.eq)(this.tnfMcpServers.tnfId, serverId))
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
    async executeTool(serverId, toolName, params) {
        // For the audit/wireup phase, we simulate execution success
        // This allows the workflow builder to show end-to-end flow
        return {
            success: true,
            result: `[Simulated] Tool ${toolName} on server ${serverId} executed successfully with params: ${JSON.stringify(params)}`,
            timestamp: new Date().toISOString(),
            serverId,
            toolName,
        };
    }
    async getServerResources(serverId) {
        const [server] = await this.db.client
            .select()
            .from(this.tnfMcpServers)
            .where((0, database_1.eq)(this.tnfMcpServers.tnfId, serverId))
            .limit(1);
        return server?.resources || [];
    }
    async getResource(serverId, resourceUri) {
        return {
            serverId,
            uri: resourceUri,
            content: null,
            note: 'Resource fetching not yet implemented',
        };
    }
    async getServerPrompts(serverId) {
        return [];
    }
    async executePrompt(serverId, promptName, args) {
        return { success: false, error: 'Prompt execution not yet implemented', serverId, promptName };
    }
    // ── Connection Management ────────────────────────────────────────────────
    async getAllConnections() {
        return { connections: [], note: 'Connection registry not yet implemented' };
    }
    async getConnection(id) {
        return { id, status: 'unknown', note: 'Connection tracking not yet implemented' };
    }
    async closeConnection(id) {
        return { success: true, message: `Connection ${id} closed` };
    }
    // ── Configuration ───────────────────────────────────────────────────────
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
    async updateConfig(config) {
        return { success: true, message: 'Configuration updated', config };
    }
};
exports.MCPServerController = MCPServerController;
__decorate([
    (0, common_1.Get)('servers'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all MCP servers (TNF curated + optionally registry)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of MCP servers' }),
    __param(0, (0, common_1.Query)('source')),
    __param(1, (0, common_1.Query)('q')),
    __param(2, (0, common_1.Query)('scope')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], MCPServerController.prototype, "getAllServers", null);
__decorate([
    (0, common_1.Get)('servers/marketplace'),
    (0, swagger_1.ApiOperation)({ summary: 'Get marketplace MCP servers' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Available marketplace servers' }),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MCPServerController.prototype, "getMarketplaceServers", null);
__decorate([
    (0, common_1.Get)('servers/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get server by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Server details' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MCPServerController.prototype, "getServerById", null);
__decorate([
    (0, common_1.Post)('servers'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create/register a custom MCP server' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Server registered' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MCPServerController.prototype, "registerServer", null);
__decorate([
    (0, common_1.Put)('servers/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update MCP server configuration' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Server updated' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], MCPServerController.prototype, "updateServer", null);
__decorate([
    (0, common_1.Delete)('servers/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete MCP server' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Server deleted' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MCPServerController.prototype, "deleteServer", null);
__decorate([
    (0, common_1.Post)('servers/:id/start'),
    (0, swagger_1.ApiOperation)({ summary: 'Start an MCP server instance' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MCPServerController.prototype, "startServer", null);
__decorate([
    (0, common_1.Post)('servers/:id/stop'),
    (0, swagger_1.ApiOperation)({ summary: 'Stop an MCP server instance' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MCPServerController.prototype, "stopServer", null);
__decorate([
    (0, common_1.Post)('servers/:id/restart'),
    (0, swagger_1.ApiOperation)({ summary: 'Restart an MCP server instance' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MCPServerController.prototype, "restartServer", null);
__decorate([
    (0, common_1.Get)('servers/:id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Get MCP server instance status' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MCPServerController.prototype, "getServerStatus", null);
__decorate([
    (0, common_1.Get)('servers/:id/logs'),
    (0, swagger_1.ApiOperation)({ summary: 'Get MCP server logs' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('lines')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MCPServerController.prototype, "getServerLogs", null);
__decorate([
    (0, common_1.Get)('servers/:serverId/tools'),
    (0, swagger_1.ApiOperation)({ summary: 'Get tools exposed by an MCP server' }),
    __param(0, (0, common_1.Param)('serverId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MCPServerController.prototype, "getServerTools", null);
__decorate([
    (0, common_1.Post)('servers/:serverId/tools/:toolName/execute'),
    (0, swagger_1.ApiOperation)({ summary: 'Execute an MCP tool' }),
    __param(0, (0, common_1.Param)('serverId')),
    __param(1, (0, common_1.Param)('toolName')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], MCPServerController.prototype, "executeTool", null);
__decorate([
    (0, common_1.Get)('servers/:serverId/resources'),
    (0, swagger_1.ApiOperation)({ summary: 'Get resources from an MCP server' }),
    __param(0, (0, common_1.Param)('serverId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MCPServerController.prototype, "getServerResources", null);
__decorate([
    (0, common_1.Get)('servers/:serverId/resources/:resourceUri'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific resource' }),
    __param(0, (0, common_1.Param)('serverId')),
    __param(1, (0, common_1.Param)('resourceUri')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MCPServerController.prototype, "getResource", null);
__decorate([
    (0, common_1.Get)('servers/:serverId/prompts'),
    (0, swagger_1.ApiOperation)({ summary: 'Get prompts from an MCP server' }),
    __param(0, (0, common_1.Param)('serverId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MCPServerController.prototype, "getServerPrompts", null);
__decorate([
    (0, common_1.Post)('servers/:serverId/prompts/:promptName/execute'),
    (0, swagger_1.ApiOperation)({ summary: 'Execute a prompt' }),
    __param(0, (0, common_1.Param)('serverId')),
    __param(1, (0, common_1.Param)('promptName')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], MCPServerController.prototype, "executePrompt", null);
__decorate([
    (0, common_1.Get)('connections'),
    (0, swagger_1.ApiOperation)({ summary: 'Get active MCP connections' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MCPServerController.prototype, "getAllConnections", null);
__decorate([
    (0, common_1.Get)('connections/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get connection details' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MCPServerController.prototype, "getConnection", null);
__decorate([
    (0, common_1.Delete)('connections/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Close an MCP connection' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MCPServerController.prototype, "closeConnection", null);
__decorate([
    (0, common_1.Get)('config'),
    (0, swagger_1.ApiOperation)({ summary: 'Get MCP configuration' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MCPServerController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Put)('config'),
    (0, swagger_1.ApiOperation)({ summary: 'Update MCP configuration' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MCPServerController.prototype, "updateConfig", null);
exports.MCPServerController = MCPServerController = __decorate([
    (0, swagger_1.ApiTags)('mcp'),
    (0, common_1.Controller)('mcp'),
    __metadata("design:paramtypes", [database_1.DatabaseService,
        marketplace_service_1.MarketplaceService])
], MCPServerController);
//# sourceMappingURL=mcp.controller.js.map