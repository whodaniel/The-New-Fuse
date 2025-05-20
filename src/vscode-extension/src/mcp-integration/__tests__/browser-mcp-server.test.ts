import { BrowserMCPServerManager } from '../browser-mcp-server';
import { Logger } from '../../core/logging';

jest.mock('@browsermcp/mcp', () => ({
  BrowserMCPClient: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined)
  }))
}));

describe('BrowserMCPServerManager', () => {
  let logger: Logger;
  let manager: BrowserMCPServerManager;

  beforeEach(() => {
    logger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    };
    manager = new BrowserMCPServerManager(logger);
  });

  it('should create server configuration', async () => {
    const server = await manager.createServer();
    expect(server).toBeDefined();
    expect(server.id).toBe('browser-mcp');
    expect(server.name).toBe('Browser MCP');
    expect(server.url).toBe('ws://localhost:3772');
    expect(server.status).toBe('offline');
    expect(server.isBuiltIn).toBe(true);
  });

  it('should connect successfully', async () => {
    await manager.createServer();
    await expect(manager.connect()).resolves.not.toThrow();
    expect(logger.info).toHaveBeenCalledWith('BrowserMCP client connected');
  });

  it('should disconnect successfully', async () => {
    await manager.createServer();
    await manager.connect();
    await expect(manager.disconnect()).resolves.not.toThrow();
  });

  it('should handle connection errors', async () => {
    const error = new Error('Connection failed');
    jest.spyOn(manager as any, 'browserMCPClient').mockImplementation(() => ({
      connect: jest.fn().mockRejectedValue(error)
    }));

    await manager.createServer();
    await expect(manager.connect()).rejects.toThrow('Connection failed');
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Connection failed'));
  });

  it('should dispose of resources', async () => {
    await manager.createServer();
    await manager.connect();
    manager.dispose();
    expect(logger.error).not.toHaveBeenCalled();
  });
});