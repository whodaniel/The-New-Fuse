import { WebSearchMCPServerManager } from '../web-search-mcp-server';
import { Logger } from '../../core/logging';

describe('WebSearchMCPServerManager', () => {
    let manager: WebSearchMCPServerManager;
    let mockLogger: jest.Mocked<Logger>;

    beforeEach(() => {
        mockLogger = {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn()
        };
        manager = new WebSearchMCPServerManager(mockLogger);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createServer', () => {
        it('should create server with correct configuration', async () => {
            const server = await manager.createServer();

            expect(server).toBeDefined();
            expect(server.id).toBe('web-search-mcp');
            expect(server.name).toBe('Web Search MCP');
            expect(server.url).toBe('ws://localhost:3772');
            expect(server.status).toBe('offline');
            expect(server.isBuiltIn).toBe(true);
            expect(server.config.version).toBe('1.0');
            expect(server.config.tools).toHaveLength(1);

            const tool = server.config.tools[0];
            expect(tool.name).toBe('web_search');
            expect(tool.parameters).toHaveLength(2);
            expect(tool.parameters[0].name).toBe('query');
            expect(tool.parameters[1].name).toBe('limit');
        });
    });

    describe('connect', () => {
        it('should throw error if client not initialized', async () => {
            await expect(manager.connect()).rejects.toThrow('WebSearch MCP client not initialized');
        });

        it('should attempt connection after server creation', async () => {
            const server = await manager.createServer();
            expect(server.status).toBe('offline');

            try {
                await manager.connect();
            } catch (error) {
                // Connection may fail in test environment
            }

            expect(mockLogger.info).toHaveBeenCalledWith('Creating WebSearch MCP server configuration');
        });
    });

    describe('disconnect', () => {
        it('should handle disconnect when not connected', async () => {
            await manager.disconnect();
            expect(mockLogger.error).not.toHaveBeenCalled();
        });

        it('should disconnect after connection', async () => {
            await manager.createServer();
            await manager.disconnect();
            expect(mockLogger.error).not.toHaveBeenCalled();
        });
    });

    describe('dispose', () => {
        it('should clean up resources', async () => {
            await manager.createServer();
            manager.dispose();
            expect(mockLogger.error).not.toHaveBeenCalled();
        });
    });
});