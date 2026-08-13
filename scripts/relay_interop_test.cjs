/**
 * relay_interop_test.cjs — Unified Synaptic Bus Verification (Verbose)
 */
const WebSocket = require('ws');

const NODE_RELAY_URL = 'ws://localhost:3000';
const NATIVE_SYNAPSE_URL = 'ws://localhost:3006/synapse';

async function runInteropTest() {
    console.log("[🔭] Starting Interop Test: Unified Synaptic Bus...");
    
    const nodeClient = new WebSocket(NODE_RELAY_URL);
    const rustClient = new WebSocket(NATIVE_SYNAPSE_URL);
    
    let nodeReceived = 0;
    let rustReceived = 0;

    const setup = new Promise((resolve) => {
        let count = 0;
        nodeClient.on('open', () => { 
            console.log("     Node.js Client Connected"); 
            nodeClient.send(JSON.stringify({
                type: 'REGISTER',
                payload: {
                    id: 'node-test-client',
                    type: 'agent',
                    capabilities: ['testing']
                }
            }));
            count++; 
            if(count==2) resolve(); 
        });
        rustClient.on('open', () => { 
            console.log("     Rust Client Connected"); 
            count++; 
            if(count==2) resolve(); 
        });
    });

    await setup;

    nodeClient.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        console.log(`     Node.js Client got: ${msg.type}`);
        if (msg.payload && msg.payload.from === 'RUST') {
            console.log("[✅] Node.js Client received message from RUST!");
            nodeReceived++;
        }
    });

    rustClient.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        console.log(`     Rust Client got: ${msg.type}`);
        if (msg.payload && msg.payload.from === 'NODE') {
            console.log("[✅] Rust Client received message from NODE!");
            rustReceived++;
        }
    });

    // 1. Node -> Rust
    console.log("[📤] Sending: Node -> Rust...");
    nodeClient.send(JSON.stringify({
        type: 'BROADCAST',
        source: 'node-test-client',
        payload: { from: 'NODE', data: 'hello from legacy' }
    }));

    // 2. Rust -> Node
    setTimeout(() => {
        console.log("[📤] Sending: Rust -> Node...");
        rustClient.send(JSON.stringify({
            type: 'BROADCAST',
            source: 'rust-test-client',
            payload: { from: 'RUST', data: 'hello from native' }
        }));
    }, 1000);

    setTimeout(() => {
        console.log(`[🏁] Results: Node Received: ${nodeReceived}, Rust Received: ${rustReceived}`);
        if (nodeReceived > 0 && rustReceived > 0) {
            console.log("[🎊] UNIFIED SYNAPTIC BUS VERIFIED!");
        } else {
            console.log("[❌] Interop Failed.");
        }
        nodeClient.terminate();
        rustClient.terminate();
    }, 3000);
}

runInteropTest();
