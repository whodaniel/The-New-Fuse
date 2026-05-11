/**
 * gateway_benchmark.cjs — NestJS vs Native Gateway
 */
const axios = require('axios');
const { performance } = require('perf_hooks');

const NEST_GATEWAY_URL = 'http://localhost:3005';
const NATIVE_GATEWAY_URL = 'http://localhost:3008';

// We'll proxy through the 'api' service to the actual API server on 3001
const NEST_PROXY_PATH = '/api/health';
const NATIVE_PROXY_PATH = '/proxy/api/health';

const ITERATIONS = 1000;
const CONCURRENCY = 10;

async function runBenchmark(url, path, name) {
    console.log(`[🚀] Starting benchmark for ${name}...`);
    
    // Warmup
    try {
        await axios.get(`${url}${path}`);
    } catch (e) {
        console.warn(`     Warmup failed for ${name}: ${e.message}`);
    }

    const latencies = [];
    const startAll = performance.now();
    
    const runBatch = async () => {
        while (latencies.length < ITERATIONS) {
            const start = performance.now();
            try {
                await axios.get(`${url}${path}`);
                latencies.push(performance.now() - start);
            } catch (e) {
                // Ignore errors to keep benchmark running
            }
        }
    };

    const batches = [];
    for (let i = 0; i < CONCURRENCY; i++) {
        batches.push(runBatch());
    }
    await Promise.all(batches);

    const duration = performance.now() - startAll;
    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    
    console.log(`[🏁] ${name} Results (${latencies.length} requests):`);
    console.log(`    Avg Latency: ${avg.toFixed(2)}ms`);
    console.log(`    Throughput:  ${(latencies.length / (duration / 1000)).toFixed(2)} req/sec`);
    return latencies.length / (duration / 1000);
}

async function main() {
    console.log("[🔭] Gateway Throughput Comparison (Concurrency: " + CONCURRENCY + ")");
    
    // 1. NestJS Gateway
    const nestThroughput = await runBenchmark(NEST_GATEWAY_URL, NEST_PROXY_PATH, 'NestJS Gateway');
    
    // 2. Native Rust Gateway
    const nativeThroughput = await runBenchmark(NATIVE_GATEWAY_URL, NATIVE_PROXY_PATH, 'Native Gateway (Rust)');
    
    console.log(`\n[🎊] Throughput Boost: ${(nativeThroughput / nestThroughput).toFixed(2)}x`);
}

main();
