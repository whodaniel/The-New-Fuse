import * as vscode from 'vscode';
import { EventEmitter } from 'events';

interface BenchmarkMetrics {
    messageCount: number;
    totalTime: number;
    messagesPerSecond: number;
    averageLatency: number;
    peakLatency: number;
    errorRate: number;
    memoryUsage: number;
}

interface BenchmarkOptions {
    duration?: number;  // Duration in milliseconds
    messageCount?: number;  // Number of messages to send
    messageSize?: number;  // Size of each message in bytes
    concurrency?: number;  // Number of concurrent connections
    reportInterval?: number;  // Interval for progress updates in milliseconds
}

export class MCPBenchmark extends EventEmitter {
    private outputChannel: vscode.OutputChannel;
    private metrics: BenchmarkMetrics;
    private startTime: number = 0;
    private running: boolean = false;

    constructor(outputChannel?: vscode.OutputChannel) {
        super();
        this.outputChannel = outputChannel || vscode.window.createOutputChannel('MCP Benchmark');
        this.metrics = this.initializeMetrics();
    }

    private initializeMetrics(): BenchmarkMetrics {
        return {
            messageCount: 0,
            totalTime: 0,
            messagesPerSecond: 0,
            averageLatency: 0,
            peakLatency: 0,
            errorRate: 0,
            memoryUsage: 0
        };
    }

    /**
     * Run performance benchmark
     */
    async runBenchmark(options: BenchmarkOptions = {}): Promise<BenchmarkMetrics> {
        const {
            duration = 30000,  // Default 30 seconds
            messageCount = 10000,  // Default 10k messages
            messageSize = 1024,  // Default 1KB
            concurrency = 1,  // Default single connection
            reportInterval = 1000  // Default 1 second reports
        } = options;

        this.startTime = Date.now();
        this.running = true;
        this.metrics = this.initializeMetrics();

        // Create test message
        const testMessage = {
            type: 'benchmark',
            data: Buffer.alloc(messageSize).toString('base64'),
            timestamp: Date.now()
        };

        // Progress reporting
        const progressTimer = setInterval(() => {
            this.reportProgress();
        }, reportInterval);

        try {
            // Run concurrent connections
            const promises: Promise<void>[] = [];
            for (let i = 0; i < concurrency; i++) {
                promises.push(this.runConnection(i, testMessage, messageCount, duration));
            }

            await Promise.all(promises);
            
            // Calculate final metrics
            this.metrics.totalTime = Date.now() - this.startTime;
            this.metrics.messagesPerSecond = 
                (this.metrics.messageCount / this.metrics.totalTime) * 1000;
            this.metrics.memoryUsage = process.memoryUsage().heapUsed;

            this.logResults();
            return this.metrics;

        } finally {
            clearInterval(progressTimer);
            this.running = false;
        }
    }

    /**
     * Run single connection benchmark
     */
    private async runConnection(
        id: number,
        message: any,
        targetMessageCount: number,
        duration: number
    ): Promise<void> {
        const endTime = Date.now() + duration;
        let messagesSent = 0;
        let errorsOccurred = 0;

        while (this.running && 
               messagesSent < targetMessageCount && 
               Date.now() < endTime) {
            try {
                const start = Date.now();
                
                // Simulate message send/receive
                await this.simulateMessageRoundtrip(message);
                
                const latency = Date.now() - start;
                this.updateLatencyMetrics(latency);
                
                messagesSent++;
                this.metrics.messageCount++;
                
            } catch (error) {
                errorsOccurred++;
                this.log(`Connection ${id} error: ${error}`, true);
            }

            // Small delay to prevent overwhelming
            await new Promise(resolve => setTimeout(resolve, 1));
        }

        // Update error rate
        this.metrics.errorRate = errorsOccurred / messagesSent;
    }

    /**
     * Simulate message roundtrip
     */
    private async simulateMessageRoundtrip(message: any): Promise<void> {
        return new Promise((resolve, reject) => {
            // Simulate network latency (10-100ms)
            const latency = Math.random() * 90 + 10;
            setTimeout(() => {
                // Simulate random errors (1% chance)
                if (Math.random() < 0.01) {
                    reject(new Error('Simulated network error'));
                    return;
                }
                resolve();
            }, latency);
        });
    }

    /**
     * Update latency metrics
     */
    private updateLatencyMetrics(latency: number): void {
        const currentTotal = this.metrics.averageLatency * this.metrics.messageCount;
        this.metrics.averageLatency = 
            (currentTotal + latency) / (this.metrics.messageCount + 1);
        this.metrics.peakLatency = Math.max(this.metrics.peakLatency, latency);
    }

    /**
     * Report progress
     */
    private reportProgress(): void {
        const elapsedTime = Date.now() - this.startTime;
        const currentRate = this.metrics.messageCount / (elapsedTime / 1000);
        
        this.emit('progress', {
            messageCount: this.metrics.messageCount,
            currentRate,
            averageLatency: this.metrics.averageLatency,
            errorRate: this.metrics.errorRate
        });

        this.log(`Progress:
- Messages: ${this.metrics.messageCount}
- Rate: ${Math.round(currentRate)} msg/sec
- Avg Latency: ${Math.round(this.metrics.averageLatency)}ms
- Errors: ${(this.metrics.errorRate * 100).toFixed(2)}%`);
    }

    /**
     * Log final results
     */
    private logResults(): void {
        this.log(`
Benchmark Results:
================
Total Messages: ${this.metrics.messageCount}
Total Time: ${this.metrics.totalTime}ms
Messages/sec: ${Math.round(this.metrics.messagesPerSecond)}
Average Latency: ${Math.round(this.metrics.averageLatency)}ms
Peak Latency: ${Math.round(this.metrics.peakLatency)}ms
Error Rate: ${(this.metrics.errorRate * 100).toFixed(2)}%
Memory Usage: ${Math.round(this.metrics.memoryUsage / 1024 / 1024)}MB
`);
    }

    /**
     * Log helper
     */
    private log(message: string, isError: boolean = false): void {
        const prefix = '[MCPBenchmark]';
        if (isError) {
            this.outputChannel.appendLine(`${prefix} ERROR: ${message}`);
        } else {
            this.outputChannel.appendLine(`${prefix} ${message}`);
        }
    }
}