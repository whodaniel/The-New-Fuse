import * as vscode from 'vscode';
import { MCPStatusView } from '../status-view.js';
import { MCPMonitor } from '../monitoring.js';
import { mock, mockDeep } from 'jest-mock-extended';

describe('MCPStatusView', () => {
    let statusView: MCPStatusView;
    let monitor: MCPMonitor;
    let mockStatusBarItem: vscode.StatusBarItem;
    let mockWebviewPanel: vscode.WebviewPanel;

    beforeEach(() => {
        // Mock VS Code APIs
        mockStatusBarItem = mockDeep<vscode.StatusBarItem>();
        mockWebviewPanel = mockDeep<vscode.WebviewPanel>();
        
        (vscode.window.createStatusBarItem as jest.Mock) = jest.fn().mockReturnValue(mockStatusBarItem);
        (vscode.window.createWebviewPanel as jest.Mock) = jest.fn().mockReturnValue(mockWebviewPanel);

        // Create monitor with mocked output channel
        const mockOutputChannel = mock<vscode.OutputChannel>();
        monitor = new MCPMonitor(mockOutputChannel);

        statusView = new MCPStatusView(monitor);
        jest.useFakeTimers();
    });

    afterEach(() => {
        statusView.dispose();
        jest.useRealTimers();
    });

    describe('Status Bar Updates', () => {
        test('updates status bar on start', () => {
            statusView.start(1000);
            jest.advanceTimersByTime(1000);

            expect(mockStatusBarItem.text).toBeDefined();
            expect(mockStatusBarItem.show).toHaveBeenCalled();
        });

        test('formats status text correctly', () => {
            // Simulate some metrics
            jest.spyOn(monitor, 'getMetrics').mockReturnValue({
                connections: 2,
                messageRate: 150,
                averageLatency: 45,
                errorRate: 0,
                activeTools: 3,
                memoryUsage: 1024 * 1024,
                cpuUsage: 0.5,
                uptime: 60000
            });

            statusView.start(1000);
            jest.advanceTimersByTime(1000);

            expect(mockStatusBarItem.text).toContain('2 conn');
            expect(mockStatusBarItem.text).toContain('150/s');
            expect(mockStatusBarItem.text).toContain('45ms');
        });

        test('shows error indicator when there are errors', () => {
            // Simulate an error alert
            jest.spyOn(monitor, 'getAlerts').mockReturnValue([{
                type: 'error',
                message: 'Test error',
                timestamp: Date.now()
            }]);

            statusView.start(1000);
            jest.advanceTimersByTime(1000);

            expect(mockStatusBarItem.text).toContain('⚠️');
        });

        test('updates status color based on metrics', () => {
            // Simulate high error rate
            jest.spyOn(monitor, 'getMetrics').mockReturnValue({
                connections: 1,
                messageRate: 100,
                averageLatency: 50,
                errorRate: 0.15, // 15% error rate
                activeTools: 1,
                memoryUsage: 1024 * 1024,
                cpuUsage: 0.5,
                uptime: 60000
            });

            statusView.start(1000);
            jest.advanceTimersByTime(1000);

            expect(mockStatusBarItem.backgroundColor).toBeDefined();
        });
    });

    describe('Detailed View', () => {
        test('creates webview panel on showDetailedView', async () => {
            await statusView.showDetailedView();

            expect(vscode.window.createWebviewPanel).toHaveBeenCalledWith(
                'mcpMonitoring',
                'MCP Monitoring',
                vscode.ViewColumn.Two,
                expect.any(Object)
            );
        });

        test('updates webview content periodically', async () => {
            await statusView.showDetailedView();
            jest.advanceTimersByTime(1000);

            expect(mockWebviewPanel.webview.html).toBeDefined();
        });

        test('cleans up when webview is closed', async () => {
            await statusView.showDetailedView();
            
            // Simulate panel close
            const disposeCalls: Function[] = [];
            mockWebviewPanel.onDidDispose.mockImplementation((callback) => {
                disposeCalls.push(callback);
                return { dispose: jest.fn() };
            });

            // Trigger dispose
            disposeCalls.forEach(callback => callback());
            
            jest.advanceTimersByTime(2000);
            
            // Expect no more updates
            const initialHtml = mockWebviewPanel.webview.html;
            jest.advanceTimersByTime(1000);
            expect(mockWebviewPanel.webview.html).toBe(initialHtml);
        });
    });

    describe('Resource Management', () => {
        test('stops updates when disposed', () => {
            statusView.start(1000);
            statusView.dispose();
            
            jest.advanceTimersByTime(2000);
            
            expect(mockStatusBarItem.dispose).toHaveBeenCalled();
        });

        test('handles multiple start/stop cycles', () => {
            statusView.start(1000);
            jest.advanceTimersByTime(1000);
            statusView.stop();
            
            const text1 = mockStatusBarItem.text;
            jest.advanceTimersByTime(1000);
            expect(mockStatusBarItem.text).toBe(text1); // No change
            
            statusView.start(1000);
            jest.advanceTimersByTime(1000);
            expect(mockStatusBarItem.text).not.toBe(text1); // Updated
        });
    });
});