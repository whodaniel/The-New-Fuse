import * as vscode from 'vscode';
import { MCPClient } from '../../mcp-client.js';
import { MCPWebSocketProtocol } from '../../websocket-protocol.js';
import { WebSocketServer } from 'ws';
import { mock } from 'jest-mock-extended';

describe('MCP Server Integration', () => {
    let client: MCPClient;
    let wsServer: WebSocketServer;
    let mockOutputChannel: vscode.OutputChannel;
    const TEST_PORT = 8282;

    beforeEach(() => {
        wsServer = new WebSocketServer({ port: TEST_PORT });
        mockOutputChannel = mock<vscode.OutputChannel>();
        client = new MCPClient(mockOutputChannel);
    });

    afterEach(async () => {
        await client.cleanup();
        await new Promise<void>((resolve) => wsServer.close(() => resolve()));
    });

    describe('Server Connection', () => {
        test('establishes connection with proper handshake', async () => {
            // Setup mock config
            const mockConfig = {
                mcpServers: {
                    test: {
                        command: 'echo',
                        args: ['{"jsonrpc":"2.0","result":{"tools":[]},"id":1}']
                    }
                }
            };

            // Test connection
            let connected = false;
            wsServer.on('connection', () => {
                connected = true;
            });

            await client.loadServers(JSON.stringify(mockConfig));
            await client.start();

            expect(connected).toBe(true);
        });

        test('handles multiple server connections', async () => {
            const mockConfig = {
                mcpServers: {
                    server1: {
                        command: 'echo',
                        args: ['{"jsonrpc":"2.0","result":{"tools":[]},"id":1}']
                    },
                    server2: {
                        command: 'echo',
                        args: ['{"jsonrpc":"2.0","result":{"tools":[]},"id":1}']
                    }
                }
            };

            let connections = 0;
            wsServer.on('connection', () => {
                connections++;
            });

            await client.loadServers(JSON.stringify(mockConfig));
            await client.start();

            expect(connections).toBe(2);
        });
    });

    describe('Tool Discovery', () => {
        test('discovers and registers tools from all servers', async () => {
            const mockConfig = {
                mcpServers: {
                    server1: {
                        command: 'echo',
                        args: ['{"jsonrpc":"2.0","result":{"tools":[{"name":"tool1","description":"Test Tool 1","inputSchema":{}}]},"id":1}']
                    },
                    server2: {
                        command: 'echo',
                        args: ['{"jsonrpc":"2.0","result":{"tools":[{"name":"tool2","description":"Test Tool 2","inputSchema":{}}]},"id":1}']
                    }
                }
            };

            await client.loadServers(JSON.stringify(mockConfig));
            await client.start();

            const tools = await client.getTools();
            expect(tools.length).toBe(2);
            expect(tools.map((t: any) => t.name)).toContain('tool1');
            expect(tools.map((t: any) => t.name)).toContain('tool2');
        });
    });

    describe('Message Handling', () => {
        test('routes messages to correct handlers', (done) => {
            const protocol = new MCPWebSocketProtocol({
                url: `ws://localhost:${TEST_PORT}`,
                outputChannel: mockOutputChannel
            });

            wsServer.on('connection', (ws) => {
                ws.on('message', (data) => {
                    const message = JSON.parse(data.toString());
                    if (message.type === 'test') {
                        ws.send(JSON.stringify({
                            type: 'response',
                            data: { received: true }
                        }));
                    }
                });
            });

            protocol.connect().then(() => {
                protocol.onMessage('response', (message) => {
                    expect(message.data.received).toBe(true);
                    done();
                });

                protocol.sendMessage({ type: 'test' });
            });
        });
    });

    describe('Performance', () => {
        test('handles high message throughput', async () => {
            const protocol = new MCPWebSocketProtocol({
                url: `ws://localhost:${TEST_PORT}`,
                outputChannel: mockOutputChannel
            });

            await protocol.connect();

            const NUM_MESSAGES = 1000;
            const start = Date.now();
            const promises: Promise<void>[] = [];

            wsServer.on('connection', (ws) => {
                ws.on('message', (data) => {
                    ws.send(data); // Echo back
                });
            });

            // Send messages in parallel
            for (let i = 0; i < NUM_MESSAGES; i++) {
                promises.push(
                    new Promise((resolve) => {
                        protocol.onMessage(`test-${i}`, () => resolve());
                        protocol.sendMessage({
                            type: `test-${i}`,
                            data: { index: i }
                        });
                    })
                );
            }

            await Promise.all(promises);
            const duration = Date.now() - start;

            // Log performance metrics
            console.log(`Performance test results:
- Total messages: ${NUM_MESSAGES}
- Total time: ${duration}ms
- Messages per second: ${Math.round(NUM_MESSAGES / (duration / 1000))}
- Average latency: ${Math.round(duration / NUM_MESSAGES)}ms per message`);

            // Assert reasonable performance
            expect(duration).toBeLessThan(5000); // Should process 1000 messages in under 5 seconds
        });

        test('maintains stability under load', async () => {
            const protocol = new MCPWebSocketProtocol({
                url: `ws://localhost:${TEST_PORT}`,
                outputChannel: mockOutputChannel
            });

            await protocol.connect();

            // Track message success rate
            let sent = 0;
            let received = 0;

            wsServer.on('connection', (ws) => {
                ws.on('message', () => {
                    ws.send(JSON.stringify({
                        type: 'response',
                        data: { index: sent }
                    }));
                });
            });

            protocol.onMessage('response', () => {
                received++;
            });

            // Send messages continuously for 5 seconds
            const start = Date.now();
            while (Date.now() - start < 5000) {
                protocol.sendMessage({
                    type: 'test',
                    data: { index: sent }
                });
                sent++;
                // Small delay to prevent overwhelming
                await new Promise(resolve => setTimeout(resolve, 1));
            }

            // Wait for remaining messages
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Log stability metrics
            console.log(`Stability test results:
- Messages sent: ${sent}
- Messages received: ${received}
- Success rate: ${((received / sent) * 100).toFixed(2)}%
- Duration: 5 seconds
- Average throughput: ${Math.round(received / 5)} messages/second`);

            // Assert high success rate
            expect(received / sent).toBeGreaterThan(0.95); // >95% success
        });
    });

    describe('Error Recovery', () => {
        test('recovers from connection drops', async () => {
            const protocol = new MCPWebSocketProtocol({
                url: `ws://localhost:${TEST_PORT}`,
                outputChannel: mockOutputChannel,
                reconnectDelay: 100 // Fast reconnect for testing
            });

            await protocol.connect();
            expect(protocol.isConnected()).toBe(true);

            // Force disconnect
            wsServer.close();
            await new Promise(resolve => setTimeout(resolve, 200));
            expect(protocol.isConnected()).toBe(false);

            // Restart server
            wsServer = new WebSocketServer({ port: TEST_PORT });
            await new Promise(resolve => setTimeout(resolve, 200));
            expect(protocol.isConnected()).toBe(true);
        });

        test('maintains message order during reconnection', async () => {
            const protocol = new MCPWebSocketProtocol({
                url: `ws://localhost:${TEST_PORT}`,
                outputChannel: mockOutputChannel,
                reconnectDelay: 100
            });

            const receivedMessages: number[] = [];
            protocol.onMessage('test', (message) => {
                receivedMessages.push(message.data.index);
            });

            await protocol.connect();

            // Send some messages
            for (let i = 0; i < 5; i++) {
                protocol.sendMessage({
                    type: 'test',
                    data: { index: i }
                });
            }

            // Force reconnection
            wsServer.close();
            wsServer = new WebSocketServer({ port: TEST_PORT });
            await new Promise(resolve => setTimeout(resolve, 200));

            // Send more messages
            for (let i = 5; i < 10; i++) {
                protocol.sendMessage({
                    type: 'test',
                    data: { index: i }
                });
            }

            // Verify message order
            expect(receivedMessages).toEqual([...Array(10).keys()]);
        });
    });
});