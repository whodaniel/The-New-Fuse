import { MCPManagerImpl } from '../mcp-manager';
import { Logger } from '../../core/logging';
import * as vscode from 'vscode';

jest.mock('vscode');

describe('Context7 Server Integration', () => {
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

    // Mock vscode.extensions.getExtension
    (vscode.extensions.getExtension as jest.Mock).mockReturnValue({
      isActive: true,
      activate: jest.fn().mockResolvedValue(undefined)
    });

    manager = new MCPManagerImpl(mockContext, logger);
  });

  it('should discover context7 server', async () => {
    // Mock successful server discovery
    (vscode.commands.executeCommand as jest.Mock).mockResolvedValue([
      {
        name: 'context7',
        url: 'ws://localhost:7777/mcp'
      }
    ]);

    await manager.initialize();

    const servers = manager.getAllServers();
    const context7Server = servers.find(s => s.id === 'copilot-context7');
    
    expect(context7Server).toBeDefined();
    expect(context7Server?.url).toBe('ws://localhost:7777/mcp');
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Added Copilot Context7 server'));
  });

  it('should handle context7 server connection failure', async () => {
    // Mock failed connection
    (vscode.commands.executeCommand as jest.Mock).mockRejectedValue(new Error('Connection failed'));

    await manager.initialize();
    
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to get Context7 URL'));
  });

  it('should handle missing Copilot extension', async () => {
    // Mock Copilot extension not found
    (vscode.extensions.getExtension as jest.Mock).mockReturnValue(undefined);

    await manager.initialize();
    
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('GitHub Copilot extension not found'));
  });

  it('should configure context7 server with proper error handling', async () => {
    // Mock successful discovery but failed configuration
    (vscode.commands.executeCommand as jest.Mock).mockResolvedValue([
      {
        name: 'context7',
        url: 'ws://localhost:7777/mcp'
      }
    ]);

    // Mock client error during connect
    jest.spyOn(manager as any, 'connectToServer').mockRejectedValue(new Error('Configuration failed'));

    await manager.initialize();

    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Configuration failed'));
  });

  it('should handle context7 URL resolution fallback', async () => {
    // Mock failed command execution but successful fallback
    (vscode.commands.executeCommand as jest.Mock).mockRejectedValue(new Error('Command failed'));

    await manager.initialize();

    const servers = manager.getAllServers();
    const context7Server = servers.find(s => s.id === 'copilot-context7');
    
    // Should fall back to default URL
    expect(context7Server?.url).toBe('ws://localhost:7777/mcp');
  });
});