import * as vscode from 'vscode';

export enum ErrorCode {
    MCP_INIT_FAILED = 'MCP001',
    TOOL_EXECUTION_FAILED = 'MCP002',
    AGENT_COMMUNICATION_FAILED = 'MCP003',
    CONFIG_INVALID = 'MCP004',
    NETWORK_ERROR = 'MCP005',
    PERMISSION_DENIED = 'MCP006',
    INTEGRATION_FAILED = 'MCP007'
}

export class MCPError extends Error {
    constructor(
        public code: ErrorCode,
        message: string,
        public readonly details?: any
    ) {
        super(`[${code}] ${message}`);
        Object.setPrototypeOf(this, MCPError.prototype);
    }
}

export class ErrorHandler {
    private static instance: ErrorHandler;
    private outputChannel: vscode.OutputChannel;

    private constructor() {
        this.outputChannel = vscode.window.createOutputChannel('The New Fuse Error Log');
    }

    static getInstance(): ErrorHandler {
        if (!ErrorHandler.instance) {
            ErrorHandler.instance = new ErrorHandler();
        }
        return ErrorHandler.instance;
    }

    async handleError(error: Error | MCPError, context?: string): Promise<void> {
        const timestamp = new Date().toISOString();
        const errorCode = error instanceof MCPError ? error.code : 'UNKNOWN';
        
        // Log error
        this.outputChannel.appendLine(`[${timestamp}] ${errorCode}: ${error.message}`);
        if (context) {
            this.outputChannel.appendLine(`Context: ${context}`);
        }
        if (error instanceof MCPError && error.details) {
            this.outputChannel.appendLine(`Details: ${JSON.stringify(error.details, null, 2)}`);
        }
        this.outputChannel.appendLine('---');

        // Show notification
        const viewDetails = 'View Details';
        const result = await vscode.window.showErrorMessage(
            error.message,
            viewDetails
        );

        if (result === viewDetails) {
            this.outputChannel.show();
        }

        // Send telemetry
        await this.sendErrorTelemetry(error, context);
    }

    private async sendErrorTelemetry(error: Error | MCPError, context?: string): Promise<void> {
        // Implementation will be added in telemetry system
    }
}