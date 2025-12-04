var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { z } from 'zod';
/**
 * Schema for an MCP marketplace server
 */
var mcpMarketplaceServerSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    version: z.string(),
    publisher: z.string(),
    category: z.string(),
    rating: z.number(),
    downloads: z.number(),
    lastUpdated: z.string(),
    installCommand: z.string(),
    args: z.array(z.string()),
    capabilities: z.array(z.string()),
    requiresConfiguration: z.boolean(),
    configurationSchema: z.object({
        type: z.string(),
        required: z.array(z.string()).optional(),
        properties: z.record(z.any())
    }).optional()
});
/**
 * Service for interacting with the MCP marketplace
 */
var MCPMarketplaceService = /** @class */ (function () {
    function MCPMarketplaceService() {
        this.cacheExpiryMs = 3600000; // 1 hour in milliseconds
        this.cachedServers = null;
        this.apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    }
    /**
     * Fetches all MCP servers from the marketplace
     * @returns A list of marketplace MCP servers
     */
    MCPMarketplaceService.prototype.getServers = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, data, servers, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Check cache first
                        if (this.cachedServers && Date.now() - this.cachedServers.timestamp < this.cacheExpiryMs) {
                            return [2 /*return*/, this.cachedServers.servers];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, fetch("".concat(this.apiBaseUrl, "/mcp/marketplace/servers"))];
                    case 2:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Failed to fetch MCP marketplace servers: ".concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 3:
                        data = _a.sent();
                        servers = data.map(function (server) { return mcpMarketplaceServerSchema.parse(server); });
                        // Cache the result
                        this.cachedServers = {
                            timestamp: Date.now(),
                            servers: servers
                        };
                        return [2 /*return*/, servers];
                    case 4:
                        error_1 = _a.sent();
                        console.error('Error fetching MCP marketplace servers:', error_1);
                        // Return mock data for development
                        return [2 /*return*/, this.getMockServers()];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Searches for MCP servers in the marketplace
     * @param query The search query
     * @returns A list of matching marketplace MCP servers
     */
    MCPMarketplaceService.prototype.searchServers = function (query) {
        return __awaiter(this, void 0, void 0, function () {
            var allServers, lowerQuery_1, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.getServers()];
                    case 1:
                        allServers = _a.sent();
                        if (!query)
                            return [2 /*return*/, allServers];
                        lowerQuery_1 = query.toLowerCase();
                        return [2 /*return*/, allServers.filter(function (server) {
                                return server.name.toLowerCase().includes(lowerQuery_1) ||
                                    server.description.toLowerCase().includes(lowerQuery_1) ||
                                    server.publisher.toLowerCase().includes(lowerQuery_1) ||
                                    server.category.toLowerCase().includes(lowerQuery_1) ||
                                    server.capabilities.some(function (cap) { return cap.toLowerCase().includes(lowerQuery_1); });
                            })];
                    case 2:
                        error_2 = _a.sent();
                        console.error('Error searching MCP marketplace servers:', error_2);
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Fetches a specific MCP server from the marketplace
     * @param id The server ID
     * @returns The marketplace MCP server
     */
    MCPMarketplaceService.prototype.getServer = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var allServers, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.getServers()];
                    case 1:
                        allServers = _a.sent();
                        return [2 /*return*/, allServers.find(function (server) { return server.id === id; }) || null];
                    case 2:
                        error_3 = _a.sent();
                        console.error("Error fetching MCP marketplace server ".concat(id, ":"), error_3);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Installs an MCP server from the marketplace
     * @param id The server ID
     * @param config Optional configuration parameters
     * @returns True if successful
     */
    MCPMarketplaceService.prototype.installServer = function (id, config) {
        return __awaiter(this, void 0, void 0, function () {
            var server, payload, response, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.getServer(id)];
                    case 1:
                        server = _a.sent();
                        if (!server) {
                            throw new Error("Server with ID ".concat(id, " not found in marketplace"));
                        }
                        payload = {
                            serverId: id,
                            configuration: config || {}
                        };
                        return [4 /*yield*/, fetch("".concat(this.apiBaseUrl, "/mcp/servers/install"), {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(payload)
                            })];
                    case 2:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Failed to install MCP server: ".concat(response.statusText));
                        }
                        return [2 /*return*/, true];
                    case 3:
                        error_4 = _a.sent();
                        console.error("Error installing MCP marketplace server ".concat(id, ":"), error_4);
                        // For development, simulate success
                        return [2 /*return*/, true];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Gets mock servers for development
     * @returns A list of mock marketplace MCP servers
     */
    MCPMarketplaceService.prototype.getMockServers = function () {
        return [
            {
                id: 'vscode-mcp-server',
                name: 'VS Code MCP Server',
                description: 'Enables AI agents to interact with Visual Studio Code through the Model Context Protocol',
                version: '1.2.0',
                publisher: 'MCP Foundation',
                category: 'Development Tools',
                rating: 4.8,
                downloads: 12503,
                lastUpdated: '2025-04-01',
                installCommand: 'npx',
                args: ['@modelcontextprotocol/vscode-mcp-server'],
                capabilities: ['Code editing', 'File operations', 'Terminal commands', 'Diagnostics'],
                requiresConfiguration: false
            },
            {
                id: 'filesystem-mcp-server',
                name: 'Filesystem MCP Server',
                description: 'Provides secure filesystem access for AI agents through the Model Context Protocol',
                version: '0.9.5',
                publisher: 'MCP Foundation',
                category: 'File Management',
                rating: 4.6,
                downloads: 8921,
                lastUpdated: '2025-03-15',
                installCommand: 'npx',
                args: ['@modelcontextprotocol/server-filesystem', '--allow-dir', './data'],
                capabilities: ['File read', 'File write', 'Directory listing', 'File search'],
                requiresConfiguration: true,
                configurationSchema: {
                    type: 'object',
                    required: ['allowedDirectories'],
                    properties: {
                        allowedDirectories: {
                            type: 'string',
                            description: 'Comma-separated list of directories to allow access to'
                        },
                        readOnly: {
                            type: 'boolean',
                            description: 'Whether to allow only read operations'
                        }
                    }
                }
            },
            {
                id: 'shell-mcp-server',
                name: 'Shell MCP Server',
                description: 'Provides secure shell command execution for AI agents through MCP',
                version: '0.8.2',
                publisher: 'MCP Community',
                category: 'System Tools',
                rating: 4.3,
                downloads: 6254,
                lastUpdated: '2025-03-10',
                installCommand: 'npx',
                args: ['@modelcontextprotocol/server-shell', '--allow-commands', 'ls,cat,echo'],
                capabilities: ['Command execution', 'Process management'],
                requiresConfiguration: true,
                configurationSchema: {
                    type: 'object',
                    required: ['allowedCommands'],
                    properties: {
                        allowedCommands: {
                            type: 'string',
                            description: 'Comma-separated list of allowed commands'
                        },
                        timeoutSeconds: {
                            type: 'number',
                            description: 'Maximum execution time for commands (in seconds)'
                        }
                    }
                }
            },
            {
                id: 'browser-mcp-server',
                name: 'Browser MCP Server',
                description: 'Allows AI agents to browse and interact with web content through MCP',
                version: '1.0.0',
                publisher: 'Web Agents Inc.',
                category: 'Web',
                rating: 4.5,
                downloads: 7829,
                lastUpdated: '2025-04-10',
                installCommand: 'npx',
                args: ['@modelcontextprotocol/server-browser'],
                capabilities: ['Web browsing', 'HTML parsing', 'Form filling', 'Screenshot capture'],
                requiresConfiguration: false
            },
            {
                id: 'database-mcp-server',
                name: 'Database MCP Server',
                description: 'Provides database access for AI agents through the Model Context Protocol',
                version: '0.7.1',
                publisher: 'Data Solutions',
                category: 'Databases',
                rating: 4.2,
                downloads: 3845,
                lastUpdated: '2025-02-28',
                installCommand: 'npx',
                args: ['@modelcontextprotocol/server-database'],
                capabilities: ['SQL query execution', 'Schema inspection', 'Result formatting'],
                requiresConfiguration: true,
                configurationSchema: {
                    type: 'object',
                    required: ['connectionString', 'databaseType'],
                    properties: {
                        connectionString: {
                            type: 'string',
                            description: 'Database connection string'
                        },
                        databaseType: {
                            type: 'string',
                            description: 'Type of database (mysql, postgres, sqlite)'
                        },
                        maxRows: {
                            type: 'number',
                            description: 'Maximum number of rows to return'
                        }
                    }
                }
            },
            {
                id: 'code-as-mcp-server',
                name: 'VSCode as MCP Server',
                description: 'Turns your VSCode into an MCP server, enabling advanced coding assistance from MCP clients',
                version: '1.0.2',
                publisher: 'acomagu',
                category: 'Development Tools',
                rating: 4.9,
                downloads: 322,
                lastUpdated: '2025-04-15',
                installCommand: 'npx',
                args: ['vscode-as-mcp-server'],
                capabilities: ['Code editing', 'Terminal operations', 'Preview tools', 'Multi-instance switching'],
                requiresConfiguration: false
            }
        ];
    };
    return MCPMarketplaceService;
}());
export { MCPMarketplaceService };
