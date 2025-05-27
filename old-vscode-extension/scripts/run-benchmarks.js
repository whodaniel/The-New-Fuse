"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const benchmark_1 = require("../src/mcp-integration/benchmark");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const profiles = [
    {
        name: 'quick-test',
        options: {
            duration: 5000,
            messageCount: 1000,
            messageSize: 1024,
            concurrency: 1
        }
    },
    {
        name: 'stress-test',
        options: {
            duration: 30000,
            messageCount: 100000,
            messageSize: 1024 * 10,
            concurrency: 5
        }
    },
    {
        name: 'large-messages',
        options: {
            duration: 15000,
            messageCount: 1000,
            messageSize: 1024 * 1024,
            concurrency: 2
        }
    },
    {
        name: 'high-concurrency',
        options: {
            duration: 20000,
            messageCount: 50000,
            messageSize: 512,
            concurrency: 10
        }
    }
];
async function runBenchmarks() {
    const results = {
        timestamp: new Date().toISOString(),
        profiles: {}
    };
    const benchmark = new benchmark_1.MCPBenchmark();
    for (const profile of profiles) {
        console.log(`\nRunning benchmark profile: ${profile.name}`);
        console.log('-'.repeat(50));
        try {
            const metrics = await benchmark.runBenchmark(profile.options);
            results.profiles[profile.name] = {
                options: profile.options,
                metrics
            };
            console.log(`\nResults for ${profile.name}:`);
            console.log(`Messages/sec: ${Math.round(metrics.messagesPerSecond)}`);
            console.log(`Average latency: ${Math.round(metrics.averageLatency)}ms`);
            console.log(`Error rate: ${(metrics.errorRate * 100).toFixed(2)}%`);
        }
        catch (error) {
            console.error(`Error running ${profile.name}:`, error.message);
            results.profiles[profile.name] = {
                options: profile.options,
                error: error.message
            };
        }
    }
    // Save results
    const resultsDir = path.join(__dirname, '../benchmark-results');
    await fs.mkdir(resultsDir, { recursive: true });
    const filename = path.join(resultsDir, `benchmark-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    await fs.writeFile(filename, JSON.stringify(results, null, 2));
    // Compare with previous results if available
    try {
        const files = await fs.readdir(resultsDir);
        const previousFile = files
            .filter(f => f.endsWith('.json'))
            .sort()
            .slice(-2)[0]; // Get second-to-last file
        if (previousFile) {
            const previousResults = JSON.parse(await fs.readFile(path.join(resultsDir, previousFile), 'utf-8'));
            console.log('\nPerformance comparison with previous run:');
            console.log('='.repeat(50));
            for (const profile of profiles) {
                const current = results.profiles[profile.name]?.metrics;
                const previous = previousResults.profiles[profile.name]?.metrics;
                if (current && previous) {
                    const msgRateChange = ((current.messagesPerSecond - previous.messagesPerSecond) /
                        previous.messagesPerSecond * 100).toFixed(2);
                    const latencyChange = ((current.averageLatency - previous.averageLatency) /
                        previous.averageLatency * 100).toFixed(2);
                    console.log(`\n${profile.name}:`);
                    console.log(`Message rate: ${msgRateChange}% change`);
                    console.log(`Latency: ${latencyChange}% change`);
                }
            }
        }
    }
    catch (error) {
        console.error('Error comparing with previous results:', error.message);
    }
}
runBenchmarks().catch(console.error);
//# sourceMappingURL=run-benchmarks.js.map