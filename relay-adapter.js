const WebSocket = require('ws');
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const chokidar = require('chokidar');

// --- Configuration ---
const RELAY_URL = 'ws://localhost:3001';
const BASE_QUEUE_DIR = path.join(__dirname, 'cli-relay-queue');
const LOG_DIR = path.join(__dirname, 'logs');

// --- Get Instance ID from command line arguments ---
const args = process.argv.slice(2);
const instanceIdArg = args.find(arg => arg.startsWith('--instance-id='));

if (!instanceIdArg) {
    console.error('Error: You must provide an instance ID, e.g., --instance-id=instance_A');
    process.exit(1);
}

const INSTANCE_ID = instanceIdArg.split('=')[1];
const INBOX_DIR = path.join(BASE_QUEUE_DIR, INSTANCE_ID, 'inbox');
const OUTBOX_DIR = path.join(BASE_QUEUE_DIR, INSTANCE_ID, 'outbox');
const LOG_FILE = path.join(LOG_DIR, `adapter-${INSTANCE_ID}.log`);

// Ensure directories exist
async function ensureDirectories() {
    try {
        await fsp.mkdir(INBOX_DIR, { recursive: true });
        await fsp.mkdir(OUTBOX_DIR, { recursive: true });
        await fsp.mkdir(LOG_DIR, { recursive: true });
    } catch (error) {
        console.error('Failed to create directories:', error);
        process.exit(1);
    }
}

// --- Logging Setup ---
const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });
const logger = new console.Console(logStream, logStream);

function log(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] [${INSTANCE_ID}] ${message}`;
    logger.log(formattedMessage, ...args);
    
    // Also log to console if running in foreground
    if (process.stdout.isTTY) {
        console.log(formattedMessage, ...args);
    }
}

// --- Global Variables ---
let ws = null;
let watcher = null;
let reconnectTimer = null;

// --- WebSocket Connection Management ---
function connect() {
    log('info', `Attempting to connect to TNF Relay at ${RELAY_URL}`);
    
    ws = new WebSocket(RELAY_URL);

    ws.on('open', () => {
        log('info', 'Connected to TNF Relay');
        
        // Register with the relay
        const registrationMessage = {
            type: 'REGISTER',
            payload: {
                type: 'cli_agent_adapter',
                id: INSTANCE_ID,
                capabilities: ['command_execution', 'file_io', 'generic_messaging']
            }
        };
        
        ws.send(JSON.stringify(registrationMessage));
        log('info', 'Registration message sent');
    });

    ws.on('message', async (data) => {
        try {
            const message = JSON.parse(data.toString());
            log('info', `Received message: ${JSON.stringify(message)}`);
            
            // Save message to inbox
            const timestamp = Date.now();
            const messageId = message.id || `msg_${timestamp}`;
            const fileName = `${messageId}.json`;
            const filePath = path.join(INBOX_DIR, fileName);

            await fsp.writeFile(filePath, JSON.stringify(message, null, 2));
            log('info', `Saved message to inbox: ${fileName}`);
        } catch (error) {
            log('error', `Error processing incoming message: ${error.message}`);
        }
    });

    ws.on('close', () => {
        log('info', 'Connection closed. Will reconnect in 5 seconds...');
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
        }
        reconnectTimer = setTimeout(() => {
            connect();
        }, 5000);
    });

    ws.on('error', (error) => {
        log('error', `WebSocket error: ${error.message}`);
    });
}

// --- Outbox File Watcher ---
function setupOutboxWatcher() {
    log('info', `Setting up file watcher for: ${OUTBOX_DIR}`);
    
    watcher = chokidar.watch(OUTBOX_DIR, {
        ignored: /^\./,
        persistent: true,
        awaitWriteFinish: {
            stabilityThreshold: 1000,
            pollInterval: 100
        }
    });

    watcher.on('ready', () => {
        log('info', 'File watcher is ready');
    });

    watcher.on('add', async (filePath) => {
        log('info', `New file detected: ${path.basename(filePath)}`);
        
        try {
            // Wait for the file to be fully written
            await new Promise(resolve => setTimeout(resolve, 100));

            if (ws && ws.readyState === WebSocket.OPEN) {
                const content = await fsp.readFile(filePath, 'utf8');
                const messageToSend = JSON.parse(content);

                ws.send(JSON.stringify(messageToSend));
                log('info', `Sent message: ${messageToSend.id || 'unknown'}`);
                
                // Remove the processed file
                await fsp.unlink(filePath);
                log('info', `Removed processed file: ${path.basename(filePath)}`);
            } else {
                log('warn', 'WebSocket not ready, message queued');
            }
        } catch (error) {
            log('error', `Error processing outbox file: ${error.message}`);
        }
    });

    watcher.on('error', (error) => {
        log('error', `Watcher error: ${error.message}`);
    });
}

// --- Cleanup on exit ---
function cleanup() {
    log('info', 'Shutting down adapter...');
    
    if (watcher) {
        watcher.close();
    }
    
    if (ws) {
        ws.close();
    }
    
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
    }
    
    process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// --- Main Startup ---
async function main() {
    try {
        log('info', 'Starting TNF Relay Adapter...');
        log('info', `Instance ID: ${INSTANCE_ID}`);
        log('info', `Inbox: ${INBOX_DIR}`);
        log('info', `Outbox: ${OUTBOX_DIR}`);
        log('info', `Log file: ${LOG_FILE}`);
        
        await ensureDirectories();
        setupOutboxWatcher();
        connect();
    } catch (error) {
        log('error', `Failed to start adapter: ${error.message}`);
        process.exit(1);
    }
}

main();