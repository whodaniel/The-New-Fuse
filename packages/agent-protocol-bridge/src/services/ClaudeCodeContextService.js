"use strict";
/**
 * ClaudeCodeContextService
 * Safely captures and broadcasts Claude Code execution context to TNF Relay
 * WITHOUT interfering with external API connectivity
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ClaudeCodeContextService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeCodeContextService = void 0;
const common_1 = require("@nestjs/common");
const ws_1 = __importDefault(require("ws"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let ClaudeCodeContextService = ClaudeCodeContextService_1 = class ClaudeCodeContextService {
    logger = new common_1.Logger(ClaudeCodeContextService_1.name);
    relayUrl = 'ws://localhost:3001';
    wsClient = null;
    isRelayAvailable = false;
    reconnectInterval = null;
    async onModuleInit() {
        await this.checkRelayHealth();
        if (this.isRelayAvailable) {
            this.connectToRelay();
        }
        else {
            this.logger.warn('TNF Relay not available - context sharing disabled');
            // Set up periodic health check to reconnect when relay becomes available
            this.setupHealthCheck();
        }
    }
    async onModuleDestroy() {
        if (this.reconnectInterval) {
            clearInterval(this.reconnectInterval);
        }
        this.disconnect();
    }
    /**
     * Check if TNF Relay is actually running before attempting connection
     */
    async checkRelayHealth() {
        try {
            const { stdout } = await execAsync('lsof -i :3001 2>/dev/null || echo "not_running"');
            this.isRelayAvailable = !stdout.includes('not_running') && stdout.trim().length > 0;
            return this.isRelayAvailable;
        }
        catch (error) {
            this.logger.debug('TNF Relay health check failed', error);
            this.isRelayAvailable = false;
            return false;
        }
    }
    /**
     * Periodically check if relay becomes available
     */
    setupHealthCheck() {
        this.reconnectInterval = setInterval(async () => {
            const isAvailable = await this.checkRelayHealth();
            if (isAvailable && !this.wsClient) {
                this.logger.log('TNF Relay became available - connecting...');
                this.connectToRelay();
            }
        }, 30000); // Check every 30 seconds
    }
    /**
     * Connect to TNF Relay WebSocket
     */
    connectToRelay() {
        try {
            this.wsClient = new ws_1.default(this.relayUrl);
            this.wsClient.on('open', () => {
                this.logger.log('Connected to TNF Relay for context sharing');
            });
            this.wsClient.on('error', (error) => {
                this.logger.debug('TNF Relay connection error (non-critical)', error.message);
                this.isRelayAvailable = false;
            });
            this.wsClient.on('close', () => {
                this.logger.debug('TNF Relay connection closed');
                this.wsClient = null;
                this.isRelayAvailable = false;
            });
        }
        catch (error) {
            this.logger.debug('Failed to connect to TNF Relay', error);
            this.wsClient = null;
        }
    }
    /**
     * Disconnect from relay
     */
    disconnect() {
        if (this.wsClient) {
            this.wsClient.close();
            this.wsClient = null;
        }
    }
    /**
     * Send execution context to relay (fails gracefully if relay unavailable)
     */
    async sendExecutionContext(context) {
        if (!this.wsClient || this.wsClient.readyState !== ws_1.default.OPEN) {
            this.logger.debug('TNF Relay unavailable - context not shared (non-critical)');
            return;
        }
        try {
            const fullContext = {
                type: 'CLAUDE_CODE_EXECUTION_CONTEXT',
                source: 'claude_code_context_service',
                target: 'claude_desktop',
                content: {
                    action: context.content?.action || 'unknown',
                    timestamp: new Date().toISOString(),
                    user: process.env.USER || 'unknown',
                    shell: process.env.SHELL || 'unknown',
                    ...context.content,
                },
                timestamp: new Date().toISOString(),
                ...context,
            };
            this.wsClient.send(JSON.stringify(fullContext));
            this.logger.debug('Execution context sent to TNF Relay');
        }
        catch (error) {
            this.logger.debug('Failed to send context to relay (non-critical)', error);
        }
    }
    /**
     * Capture current git context
     */
    async captureGitContext() {
        try {
            const { stdout: repo } = await execAsync('basename $(git rev-parse --show-toplevel 2>/dev/null) 2>/dev/null || echo "unknown"');
            const { stdout: branch } = await execAsync('git branch --show-current 2>/dev/null || echo "unknown"');
            return {
                repo: repo.trim(),
                branch: branch.trim(),
            };
        }
        catch {
            return { repo: 'unknown', branch: 'unknown' };
        }
    }
};
exports.ClaudeCodeContextService = ClaudeCodeContextService;
exports.ClaudeCodeContextService = ClaudeCodeContextService = ClaudeCodeContextService_1 = __decorate([
    (0, common_1.Injectable)()
], ClaudeCodeContextService);
//# sourceMappingURL=ClaudeCodeContextService.js.map