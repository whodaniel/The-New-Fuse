import * as vscode from 'vscode';
import { MCPBenchmark } from '../benchmark.js';
import { mock } from 'jest-mock-extended';
import { EventEmitter } from 'events';

describe('MCPBenchmark', () => {
    let benchmark: MCPBenchmark;
    let mockOutputChannel: vscode.OutputChannel;

    beforeEach(() => {
        mockOutputChannel = mock<vscode.OutputChannel>();
        benchmark = new MCPBenchmark(mockOutputChannel);
    });

    describe('Basic Functionality', () => {
        test('initializes with default options', () => {
            expect(benchmark).toBeInstanceOf(EventEmitter);
            expect(mockOutputChannel.appendLine).toHaveBeenCalled();
        });

        test('runs benchmark with default options', async () => {
            const results = await benchmark.runBenchmark({
                duration: 1000, // Short duration for testing
                messageCount: 100,
                concurrency: 1
            });

            expect(results).toMatchObject({
                messageCount: expect.any(Number),
                totalTime: expect.any(Number),
                messagesPerSecond: expect.any(Number),
                averageLatency: expect.any(Number),
                peakLatency: expect.any(Number),
                errorRate: expect.any(Number),
                memoryUsage: expect.any(Number)
            });
        });
    });

    describe('Progress Reporting', () => {
        test('emits progress events', (done) => {
            let progressEvents = 0;

            benchmark.on('progress', (progress) => {
                expect(progress).toMatchObject({
                    messageCount: expect.any(Number),
                    currentRate: expect.any(Number),
                    averageLatency: expect.any(Number),
                    errorRate: expect.any(Number)
                });
                progressEvents++;
                
                if (progressEvents >= 2) {
                    done();
                }
            });

            benchmark.runBenchmark({
                duration: 2500, // Run for 2.5 seconds
                reportInterval: 1000, // Report every second
                messageCount: 1000,
                concurrency: 1
            });
        });
    });

    describe('Concurrency Handling', () => {
        test('handles multiple concurrent connections', async () => {
            const results = await benchmark.runBenchmark({
                duration: 1000,
                messageCount: 100,
                concurrency: 3
            });

            expect(results.messageCount).toBeGreaterThan(0);
            expect(results.errorRate).toBeLessThan(0.1); // Error rate < 10%
        });
    });

    describe('Error Handling', () => {
        test('tracks error rates', async () => {
            // Run benchmark with high message count to ensure some errors
            const results = await benchmark.runBenchmark({
                duration: 1000,
                messageCount: 1000,
                concurrency: 1
            });

            expect(results.errorRate).toBeGreaterThan(0);
            expect(results.errorRate).toBeLessThan(0.1); // Error rate < 10%
        });
    });

    describe('Performance Metrics', () => {
        test('calculates accurate metrics', async () => {
            const results = await benchmark.runBenchmark({
                duration: 2000,
                messageCount: 200,
                messageSize: 512,
                concurrency: 2
            });

            // Verify metric calculations
            expect(results.messagesPerSecond).toBe(
                (results.messageCount / results.totalTime) * 1000
            );
            expect(results.averageLatency).toBeGreaterThan(0);
            expect(results.peakLatency).toBeGreaterThanOrEqual(results.averageLatency);
        });

        test('handles large message sizes', async () => {
            const results = await benchmark.runBenchmark({
                duration: 1000,
                messageCount: 50,
                messageSize: 1024 * 1024, // 1MB messages
                concurrency: 1
            });

            expect(results.messageCount).toBeGreaterThan(0);
            expect(results.memoryUsage).toBeGreaterThan(0);
        });
    });

    describe('Cleanup', () => {
        test('stops cleanly after duration', async () => {
            const duration = 1000;
            const start = Date.now();
            
            await benchmark.runBenchmark({
                duration,
                messageCount: 1000000, // Large number to ensure duration is the limiting factor
                concurrency: 1
            });

            const elapsed = Date.now() - start;
            expect(elapsed).toBeGreaterThanOrEqual(duration);
            expect(elapsed).toBeLessThan(duration + 500); // Allow 500ms buffer
        });
    });
});