/**
 * relay_benchmark.cjs — Stress testing the Native Synapse
 */
const WebSocket = require('ws');
const { performance } = require('perf_hooks');

const NATIVE_SYNAPSE_URL = 'ws://localhost:3006/synapse';

const CLIENT_COUNT = 100;
const MSG_COUNT = 1000;

async function runBenchmark(url, name) {
    console.log(`[🚀] Starting benchmark for ${name} at ${url}...`);
    console.log(`     Clients: ${CLIENT_COUNT}, Messages: ${MSG_COUNT}`);
    
    const clients = [];
    let receivedCount = 0;
    
    const setupPromise = new Promise((resolve) => {
        let connected = 0;
        for (let i = 0; i < CLIENT_COUNT; i++) {
            const ws = new WebSocket(url);
            ws.on('open', () => {
                connected++;
                if (connected === CLIENT_COUNT) resolve();
            });
            ws.on('message', () => {
                receivedCount++;
            });
            clients.push(ws);
        }
    });

    await setupPromise;
    console.log(`[✅] ${CLIENT_COUNT} clients connected.`);

    const start = performance.now();
    
    // Broadcast from client 0
    for (let i = 0; i < MSG_COUNT; i++) {
        clients[0].send(JSON.stringify({
            type: 'BROADCAST',
            source: 'benchmark-client',
            payload: { test: 'data', index: i },
            timestamp: new Date().toISOString()
        }));
    }

    // Wait for all messages (MSG_COUNT * other_clients)
    const expected = MSG_COUNT * (CLIENT_COUNT - 1);
    while (receivedCount < expected) {
        await new Promise(r => setTimeout(r, 100));
        const elapsed = (performance.now() - start) / 1000;
        process.stdout.write(`     Progress: ${receivedCount}/${expected} (${(receivedCount/elapsed).toFixed(0)} msg/s)\r`);
        if (elapsed > 30) {
            console.log(`\n[!] Timeout: Received ${receivedCount}/${expected}`);
            break;
        }
    }

    const duration = performance.now() - start;
    console.log(`\n[🏁] ${name} Results:`);
    console.log(`    Total Messages: ${receivedCount}`);
    console.log(`    Duration:       ${duration.toFixed(2)}ms`);
    console.log(`    Throughput:     ${(receivedCount / (duration / 1000)).toFixed(2)} msgs/sec`);

    clients.forEach(c => c.terminate());
}

runBenchmark(NATIVE_SYNAPSE_URL, 'Native Rust Synapse');
