import * as vscode from 'vscode';
import { MCPMonitor } from '../monitoring.js';
import { mock } from 'jest-mock-extended';
import { EventEmitter } from 'events';

describe('MCPMonitor', () => {
    let monitor: MCPMonitor;
    let mockOutputChannel: vscode.OutputChannel;

    beforeEach(() => {
        mockOutputChannel = mock<vscode.OutputChannel>();
        // Use a factory method instead of private constructor
        monitor = MCPMonitor.create(mockOutputChannel);
        jest.useFakeTimers();
    });

    afterEach(() => {
        monitor.dispose();
        jest.useRealTimers();
    });

    describe('Metric Collection', () => {
        test('initializes with default metrics', () => {
            const metrics = monitor.getMetrics();
            expect(metrics).toEqual({
                connections: 0,
                activeTools: 0,
                messageRate: 0,
                errorRate: 0,
                averageLatency: 0,
                memoryUsage: 0,
                cpuUsage: 0,
                uptime: expect.any(Number)
            });
        });

        test('collects metrics at specified interval', () => {
            const interval = 5000;
            // Start monitoring is called automatically in constructor

            // Fast-forward time
            jest.advanceTimersByTime(interval * 2);

            const metrics = monitor.getMetrics();
            expect(metrics.uptime).toBeGreaterThan(0);
            expect(metrics.memoryUsage).toBeGreaterThan(0);
            expect(metrics.cpuUsage).toBeGreaterThanOrEqual(0);
        });

        test('maintains metrics history', () => {
            // Start monitoring is called automatically in constructor
            
            // Simulate some activity
            monitor.recordMessage();
            // Manually simulate latency recording
            (monitor as any).recordLatency(50);
            
            jest.advanceTimersByTime(5000);
            
            const history = monitor.getMetricsHistory();
            expect(history.length).toBeGreaterThan(0);
            expect(history[0]).toHaveProperty('connections', 1);
            expect(history[0]).toHaveProperty('messageRate', 1);
        });
    });

    describe('Connection Tracking', () => {
        test('tracks connections correctly', () => {
            // Record connections
            monitor.recordMessage();
            expect(monitor.getMetrics().connections).toBe(1);

            monitor.recordMessage();
            expect(monitor.getMetrics().connections).toBe(2);

            // There's no direct way to decrease connections in the implementation
            // This would normally happen when connections time out or disconnect
        });

        test('prevents negative connection count', () => {
            // Use trackConnectionStatus method instead of trackConnection
            monitor.trackConnectionStatus(false);
            expect(monitor.getMetrics().connections).toBe(0);
        });

        test('emits connection events', (done) => {
            monitor.on('connectionChange', (count) => {
                expect(count).toBe(1);
                done();
            });

            monitor.recordMessage();
        });
    });

    describe('Message Tracking', () => {
        test('tracks message metrics', () => {
            monitor.trackMessage('test', 100, 50);
            
            const metrics = monitor.getMetrics();
            expect(metrics.messageRate).toBe(1);
            expect(metrics.averageLatency).toBe(50);
        });

        test('calculates average latency correctly', () => {
            monitor.trackMessage('test1', 100, 50);
            monitor.trackMessage('test2', 100, 150);
            
            const metrics = monitor.getMetrics();
            expect(metrics.averageLatency).toBe(100); // (50 + 150) / 2
        });
    });

    describe('Tool Usage Tracking', () => {
        test('tracks tool usage metrics', () => {
            monitor.trackToolUsage('testTool', 100, true);
            
            const metrics = monitor.getMetrics();
            expect(metrics.activeTools).toBe(1);
            expect(metrics.averageLatency).toBe(100);
            expect(metrics.errorRate).toBe(0);
        });

        test('tracks tool errors correctly', () => {
            monitor.trackToolUsage('testTool', 100, false);
            
            const metrics = monitor.getMetrics();
            expect(metrics.errorRate).toBeGreaterThan(0);
        });
    });

    describe('Alert Management', () => {
        test('creates and stores alerts', () => {
            monitor.trackError(new Error('Test error'));
            
            const alerts = monitor.getAlerts();
            expect(alerts).toHaveLength(1);
            expect(alerts[0]).toMatchObject({
                type: 'error',
                message: 'Test error'
            });
        });

        test('limits alert history', () => {
            for (let i = 0; i < 15; i++) {
                monitor.trackError(new Error(`Error ${i}`));
            }
            
            const alerts = monitor.getAlerts(10);
            expect(alerts).toHaveLength(10);
        });

        test('clears alerts', () => {
            monitor.trackError(new Error('Test error'));
            monitor.clearAlerts();
            
            expect(monitor.getAlerts()).toHaveLength(0);
        });
    });

    describe('Threshold Monitoring', () => {
        beforeEach(() => {
            (vscode.window as any).showWarningMessage = jest.fn();
            (vscode.window as any).showErrorMessage = jest.fn();
        });

        test('detects high memory usage', () => {
            const mockMemoryUsage = {
                heapTotal: 100,
                heapUsed: 85,  // Above 80% threshold
                external: 0,
                arrayBuffers: 0,
                rss: 0
            };
            jest.spyOn(process, 'memoryUsage').mockReturnValue(mockMemoryUsage);

            // Use startMonitoring method instead of start
            monitor.startMonitoring(1000);
            jest.advanceTimersByTime(1000);

            expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
                expect.stringContaining('High memory usage')
            );
        });

        test('detects high error rate', () => {
            // Simulate high error rate
            for (let i = 0; i < 10; i++) {
                monitor.trackToolUsage('testTool', 100, false);
            }

            // Use startMonitoring method instead of start
            monitor.startMonitoring(1000);
            jest.advanceTimersByTime(1000);

            expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
                expect.stringContaining('High error rate')
            );
        });

        test('detects high latency', () => {
            monitor.trackMessage('test', 100, 1500); // Above 1000ms threshold
            
            // Use startMonitoring method instead of start
            monitor.startMonitoring(1000);
            jest.advanceTimersByTime(1000);

            expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
                expect.stringContaining('High latency')
            );
        });
    });

    describe('Resource Management', () => {
        test('starts and stops monitoring', () => {
            // Start is not needed as monitoring starts automatically
            expect(monitor.getMetrics().uptime).toBeGreaterThanOrEqual(0);

            monitor.stop();
            const uptime = monitor.getMetrics().uptime;
            jest.advanceTimersByTime(5000);
            expect(monitor.getMetrics().uptime).toBe(uptime);
        });

        test('disposes resources properly', () => {
            monitor.dispose();

            expect(mockOutputChannel.dispose).toHaveBeenCalled();
        });

        test('handles multiple start/stop cycles', () => {
            // Advance time to collect some metrics
            jest.advanceTimersByTime(1000);
            monitor.stop();
            
            const metrics1 = monitor.getMetrics();
            
            // Restart monitoring
            monitor.start();
            jest.advanceTimersByTime(1000);
            monitor.stop();
            
            const metrics2 = monitor.getMetrics();
            expect(metrics2.uptime).toBeGreaterThan(metrics1.uptime);
        });
    });
});