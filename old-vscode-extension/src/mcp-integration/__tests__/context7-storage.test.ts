import { MCPManagerImpl } from '../mcp-manager';
import { Logger } from '../../core/logging';
import * as vscode from 'vscode';

jest.mock('vscode');

describe('Context7 Storage Management', () => {
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

  it('should save and restore server configuration', async () => {
    const testServer = {
      id: 'copilot-context7',
      name: 'Copilot Context7',
      url: 'ws://localhost:7777/mcp',
      status: 'offline',
      config: {
        version: '1.0',
        tools: [{
          name: 'test-tool',
          description: 'Test tool'
        }]
      }
    };

    // Add server
    manager.addServer(testServer);

    // Verify server was saved
    expect(mockContext.globalState.update).toHaveBeenCalledWith(
      'thefuse.mcpServers',
      expect.arrayContaining([expect.objectContaining({ id: 'copilot-context7' })])
    );

    // Mock stored server data
    (mockContext.globalState.get as jest.Mock).mockReturnValue([testServer]);

    // Create new manager instance to test loading
    const newManager = new MCPManagerImpl(mockContext, logger);
    await newManager.initialize();

    // Verify server was restored
    const loadedServer = newManager.getServer('copilot-context7');
    expect(loadedServer).toBeDefined();
    expect(loadedServer?.config).toEqual(testServer.config);
  });

  it('should update server configuration', async () => {
    const testServer = {
      id: 'copilot-context7',
      name: 'Copilot Context7',
      url: 'ws://localhost:7777/mcp',
      status: 'offline',
      config: {
        version: '1.0',
        tools: []
      }
    };

    // Add server
    manager.addServer(testServer);

    // Update config
    const newConfig = {
      version: '1.1',
      tools: [{
        name: 'new-tool',
        description: 'New tool'
      }]
    };

    await manager.updateServerConfig(testServer.id, newConfig);

    // Verify config was updated
    const updatedServer = manager.getServer(testServer.id);
    expect(updatedServer?.config).toEqual(newConfig);

    // Verify config was saved
    expect(mockContext.globalState.update).toHaveBeenCalledWith(
      'thefuse.mcpServers',
      expect.arrayContaining([
        expect.objectContaining({
          id: testServer.id,
          config: newConfig
        })
      ])
    );
  });

  it('should handle invalid server configurations', async () => {
    // Mock invalid stored data
    (mockContext.globalState.get as jest.Mock).mockReturnValue([
      {
        id: 'invalid-server',
        // Missing required fields
      }
    ]);

    const newManager = new MCPManagerImpl(mockContext, logger);
    await newManager.initialize();

    // Should log error
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Error loading saved servers')
    );

    // Should not load invalid server
    expect(newManager.getServer('invalid-server')).toBeUndefined();
  });

  it('should maintain active server across sessions', async () => {
    const testServer = {
      id: 'copilot-context7',
      name: 'Copilot Context7',
      url: 'ws://localhost:7777/mcp',
      status: 'offline',
      config: {
        version: '1.0',
        tools: []
      }
    };

    // Add server and set as active
    manager.addServer(testServer);
    manager.setActiveServer(testServer.id);

    // Verify active server was saved
    expect(mockContext.globalState.update).toHaveBeenCalledWith(
      'thefuse.activeMCPServer',
      testServer.id
    );

    // Mock stored active server
    (mockContext.globalState.get as jest.Mock)
      .mockReturnValueOnce([testServer]) // For servers
      .mockReturnValueOnce(testServer.id); // For active server

    // Create new manager instance
    const newManager = new MCPManagerImpl(mockContext, logger);
    await newManager.initialize();

    // Verify active server was restored
    expect(newManager.getActiveServer()?.id).toBe(testServer.id);
  });

  it('should handle concurrent configuration updates', async () => {
    const testServer = {
      id: 'copilot-context7',
      name: 'Copilot Context7',
      url: 'ws://localhost:7777/mcp',
      status: 'offline',
      config: {
        version: '1.0',
        tools: []
      }
    };

    // Add server
    manager.addServer(testServer);

    // Simulate concurrent updates
    const update1 = manager.updateServerConfig(testServer.id, {
      version: '1.1',
      tools: [{ name: 'tool1' }]
    });

    const update2 = manager.updateServerConfig(testServer.id, {
      version: '1.2',
      tools: [{ name: 'tool2' }]
    });

    await Promise.all([update1, update2]);

    // Verify final state
    const updatedServer = manager.getServer(testServer.id);
    expect(updatedServer?.config.version).toBe('1.2');
    expect(updatedServer?.config.tools).toEqual([{ name: 'tool2' }]);
  });
});