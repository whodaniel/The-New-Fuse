import * as vscode from 'vscode';
import { MCPManager } from '../mcp-integration/mcp-manager.js';
import { AICoderRole } from '../ai-coder-integration.js';
export declare class AICoderIntegrationManager {
    private mcpManager;
    private context;
    private logger;
    private monitor;
    private activeCoders;
    constructor(mcpManager: MCPManager, context: vscode.ExtensionContext);
    private initializeCoders;
    activateCoder(role: AICoderRole): Promise<void>;
    deactivateCoder(role: AICoderRole): Promise<void>;
    private getActiveCoders;
}
//# sourceMappingURL=integration-manager.d.ts.map