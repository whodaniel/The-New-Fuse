const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

describe('Benchmark Comparison', () => {
    const scriptPath = path.join(__dirname, '..', 'compare-benchmarks.js');
    const fixturesDir = path.join(__dirname, 'fixtures');

    beforeAll(() => {
        // Create fixtures directory if it doesn't exist
        if (!fs.existsSync(fixturesDir)) {
            fs.mkdirSync(fixturesDir);
        }
    });

    beforeEach(() => {
        // Clean up any existing fixture files
        fs.readdirSync(fixturesDir)
            .filter(f => f.endsWith('.json'))
            .forEach(f => fs.unlinkSync(path.join(fixturesDir, f)));
    });

    function createBenchmarkFile(filename, metrics) {
        const data = {
            profiles: {
                stress: {
                    metrics: {
                        messagesPerSecond: metrics.messageRate || 1000,
                        averageLatency: metrics.latency || 50,
                        errorRate: metrics.errorRate || 0.01,
                        memoryUsage: metrics.memoryUsage || 1024 * 1024
                    }
                }
            }
        };
        fs.writeFileSync(
            path.join(fixturesDir, filename),
            JSON.stringify(data, null, 2)
        );
        return path.join(fixturesDir, filename);
    }

    async function compareBenchmarks(previous, current) {
        const { stdout, stderr } = await execPromise(
            `node ${scriptPath} ${previous} ${current}`
        );
        if (stderr) throw new Error(stderr);
        return JSON.parse(stdout);
    }

    test('detects message rate regression', async () => {
        const previous = createBenchmarkFile('previous.json', {
            messageRate: 1000
        });
        const current = createBenchmarkFile('current.json', {
            messageRate: 800 // 20% decrease
        });

        const result = await compareBenchmarks(previous, current);
        
        expect(result.hasRegression).toBe(true);
        expect(result.summary).toContain('Message rate decreased');
    });

    test('detects latency regression', async () => {
        const previous = createBenchmarkFile('previous.json', {
            latency: 50
        });
        const current = createBenchmarkFile('current.json', {
            latency: 100 // 100% increase
        });

        const result = await compareBenchmarks(previous, current);
        
        expect(result.hasRegression).toBe(true);
        expect(result.summary).toContain('Latency increased');
    });

    test('detects error rate regression', async () => {
        const previous = createBenchmarkFile('previous.json', {
            errorRate: 0.01
        });
        const current = createBenchmarkFile('current.json', {
            errorRate: 0.1 // 900% increase
        });

        const result = await compareBenchmarks(previous, current);
        
        expect(result.hasRegression).toBe(true);
        expect(result.summary).toContain('Error rate increased');
    });

    test('detects memory usage regression', async () => {
        const previous = createBenchmarkFile('previous.json', {
            memoryUsage: 1024 * 1024
        });
        const current = createBenchmarkFile('current.json', {
            memoryUsage: 2048 * 1024 // 100% increase
        });

        const result = await compareBenchmarks(previous, current);
        
        expect(result.hasRegression).toBe(true);
        expect(result.summary).toContain('Memory usage increased');
    });

    test('handles multiple regressions', async () => {
        const previous = createBenchmarkFile('previous.json', {
            messageRate: 1000,
            latency: 50,
            errorRate: 0.01,
            memoryUsage: 1024 * 1024
        });
        const current = createBenchmarkFile('current.json', {
            messageRate: 800,
            latency: 100,
            errorRate: 0.1,
            memoryUsage: 2048 * 1024
        });

        const result = await compareBenchmarks(previous, current);
        
        expect(result.hasRegression).toBe(true);
        expect(result.summary).toContain('Message rate decreased');
        expect(result.summary).toContain('Latency increased');
        expect(result.summary).toContain('Error rate increased');
        expect(result.summary).toContain('Memory usage increased');
    });

    test('reports no regression when changes are within thresholds', async () => {
        const previous = createBenchmarkFile('previous.json', {
            messageRate: 1000,
            latency: 50,
            errorRate: 0.01,
            memoryUsage: 1024 * 1024
        });
        const current = createBenchmarkFile('current.json', {
            messageRate: 950, // 5% decrease
            latency: 55,    // 10% increase
            errorRate: 0.015, // 50% increase
            memoryUsage: 1124 * 1024 // 10% increase
        });

        const result = await compareBenchmarks(previous, current);
        
        expect(result.hasRegression).toBe(false);
        expect(result.summary).toContain('No Significant Performance Regressions');
    });

    test('formats changes with appropriate units', async () => {
        const previous = createBenchmarkFile('previous.json', {
            messageRate: 1000,
            latency: 50
        });
        const current = createBenchmarkFile('current.json', {
            messageRate: 1100,
            latency: 45
        });

        const result = await compareBenchmarks(previous, current);
        
        expect(result.changes.messageRate).toContain('% throughput');
        expect(result.changes.latency).toContain('% slower');
    });

    test('handles missing metrics gracefully', async () => {
        const previous = createBenchmarkFile('previous.json', {});
        const current = createBenchmarkFile('current.json', {});

        await expect(compareBenchmarks(previous, current)).resolves.toBeDefined();
    });

    test('includes thresholds in output', async () => {
        const previous = createBenchmarkFile('previous.json', {});
        const current = createBenchmarkFile('current.json', {});

        const result = await compareBenchmarks(previous, current);
        
        expect(result.thresholds).toBeDefined();
        expect(result.thresholds.messageRate).toBeDefined();
        expect(result.thresholds.latency).toBeDefined();
        expect(result.thresholds.errorRate).toBeDefined();
        expect(result.thresholds.memoryUsage).toBeDefined();
    });
});