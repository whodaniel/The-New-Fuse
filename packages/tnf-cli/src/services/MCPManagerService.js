"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPManagerService = void 0;
const child_process_1 = require("child_process");
const crypto_1 = require("crypto");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
class MCPManagerService {
    constructor(configDir) {
        this.servers = new Map();
        this.processes = new Map();
        this.credentials = new Map();
        this.configDir = configDir || path.join(os.homedir(), '.config', 'tnf', 'mcp');
        this.loadConfig();
        this.loadCredentials();
    }
    loadConfig() {
        const configPath = path.join(this.configDir, 'mcp.json');
        if (fs.existsSync(configPath)) {
            try {
                const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                if (config.servers) {
                    for (const [name, serverConfig] of Object.entries(config.servers)) {
                        this.servers.set(name, { ...serverConfig, name });
                    }
                }
            }
            catch {
                // Config doesn't exist or is invalid
            }
        }
    }
    loadCredentials() {
        const credPath = path.join(this.configDir, 'credentials.json');
        if (fs.existsSync(credPath)) {
            try {
                const creds = JSON.parse(fs.readFileSync(credPath, 'utf8'));
                for (const [name, cred] of Object.entries(creds)) {
                    this.credentials.set(name, cred);
                }
            }
            catch {
                // Credentials don't exist or are invalid
            }
        }
    }
    saveCredentials() {
        if (!fs.existsSync(this.configDir)) {
            fs.mkdirSync(this.configDir, { recursive: true });
        }
        const credPath = path.join(this.configDir, 'credentials.json');
        const credsObj = {};
        for (const [name, cred] of this.credentials) {
            credsObj[name] = cred;
        }
        fs.writeFileSync(credPath, JSON.stringify(credsObj, null, 2));
    }
    addServer(name, config) {
        const fullConfig = { ...config, name };
        this.servers.set(name, fullConfig);
        this.saveConfig();
    }
    saveConfig() {
        if (!fs.existsSync(this.configDir)) {
            fs.mkdirSync(this.configDir, { recursive: true });
        }
        const configPath = path.join(this.configDir, 'mcp.json');
        const serversObj = {};
        for (const [name, config] of this.servers) {
            serversObj[name] = config;
        }
        fs.writeFileSync(configPath, JSON.stringify({ servers: serversObj }, null, 2));
    }
    removeServer(name) {
        const existed = this.servers.delete(name);
        if (existed) {
            this.saveConfig();
            this.credentials.delete(name);
            this.saveCredentials();
        }
        return existed;
    }
    listServers() {
        const statuses = [];
        for (const [name, config] of this.servers) {
            const running = this.processes.has(name);
            const proc = this.processes.get(name);
            const cred = this.credentials.get(name);
            statuses.push({
                name,
                configured: true,
                running,
                pid: proc?.pid,
                oauth: config.oauth ? {
                    enabled: config.oauth.enabled,
                    authenticated: !!cred && (!cred.expiresAt || cred.expiresAt > Date.now()),
                    expiry: cred?.expiresAt ? new Date(cred.expiresAt).toISOString() : undefined,
                } : undefined,
            });
        }
        return statuses;
    }
    async startServer(name) {
        const config = this.servers.get(name);
        if (!config) {
            throw new Error(`MCP server '${name}' not found`);
        }
        if (config.oauth?.enabled) {
            const cred = this.credentials.get(name);
            if (!cred || (cred.expiresAt && cred.expiresAt <= Date.now())) {
                throw new Error(`MCP server '${name}' requires authentication. Run 'tnf mcp auth ${name}' first.`);
            }
        }
        const proc = (0, child_process_1.spawn)(config.command, config.args || [], {
            cwd: config.cwd,
            env: { ...process.env, ...config.env },
            stdio: ['pipe', 'pipe', 'pipe'],
            detached: true,
        });
        proc.unref();
        return new Promise((resolve, reject) => {
            proc.on('spawn', () => {
                this.processes.set(name, { pid: proc.pid, process: proc });
                resolve({ pid: proc.pid });
            });
            proc.on('error', (err) => {
                reject(err);
            });
        });
    }
    stopServer(name) {
        const proc = this.processes.get(name);
        if (!proc)
            return false;
        try {
            process.kill(proc.pid, 'SIGTERM');
        }
        catch {
            // Process might already be dead
        }
        this.processes.delete(name);
        return true;
    }
    async authenticate(name) {
        const config = this.servers.get(name);
        if (!config) {
            throw new Error(`MCP server '${name}' not found`);
        }
        if (!config.oauth?.enabled) {
            throw new Error(`MCP server '${name}' does not support OAuth`);
        }
        const state = (0, crypto_1.createHash)('sha256').update(`${name}:${Date.now()}`).digest('hex').slice(0, 16);
        if (config.oauth.authorizeUrl) {
            const authorizeUrl = new URL(config.oauth.authorizeUrl);
            authorizeUrl.searchParams.set('state', state);
            authorizeUrl.searchParams.set('redirect_uri', 'http://127.0.0.1:8765/callback');
            if (config.oauth.scopes) {
                authorizeUrl.searchParams.set('scope', config.oauth.scopes.join(' '));
            }
            return { url: authorizeUrl.toString(), code: state };
        }
        throw new Error('OAuth configuration incomplete');
    }
    setCredentials(name, cred) {
        this.credentials.set(name, cred);
        this.saveCredentials();
    }
    getCredentials(name) {
        return this.credentials.get(name);
    }
    logout(name) {
        const existed = this.credentials.delete(name);
        if (existed) {
            this.saveCredentials();
        }
        return existed;
    }
    async debugConnection(name) {
        const config = this.servers.get(name);
        const status = this.listServers().find(s => s.name === name);
        const credential = this.credentials.get(name);
        const diagnostics = [];
        if (!config) {
            diagnostics.push('Server not configured');
        }
        else {
            if (config.command) {
                try {
                    const result = (0, child_process_1.spawnSync)('which', [config.command], { encoding: 'utf8' });
                    if (result.status === 0) {
                        diagnostics.push(`Command found at: ${result.stdout.trim()}`);
                    }
                    else {
                        diagnostics.push(`Command not found: ${config.command}`);
                    }
                }
                catch (e) {
                    diagnostics.push(`Error checking command: ${e.message}`);
                }
            }
            if (config.cwd) {
                if (fs.existsSync(config.cwd)) {
                    diagnostics.push(`Working directory exists: ${config.cwd}`);
                }
                else {
                    diagnostics.push(`Working directory not found: ${config.cwd}`);
                }
            }
            if (config.oauth?.enabled) {
                if (credential) {
                    if (credential.expiresAt && credential.expiresAt <= Date.now()) {
                        diagnostics.push('OAuth token expired');
                    }
                    else {
                        diagnostics.push('OAuth credentials present');
                    }
                }
                else {
                    diagnostics.push('OAuth credentials not found');
                }
            }
        }
        if (status?.running) {
            diagnostics.push(`Server running with PID: ${status.pid}`);
        }
        else {
            diagnostics.push('Server not running');
        }
        return {
            server: config,
            status,
            credential,
            diagnostics,
        };
    }
}
exports.MCPManagerService = MCPManagerService;
//# sourceMappingURL=MCPManagerService.js.map