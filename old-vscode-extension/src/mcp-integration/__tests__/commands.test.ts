import * as vscode from 'vscode';
import { MCPCommandHandler } from '../commands.js';
import { mock } from 'jest-mock-extended';

// Mock VS Code APIs
jest.mock('vscode');

describe('MCPCommandHandler', () => {
    let handler: MCPCommandHandler;
    let mockContext: vscode.ExtensionContext;
    let mockProgressReporter: { report: jest.Mock };
    let mockProgress: jest.Mock;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Mock VS Code window APIs
        mockProgressReporter = { report: jest.fn() };
        mockProgress = jest.fn().mockImplementation(async (_, callback) => {
            await callback(mockProgressReporter);
        });
        (vscode.window as any).withProgress = mockProgress;
        (vscode.window as any).showInformationMessage = jest.fn();
        (vscode.window as any).showErrorMessage = jest.fn();
        (vscode.window as any).showWarningMessage = jest.fn();
        (vscode.window as any).showInputBox = jest.fn();
        (vscode.window as any).showQuickPick = jest.fn();
        (vscode.window as any).createOutputChannel = jest.fn().mockReturnValue({
            appendLine: jest.fn(),
            dispose: jest.fn()
        });

        // Mock VS Code commands API
        (vscode.commands as any).registerCommand = jest.fn();

        // Create mock context
        mockContext = {
            subscriptions: [],
            workspaceState: mock<vscode.Memento>(),
            globalState: mock<vscode.Memento>(),
            extensionPath: '/test/path',
            asAbsolutePath: jest.fn(),
            storagePath: '/test/storage',
            globalStoragePath: '/test/global-storage',
            logPath: '/test/log',
            extensionUri: mock<vscode.Uri>(),
            environmentVariableCollection: mock<vscode.EnvironmentVariableCollection>(),
        };

        handler = new MCPCommandHandler();
    });

    describe('initializeMCP', () => {
        test('shows progress during initialization', async () => {
            await handler.initializeMCP();
            
            expect(mockProgress).toHaveBeenCalled();
            expect(mockProgressReporter.report).toHaveBeenCalledWith({
                message: 'Initializing MCP...'
            });
        });

        test('handles initialization errors', async () => {
            // Force an error
            (vscode.window as any).withProgress = jest.fn().mockRejectedValue(
                new Error('Test error')
            );

            await expect(handler.initializeMCP()).rejects.toThrow('Test error');
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('Failed to initialize MCP')
            );
        });
    });

    describe('showTools', () => {
        test('prompts for initialization if MCP is not ready', async () => {
            (vscode.window as any).showWarningMessage.mockResolvedValue('No');
            await handler.showTools();
            
            expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
                'MCP is not initialized. Would you like to initialize it now?',
                'Yes',
                'No'
            );
        });

        test('shows no tools message when no tools available', async () => {
            // Mock initialization
            await handler.initializeMCP();
            await handler.showTools();

            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                'No MCP tools available'
            );
        });
    });

    describe('testTool', () => {
        test('shows error if MCP is not initialized', async () => {
            await handler.testTool();

            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                'MCP is not initialized'
            );
        });

        test('validates JSON input parameters', async () => {
            // Mock initialization and tool selection
            await handler.initializeMCP();
            (vscode.window as any).showQuickPick.mockResolvedValue({
                label: 'test-tool'
            });

            let validateInput: (input: string) => string | null;
            (vscode.window as any).showInputBox.mockImplementation(options => {
                validateInput = options.validateInput;
                return Promise.resolve('{}');
            });

            await handler.testTool();

            // Test JSON validation
            expect(validateInput!('{')).toBe('Invalid JSON');
            expect(validateInput!('{}')).toBeNull();
        });
    });

    describe('askAgent', () => {
        test('requires initialization', async () => {
            await handler.askAgent();

            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                'MCP is not initialized'
            );
        });

        test('sends agent request via WebSocket', async () => {
            // Mock initialization and user input
            await handler.initializeMCP();
            (vscode.window as any).showInputBox.mockResolvedValue('test question');

            await handler.askAgent();

            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                'Request sent to agent. Check the output channel for results.'
            );
        });
    });

    describe('command registration', () => {
        test('registers all commands', () => {
            handler.registerCommands(mockContext);

            expect(vscode.commands.registerCommand).toHaveBeenCalledTimes(4);
            expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
                'thefuse.mcp.initialize',
                expect.any(Function)
            );
            expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
                'thefuse.mcp.showTools',
                expect.any(Function)
            );
            expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
                'thefuse.mcp.testTool',
                expect.any(Function)
            );
            expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
                'thefuse.mcp.askAgent',
                expect.any(Function)
            );
        });
    });

    describe('cleanup', () => {
        test('disposes all resources', () => {
            const mockOutputChannel = {
                dispose: jest.fn()
            };
            (vscode.window as any).createOutputChannel.mockReturnValue(mockOutputChannel);

            const handler = new MCPCommandHandler();
            handler.dispose();

            expect(mockOutputChannel.dispose).toHaveBeenCalled();
        });
    });
});