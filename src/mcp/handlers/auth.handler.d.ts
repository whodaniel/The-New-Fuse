/**
 * Authentication handler for MCP server
 * Handles login, registration, logout, and token management
 */
import { McpTool, ToolCallResult } from '../types';
import { BaseHandler } from './base.handler';
export declare class AuthHandler extends BaseHandler {
    getTools(): McpTool[];
    getToolPrefix(): string;
    handleTool(toolName: string, args: any): Promise<ToolCallResult>;
    private handleLogin;
    private handleRegister;
    private handleRefresh;
    private handleLogout;
    private handleSetCredentials;
}
//# sourceMappingURL=auth.handler.d.ts.map