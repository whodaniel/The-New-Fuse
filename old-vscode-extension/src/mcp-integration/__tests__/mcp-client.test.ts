import { MCPClient } from '../mcp-client.js';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { mock } from 'jest-mock-extended';

// Mock VS Code APIs
jest.mock('vscode', () => ({
    window: {
        createOutputChannel: jest.fn().mockReturnValue({
            appendLine: jest.fn(),
            clear: jest.fn(),
            dispose: jest.fn()
        })
    }
}));

describe('MCPClient', () => {
    let client: MCPClient;
    let mockOutputChannel: vscode.OutputChannel;

    beforeEach(() => {
        mockOutputChannel = mock<vscode.OutputChannel>();
        client = new MCPClient(mockOutputChannel, mockOutputChannel);
    });

    afterEach(async () => {
        await client.cleanup();
    });

    describe('Configuration Loading', () => {
        test('loads valid configuration successfully', async () => {
            const validConfig = {
                mcpServers: {
                    testServer: {
                        command: 'echo',
                        args: ['test']
                    }
                }
            };

            // Mock fs.readFile
            jest.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(validConfig));

            await expect(client.loadServers('test-config.json')).resolves.not.toThrow();
            expect(client.getTools()).toEqual([]);
        });

        test('handles invalid configuration', async () => {
            // Mock fs.readFile with invalid JSON
            jest.spyOn(fs, 'readFile').mockResolvedValue('invalid json');

            await expect(client.loadServers('test-config.json')).rejects.toThrow();
        });
    });

    describe('Server Management', () => {
        test('initializes servers correctly', async () => {
            const validConfig = {
                mcpServers: {
                    testServer: {
                        command: 'echo',
                        args: ['{"jsonrpc": "2.0", "result": {"tools": []}, "id": 1}']
                    }
                }
            };

            jest.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(validConfig));
            await client.loadServers('test-config.json');
            await client.start();

            // Using public property instead of private method
            expect(client.connected).toBe(true);
        });

        test('handles server initialization failures gracefully', async () => {
            const validConfig = {
                mcpServers: {
                    testServer: {
                        command: 'nonexistent-command',
                        args: []
                    }
                }
            };

            jest.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(validConfig));
            await client.loadServers('test-config.json');
            
            // Should not throw, but should log error
            await client.start();
            expect(client.getTools()).toEqual([]);
        });
    });

    describe('Tool Management', () => {
        test('discovers and converts tools correctly', async () => {
            const validConfig = {
                mcpServers: {
                    testServer: {
                        command: 'echo',
                        args: ['{"jsonrpc": "2.0", "result": {"tools": [{"name": "test-tool", "description": "Test tool", "inputSchema": {}}]}, "id": 1}']
                    }
                }
            };

            jest.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(validConfig));
            await client.loadServers('test-config.json');
            await client.start();

            const tools = await client.getTools();
            expect(tools.length).toBe(1);
            expect(tools[0].name).toBe('test-tool');
        });

        test('handles tool execution errors', async () => {
            const validConfig = {
                mcpServers: {
                    testServer: {
                        command: 'echo',
                        args: ['{"jsonrpc": "2.0", "error": {"code": -32000, "message": "Test error"}, "id": 1}']
                    }
                }
            };

            jest.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(validConfig));
            await client.loadServers('test-config.json');
            await client.start();

            const tools = await client.getTools();
            await expect(tools[0].execute({})).rejects.toThrow();
        });
    });

    describe('Analytics', () => {
        test('tracks tool usage when analytics enabled', async () => {
            const validConfig = {
                mcpServers: {
                    testServer: {
                        command: 'echo',
                        args: ['{"jsonrpc": "2.0", "result": "success", "id": 1}']
                    }
                }
            };

            jest.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(validConfig));
            await client.loadServers('test-config.json');
            // Using the correct method name for executing tools
            await client.executeToolByName('test-tool', {});
            // Analytics events should be tracked
            // Note: We can't directly test private analyticsEvents, but we can verify logging
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(expect.stringContaining('test-tool'));
        });
    });

    describe('Cleanup', () => {
        test('cleans up resources properly', async () => {
            const validConfig = {
                mcpServers: {
                    testServer: {
                        command: 'sleep',
                        args: ['1']
                    }
                }
            };

            jest.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(validConfig));
            await client.loadServers('test-config.json');
            await client.start();

            await client.cleanup();
            // Using public property instead of private method
            expect(client.connected).toBe(false);
        });
    });
});