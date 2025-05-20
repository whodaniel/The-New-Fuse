import * as vscode from 'vscode';
import { MCPClient } from '../../mcp-client';
import { WebSearchMCPServerManager } from '../../web-search-mcp-server';
import { BrowserMCPServerManager } from '../../browser-mcp-server';
import { Context7ServerManager } from '../../context7-server';
import { mock } from 'jest-mock-extended';
import { Logger } from '../../core/logging';

describe('MCP Server Ecosystem Integration', () => {
    let mainClient: MCPClient;
    let webSearchManager: WebSearchMCPServerManager;
    let browserManager: BrowserMCPServerManager;
    let context7Manager: Context7ServerManager;
    let mockOutputChannel: vscode.OutputChannel;
    let mockLogger: jest.Mocked<Logger>;

    beforeEach(async () => {
        mockOutputChannel = mock<vscode.OutputChannel>();
        mockLogger = {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn()
        };

        // Initialize all server managers
        mainClient = new MCPClient(mockOutputChannel);
        webSearchManager = new WebSearchMCPServerManager(mockLogger);
        browserManager = new BrowserMCPServerManager(mockLogger);
        context7Manager = new Context7ServerManager(mockLogger);

        // Create and start all servers
        await Promise.all([
            webSearchManager.createServer(),
            browserManager.createServer(),
            context7Manager.createServer()
        ]);
    });

    afterEach(async () => {
        await Promise.all([
            mainClient.cleanup(),
            webSearchManager.disconnect(),
            browserManager.disconnect(),
            context7Manager.disconnect()
        ]);
    });

    describe('Server Communication', () => {
        test('all servers connect to main MCP server', async () => {
            const servers = await mainClient.getConnectedServers();
            expect(servers).toHaveLength(3);
            expect(servers.map(s => s.id)).toContain('web-search-mcp');
            expect(servers.map(s => s.id)).toContain('browser-mcp');
            expect(servers.map(s => s.id)).toContain('context7');
        });

        test('can route commands between servers', async () => {
            // Simulate web search that stores results in context
            const searchResult = { title: 'Test Result', url: 'http://test.com' };
            await webSearchManager.executeSearch('test query');
            
            // Verify context7 received and stored the result
            const storedContext = await context7Manager.getStoredContext();
            expect(storedContext).toContain(searchResult);

            // Use browser to navigate to stored URL
            await browserManager.navigate(searchResult.url);
            expect(mockLogger.info).toHaveBeenCalledWith(
                expect.stringContaining('Navigating to http://test.com')
            );
        });
    });

    describe('Context Sharing', () => {
        test('context persists between server operations', async () => {
            const testContext = { key: 'testKey', value: 'testValue' };
            
            // Store context
            await context7Manager.storeContext(testContext);

            // Verify web search can access context
            const searchWithContext = await webSearchManager.executeSearchWithContext('query');
            expect(searchWithContext.usedContext).toEqual(testContext);

            // Verify browser can access context
            const browserWithContext = await browserManager.getStoredContext();
            expect(browserWithContext).toEqual(testContext);
        });
    });

    describe('Error Handling', () => {
        test('handles errors across server boundaries', async () => {
            // Simulate server error
            await context7Manager.disconnect();

            // Verify other servers handle missing context gracefully
            const searchResult = await webSearchManager.executeSearchWithContext('query');
            expect(searchResult.error).toContain('Context unavailable');
            expect(mockLogger.warn).toHaveBeenCalled();

            // Verify system remains stable
            const servers = await mainClient.getConnectedServers();
            expect(servers).toHaveLength(2);
        });

        test('recovers from multi-server failures', async () => {
            // Disconnect multiple servers
            await Promise.all([
                context7Manager.disconnect(),
                webSearchManager.disconnect()
            ]);

            // Verify remaining server continues functioning
            const browserStatus = await browserManager.getStatus();
            expect(browserStatus).toBe('online');

            // Reconnect servers
            await Promise.all([
                context7Manager.createServer(),
                webSearchManager.createServer()
            ]);

            // Verify ecosystem recovered
            const servers = await mainClient.getConnectedServers();
            expect(servers).toHaveLength(3);
        });
    });

    describe('Command Chaining', () => {
        test('executes multi-server command chain', async () => {
            // Search -> Store in context -> Navigate
            const result = await webSearchManager.executeSearch('test');
            await context7Manager.storeContext(result);
            await browserManager.navigate(result.url);

            // Verify entire chain completed
            const storedContext = await context7Manager.getStoredContext();
            expect(storedContext).toEqual(result);
            expect(mockLogger.info).toHaveBeenCalledWith(
                expect.stringContaining('Navigation complete')
            );
        });
    });
});