import { WebSocketServer } from 'ws';
import { MCPWebSocketProtocol } from '../websocket-protocol.js';
import { mock } from 'jest-mock-extended';
import * as vscode from 'vscode';

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

describe('MCPWebSocketProtocol', () => {
    let wsServer: WebSocketServer;
    let protocol: MCPWebSocketProtocol;
    let mockOutputChannel: vscode.OutputChannel;
    const TEST_PORT = 8181;

    beforeEach(() => {
        wsServer = new WebSocketServer({ port: TEST_PORT });
        mockOutputChannel = mock<vscode.OutputChannel>();
        protocol = new MCPWebSocketProtocol({
            url: `ws://localhost:${TEST_PORT}`,
            outputChannel: mockOutputChannel
        });
    });

    afterEach((done) => {
        protocol.disconnect();
        wsServer.close(() => done());
    });

    describe('Connection Management', () => {
        test('connects successfully', async () => {
            await expect(protocol.connect()).resolves.toBe(true);
            expect(protocol.isConnected()).toBe(true);
        });

        test('handles connection failure gracefully', async () => {
            wsServer.close(); // Close server to force connection failure
            await expect(protocol.connect()).resolves.toBe(false);
            expect(protocol.isConnected()).toBe(false);
        });

        test('implements heartbeat mechanism', async () => {
            await protocol.connect();
            
            // Mock Date.now for consistent testing
            const realDateNow = Date.now;
            const mockNow = jest.fn();
            global.Date.now = mockNow;

            try {
                // Simulate time passing without heartbeat
                mockNow.mockReturnValue(realDateNow() + 35000); // Past heartbeat timeout
                expect(protocol.isConnected()).toBe(false);

                // Simulate receiving heartbeat
                mockNow.mockReturnValue(realDateNow());
                wsServer.clients.forEach(client => {
                    client.send(JSON.stringify({ type: 'heartbeat' }));
                });
                expect(protocol.isConnected()).toBe(true);
            } finally {
                global.Date.now = realDateNow;
            }
        });

        test('handles reconnection', async () => {
            await protocol.connect();
            wsServer.close(() => {
                wsServer = new WebSocketServer({ port: TEST_PORT });
            });
            
            // Wait for reconnection
            await new Promise(resolve => setTimeout(resolve, 2000));
            expect(protocol.isConnected()).toBe(true);
        });
    });

    describe('Message Handling', () => {
        test('sends and receives messages', (done) => {
            const testMessage = { type: 'test', data: { foo: 'bar' } };
            
            wsServer.on('connection', (ws) => {
                ws.on('message', (data) => {
                    const message = JSON.parse(data.toString());
                    expect(message).toEqual(testMessage);
                    done();
                });
            });

            protocol.connect().then(() => {
                protocol.sendMessage(testMessage);
            });
        });

        test('handles malformed messages gracefully', async () => {
            await protocol.connect();
            
            wsServer.clients.forEach(client => {
                client.send('invalid json');
            });

            // Should log error but not crash
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                expect.stringContaining('Error parsing message')
            );
        });

        test('handles message handlers', (done) => {
            const testMessage = { type: 'test', data: { foo: 'bar' } };
            
            protocol.onMessage('test', (message) => {
                expect(message.data).toEqual({ foo: 'bar' });
                done();
            });

            protocol.connect().then(() => {
                wsServer.clients.forEach(client => {
                    client.send(JSON.stringify(testMessage));
                });
            });
        });
    });

    describe('Error Handling', () => {
        test('handles connection errors', async () => {
            const badProtocol = new MCPWebSocketProtocol({
                url: 'ws://nonexistent:9999',
                outputChannel: mockOutputChannel
            });

            await expect(badProtocol.connect()).resolves.toBe(false);
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                expect.stringContaining('Error')
            );
        });

        test('handles send errors', async () => {
            await protocol.connect();
            wsServer.close(); // Force disconnection

            // Should log error but not throw
            protocol.sendMessage({ type: 'test' });
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                expect.stringContaining('Error sending message')
            );
        });
    });

    describe('Resource Management', () => {
        test('cleans up resources on disconnect', async () => {
            await protocol.connect();
            protocol.disconnect();

            expect(protocol.isConnected()).toBe(false);
            // Verify no memory leaks by checking internal state
            expect(protocol.getHandlerCount()).toBe(0);
        });

        test('handles multiple connect/disconnect cycles', async () => {
            for (let i = 0; i < 3; i++) {
                await protocol.connect();
                expect(protocol.isConnected()).toBe(true);
                protocol.disconnect();
                expect(protocol.isConnected()).toBe(false);
            }
        });
    });

    describe('Performance Benchmarks', () => {
        test('message roundtrip time', async () => {
            await protocol.connect();
            
            const start = Date.now();
            const promises: Promise<void>[] = [];

            // Send 100 messages in quick succession
            for (let i = 0; i < 100; i++) {
                promises.push(
                    new Promise((resolve) => {
                        protocol.onMessage(`test-${i}`, () => resolve());
                        protocol.sendMessage({ type: `test-${i}`, data: { index: i } });
                    })
                );
            }

            await Promise.all(promises);
            const duration = Date.now() - start;
            
            // Log performance metric
            console.log(`Message roundtrip benchmark: ${duration}ms for 100 messages`);
            // Average roundtrip should be reasonable
            expect(duration).toBeLessThan(1000); // Less than 1 second total
        });
    });
});