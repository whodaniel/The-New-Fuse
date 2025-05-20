import { MCPManagerImpl } from '../mcp-manager';
import { Logger } from '../../core/logging';
import * as vscode from 'vscode';

jest.mock('vscode');

describe('Context7 Error Handling', () => {
  let mockContext: vscode.ExtensionContext;
  let logger: Logger;
  let manager: MCPManagerImpl;

  beforeEach(() => {
    // Mock vscode.ExtensionContext
    mockContext = {
      subscriptions: [],
      globalState: {
        get: jest.fn(),
        update: jest.fn()
      }
    } as unknown as vscode.ExtensionContext;

    // Mock logger
    logger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    };

    // Mock vscode.window.createStatusBarItem
    (vscode.window.createStatusBarItem as jest.Mock).mockReturnValue({
      show: jest.fn(),
      hide: jest.fn(),
      dispose: jest.fn()
    });

    manager = new MCPManagerImpl(mockContext, logger);
  });

  it('should handle connection timeout errors', async () => {
    const server = {
      id: 'copilot-context7',
      name: 'Copilot Context7',
      url: 'ws://localhost:7777/mcp',
      status: 'offline',
      config: {
        version: '1.0',
        tools: []
      }
    };

    manager.addServer(server);

    // Mock client connection timeout
    jest.spyOn(manager as any, 'connectToServer').mockRejectedValue(new Error('Connection timeout'));

    try {
      await manager.connectToServer(server.id);
    } catch (error) {
      expect(error.message).toBe('Connection timeout');
    }

    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Connection timeout'));
    
    const updatedServer = manager.getServer(server.id);
    expect(updatedServer?.status).toBe('error');
  });

  it('should handle configuration validation errors', async () => {
    const server = {
      id: 'copilot-context7',
      name: 'Copilot Context7',
      url: 'ws://localhost:7777/mcp',
      status: 'offline',
      config: {
        version: '1.0',
        tools: []
      }
    };

    manager.addServer(server);

    // Try to update with invalid config
    const invalidConfig = {
      version: '1.0',
      // Missing required tools array
    };

    await expect(manager.updateServerConfig(server.id, invalidConfig as any))
      .rejects.toThrow();

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Invalid server configuration')
    );
  });

  it('should handle websocket connection errors', async () => {
    // Mock WebSocket to throw error
    const mockWebSocket = {
      addEventListener: jest.fn((event, handler) => {
        if (event === 'error') {
          handler(new Error('WebSocket connection failed'));
        }
      }),
      removeEventListener: jest.fn(),
      close: jest.fn()
    };
    
    global.WebSocket = jest.fn().mockImplementation(() => mockWebSocket);

    const server = {
      id: 'copilot-context7',
      name: 'Copilot Context7',
      url: 'ws://localhost:7777/mcp',
      status: 'offline',
      config: {
        version: '1.0',
        tools: []
      }
    };

    manager.addServer(server);

    try {
      await manager.connectToServer(server.id);
    } catch (error) {
      expect(error.message).toContain('WebSocket connection failed');
    }

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('WebSocket connection failed')
    );
  });

  it('should handle server disconnection errors', async () => {
    const server = {
      id: 'copilot-context7',
      name: 'Copilot Context7',
      url: 'ws://localhost:7777/mcp',
      status: 'online',
      config: {
        version: '1.0',
        tools: []
      }
    };

    manager.addServer(server);

    // Mock client disconnect error
    jest.spyOn(manager as any, 'disconnectFromServer').mockImplementation(() => {
      throw new Error('Disconnect failed');
    });

    manager.disconnectFromServer(server.id);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Disconnect failed')
    );
  });

  it('should handle tool execution errors', async () => {
    const server = {
      id: 'copilot-context7',
      name: 'Copilot Context7',
      url: 'ws://localhost:7777/mcp',
      status: 'online',
      config: {
        version: '1.0',
        tools: [{
          name: 'test-tool',
          description: 'Test tool'
        }]
      }
    };

    manager.addServer(server);

    // Mock tool execution error
    jest.spyOn(manager as any, 'executeTool').mockRejectedValue(
      new Error('Tool execution failed')
    );

    try {
      await manager.executeTool(server.id, 'test-tool', {});
    } catch (error) {
      expect(error.message).toBe('Tool execution failed');
    }

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Tool execution failed')
    );
  });

  it('should handle concurrent connection attempts', async () => {
    const server = {
      id: 'copilot-context7',
      name: 'Copilot Context7',
      url: 'ws://localhost:7777/mcp',
      status: 'offline',
      config: {
        version: '1.0',
        tools: []
      }
    };

    manager.addServer(server);

    // Attempt multiple concurrent connections
    const connection1 = manager.connectToServer(server.id);
    const connection2 = manager.connectToServer(server.id);

    await expect(Promise.all([connection1, connection2]))
      .rejects.toThrow();

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Connection already in progress')
    );
  });

  it('should recover from error state on successful reconnection', async () => {
    const server = {
      id: 'copilot-context7',
      name: 'Copilot Context7',
      url: 'ws://localhost:7777/mcp',
      status: 'error',
      config: {
        version: '1.0',
        tools: []
      }
    };

    manager.addServer(server);

    // Mock successful connection
    jest.spyOn(manager as any, 'connectToServer').mockResolvedValue(true);

    await manager.connectToServer(server.id);

    const updatedServer = manager.getServer(server.id);
    expect(updatedServer?.status).toBe('online');
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Successfully reconnected')
    );
  });
});