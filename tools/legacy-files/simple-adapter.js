const WebSocket = require('ws');
const fs = require('fs').promises;
const path = require('path');
const chokidar = require('chokidar');

// Simple logging
function log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
}

// Get instance ID from command line
const instanceId = process.argv.find(arg => arg.startsWith('--instance-id='))?.split('=')[1];
if (!instanceId) {
    console.error('Error: Provide --instance-id=<id>');
    process.exit(1);
}

log(`Starting adapter for ${instanceId}`);

// Paths
const baseDir = path.join(__dirname, 'cli-relay-queue', instanceId);
const inboxDir = path.join(baseDir, 'inbox');
const outboxDir = path.join(baseDir, 'outbox');

// Ensure directories exist
async function ensureDirs() {
    await fs.mkdir(inboxDir, { recursive: true });
    await fs.mkdir(outboxDir, { recursive: true });
}

// WebSocket connection
let ws;

function connect() {
    log('Connecting to relay...');
    ws = new WebSocket('ws://localhost:3001');
    
    ws.on('open', () => {
        log('Connected! Registering...');
        ws.send(JSON.stringify({
            type: 'REGISTER',
            payload: {
                type: 'cli_agent_adapter',
                id: instanceId,
                capabilities: ['messaging']
            }
        }));
    });
    
    ws.on('message', async (data) => {
        try {
            const msg = JSON.parse(data);
            log(`Received: ${JSON.stringify(msg)}`);
            
            // Handle different message types
            switch (msg.type) {
                case 'WELCOME':
                    log('Connected to relay server');
                    break;
                    
                case 'REGISTRATION_CONFIRMED':
                    log('Registration confirmed');
                    break;
                    
                case 'ERROR':
                    log(`Error from relay: ${msg.error}`);
                    break;
                    
                default:
                    // Save inter-agent messages to inbox
                    if (msg.sender || msg.forwarded !== false) {
                        const filename = `${msg.id || Date.now()}.json`;
                        await fs.writeFile(path.join(inboxDir, filename), JSON.stringify(msg, null, 2));
                        log(`Saved inter-agent message to inbox: ${filename}`);
                    }
            }
        } catch (err) {
            log(`Error handling message: ${err.message}`);
        }
    });
    
    ws.on('close', () => {
        log('Disconnected. Reconnecting in 5s...');
        setTimeout(connect, 5000);
    });
    
    ws.on('error', (err) => {
        log(`WebSocket error: ${err.message}`);
    });
}

// File watcher for outbox
function watchOutbox() {
    log(`Watching outbox: ${outboxDir}`);
    
    const watcher = chokidar.watch(outboxDir, {
        ignored: /^\./,
        persistent: true,
        awaitWriteFinish: { stabilityThreshold: 500 }
    });
    
    watcher.on('add', async (filePath) => {
        try {
            log(`New file: ${path.basename(filePath)}`);
            
            const content = await fs.readFile(filePath, 'utf8');
            const message = JSON.parse(content);
            
            if (ws && ws.readyState === WebSocket.OPEN) {
                log(`Sending: ${JSON.stringify(message)}`);
                ws.send(JSON.stringify(message));
                log(`Sent message: ${message.id}`);
                
                await fs.unlink(filePath);
                log(`Removed: ${path.basename(filePath)}`);
            } else {
                log('WebSocket not ready!');
            }
        } catch (err) {
            log(`Error processing file: ${err.message}`);
        }
    });
}

// Start everything
async function main() {
    try {
        await ensureDirs();
        connect();
        watchOutbox();
        log('Adapter running...');
    } catch (err) {
        log(`Failed to start: ${err.message}`);
        process.exit(1);
    }
}

main();
