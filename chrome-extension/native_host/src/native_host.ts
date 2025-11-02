import { spawn, execSync } from 'child_process';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import Redis from 'ioredis';

// Basic logging to a file for debugging native host issues
const logFilePath = '/tmp/native_host_ts_debug.log';
function log(message: string, level: 'INFO' | 'ERROR' | 'DEBUG' = 'INFO') {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFilePath, `[${timestamp}] [${level}] ${message}\n`);
}

log('Native host (TypeScript) started.', 'INFO');

interface NativeHostRequest {
    command: string;
    [key: string]: any;
}

interface NativeHostResponse {
    success: boolean;
    message?: string;
    error?: string;
    [key: string]: any;
}

function sendResponse(response: NativeHostResponse) {
    log(`Sending response: ${JSON.stringify(response)}`, 'DEBUG');
    // Native Messaging protocol requires messages to be length-prefixed
    const payload = JSON.stringify(response);
    const length = Buffer.byteLength(payload, 'utf8');
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32LE(length, 0);
    process.stdout.write(buffer);
    process.stdout.write(payload);
}

function readInput(callback: (request: NativeHostRequest) => void) {
    let accumulatedData = Buffer.alloc(0);
    let messageLength = 0;

    process.stdin.on('data', (chunk) => {
        accumulatedData = Buffer.concat([accumulatedData, chunk]);
        log(`Received chunk of size ${chunk.length}. Accumulated size: ${accumulatedData.length}`, 'DEBUG');

        while (accumulatedData.length >= 4) {
            if (messageLength === 0) {
                messageLength = accumulatedData.readUInt32LE(0);
                log(`Read message length: ${messageLength}`, 'DEBUG');
            }

            if (accumulatedData.length >= 4 + messageLength) {
                const messageBuffer = accumulatedData.slice(4, 4 + messageLength);
                const message = messageBuffer.toString('utf8');
                log(`Received full message: ${message}`, 'DEBUG');
                try {
                    const request: NativeHostRequest = JSON.parse(message);
                    callback(request);
                } catch (e: any) {
                    log(`Invalid JSON received: ${e.message}`, 'ERROR');
                    sendResponse({ success: false, error: `Invalid JSON: ${e.message}` });
                }

                accumulatedData = accumulatedData.slice(4 + messageLength);
                messageLength = 0;
            } else {
                log(`Not enough data for full message. Need ${4 + messageLength - accumulatedData.length} more bytes.`, 'DEBUG');
                break; // Not enough data for the full message yet
            }
        }
    });

    process.stdin.on('end', () => {
        log('Stdin ended, exiting.', 'INFO');
        process.exit(0);
    });

    process.stdin.on('error', (err) => {
        log(`Stdin error: ${err.message}`, 'ERROR');
        process.exit(1);
    });

    // Keep the process alive even if no data is immediately available
    // This is a workaround for potential premature stdin closure by Chrome
    setInterval(() => {
        log('Native host heartbeat (waiting for input)...', 'DEBUG');
    }, 5000); // Log every 5 seconds to confirm process is alive
}

// --- Utility Functions (from Python script) ---

function findProcessOnPort(port: number): { pid: number; name: string; } | null {
    try {
        // Using lsof for macOS/Linux to find process by port
        const output = execSync(`lsof -i :${port} -sTCP:LISTEN -P -Fpcn`, { encoding: 'utf8', stdio: 'pipe' });
        const lines = output.split('\n');
        let pid: number | null = null;
        let name: string | null = null;

        for (const line of lines) {
            if (line.startsWith('p')) {
                pid = parseInt(line.substring(1));
            } else if (line.startsWith('c')) {
                name = line.substring(1);
            }
            if (pid !== null && name !== null) {
                return { pid, name };
            }
        }
    } catch (error: any) {
        // lsof might exit with non-zero if no process found, or permission issues
        log(`Error finding process on port ${port}: ${error.message}`, 'DEBUG');
    }
    return null;
}

const PROJECT_DIR = '/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse';

async function startServer(port: number = 3001, redisConfig?: any): Promise<NativeHostResponse> {
    log(`Attempting to start server on port ${port}`, 'INFO');
    try {
        const existing = findProcessOnPort(port);
        if (existing) {
            return {
                success: false,
                error: `Port ${port} already in use by process ${existing.name} (PID: ${existing.pid})`
            };
        }

        const cmdArgs = ['tnf-relay.js', '--port', String(port)];
        if (redisConfig) {
            if (redisConfig.host) cmdArgs.push('--redis-host', redisConfig.host);
            if (redisConfig.port) cmdArgs.push('--redis-port', String(redisConfig.port));
            if (redisConfig.password) cmdArgs.push('--redis-password', redisConfig.password);
        }

        const process = spawn('node', cmdArgs, {
            cwd: PROJECT_DIR,
            detached: true, // Detach to allow parent to exit
            stdio: 'ignore' // Ignore stdio to prevent blocking
        });

        process.unref(); // Allow the Node.js event loop to exit independently of the child

        // Give it a moment to start
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check if it's running
        const check = findProcessOnPort(port);
        if (check) {
            return {
                success: true,
                pid: check.pid,
                port: port,
                message: `Server started on port ${port}`
            };
        } else {
            return {
                success: false,
                error: 'Server failed to start: Process not found on port after spawn.'
            };
        }

    } catch (e: any) {
        log(`Error starting server: ${e.message}`, 'ERROR');
        return { success: false, error: String(e) };
    }
}

async function stopServer(): Promise<NativeHostResponse> {
    log('Attempting to stop server', 'INFO');
    const portsToStop = [3000, 3001, 3002]; // Common relay ports
    const stopped: string[] = [];
    try {
        for (const port of portsToStop) {
            const procInfo = findProcessOnPort(port);
            if (procInfo && procInfo.name.toLowerCase().includes('node')) { // Assuming tnf-relay is a node process
                try {
                    process.kill(procInfo.pid, 'SIGTERM'); // Use SIGTERM for graceful shutdown
                    stopped.push(`Stopped process on port ${port} (PID: ${procInfo.pid})`);
                    await new Promise(resolve => setTimeout(resolve, 500)); // Give time to terminate
                } catch (e: any) {
                    stopped.push(`Failed to stop process on port ${port}: ${e.message}`);
                    log(`Error stopping process on port ${port}: ${e.message}`, 'ERROR');
                }
            }
        }
        if (stopped.length > 0) {
            return { success: true, message: stopped.join('; ') };
        } else {
            return { success: true, message: 'No relay servers found running' };
        }
    } catch (e: any) {
        log(`Error in stopServer: ${e.message}`, 'ERROR');
        return { success: false, error: String(e) };
    }
}

async function restartVite(port: number = 5173): Promise<NativeHostResponse> {
    log(`Attempting to restart Vite on port ${port}`, 'INFO');
    try {
        // Stop existing Vite process
        const procInfo = findProcessOnPort(port);
        if (procInfo) {
            try {
                process.kill(procInfo.pid, 'SIGTERM');
                await new Promise(resolve => setTimeout(resolve, 1000)); // Give time to terminate
                log(`Terminated existing Vite process PID: ${procInfo.pid}`, 'INFO');
            } catch (e: any) {
                log(`Error terminating existing Vite process: ${e.message}`, 'ERROR');
            }
        }

        // Start Vite server
        const cmdArgs = ['run', 'dev', '--', '--port', String(port)];
        const viteProcess = spawn('npm', cmdArgs, {
            cwd: PROJECT_DIR,
            detached: true,
            stdio: 'ignore',
            shell: true // Use shell to ensure pnpm command is found
        });
        viteProcess.unref();

        await new Promise(resolve => setTimeout(resolve, 3000)); // Give it time to start

        const check = findProcessOnPort(port);
        if (check) {
            return {
                success: true,
                pid: check.pid,
                port: port,
                message: `Vite server restarted on port ${port}`
            };
        } else {
            return {
                success: false,
                error: 'Vite failed to start: Process not found on port after spawn.'
            };
        }

    } catch (e: any) {
        log(`Error restarting Vite: ${e.message}`, 'ERROR');
        return { success: false, error: String(e) };
    }
}

async function testRedis(config: any): Promise<NativeHostResponse> {
    log(`Attempting to test Redis connection to ${config.host || 'localhost'}:${config.port || 6379}`, 'INFO');
    try {
        const redis = new Redis({
            host: config.host || 'localhost',
            port: config.port || 6379,
            password: config.password,
            username: config.username,
            tls: config.tls || false,
            connectTimeout: 5000, // 5 seconds timeout
            lazyConnect: true // Don't connect until a command is issued
        });

        await redis.connect();
        await redis.ping();
        redis.disconnect();

        return {
            success: true,
            message: `Successfully connected to Redis at ${config.host || 'localhost'}:${config.port || 6379}`
        };
    } catch (e: any) {
        log(`Redis connection failed: ${e.message}`, 'ERROR');
        return {
            success: false,
            error: `Redis connection failed: ${e.message}`
        };
    }
}

// Main message loop for Native Messaging
readInput(async (request: NativeHostRequest) => {
    log(`Received request: ${JSON.stringify(request)}`, 'INFO');
    let response: NativeHostResponse;

    switch (request.command) {
        case 'start_server':
            response = await startServer(request.port, request.redisConfig);
            break;
        case 'stop_server':
            response = await stopServer();
            break;
        case 'restart_vite':
            response = await restartVite(request.port);
            break;
        case 'test_redis':
            response = await testRedis(request.config);
            break;
        // Add other commands as needed
        default:
            response = { success: false, error: `Unknown command: ${request.command}` };
            break;
    }
    sendResponse(response);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    log(`Uncaught Exception: ${err.message}\n${err.stack}`, 'ERROR');
    sendResponse({ success: false, error: `Native host uncaught exception: ${err.message}` });
    process.exit(1); // Exit after logging and sending error
});

process.on('unhandledRejection', (reason, promise) => {
    log(`Unhandled Rejection at: ${promise}, reason: ${reason}`, 'ERROR');
    sendResponse({ success: false, error: `Native host unhandled rejection: ${reason}` });
    process.exit(1); // Exit after logging and sending error
});
