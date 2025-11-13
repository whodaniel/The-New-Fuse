/**
 * WebSocket Server Launcher for The New Fuse
 * This script serves as a bridge between the Chrome extension
 * and the actual WebSocket server process.
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class WebSocketServerLauncher {
    constructor() {
        this.serverProcess = null;
        this.isRunning = false;
        this.port = 3710;
        this.logListeners = [];
        this.statusListeners = [];
        this.serverScript = path.join(__dirname, 'test-websocket-server-3710.cjs');
    }

    /**
     * Add log listener
     */
    onLog(callback) {
        this.logListeners.push(callback);
    }

    /**
     * Add status listener
     */
    onStatus(callback) {
        this.statusListeners.push(callback);
    }

    /**
     * Broadcast log message to all listeners
     */
    broadcastLog(message, type = 'info') {
        const logEntry = `[${new Date().toISOString()}] [${type.toUpperCase()}] ${message}`;
        console.log(logEntry);
        this.logListeners.forEach(listener => {
            try {
                listener(logEntry, type);
            } catch (error) {
                console.error('Error in log listener:', error);
            }
        });
    }

    /**
     * Broadcast status change to all listeners
     */
    broadcastStatus(status, state) {
        console.log(`Status change: ${status} (${state})`);
        this.statusListeners.forEach(listener => {
            try {
                listener(status, state);
            } catch (error) {
                console.error('Error in status listener:', error);
            }
        });
    }

    /**
     * Check if the server script exists
     */
    checkServerScript() {
        if (!fs.existsSync(this.serverScript)) {
            this.broadcastLog(`Server script not found: ${this.serverScript}`, 'error');
            return false;
        }
        return true;
    }

    /**
     * Start the WebSocket server
     */
    async start(port = 3710) {
        if (this.isRunning) {
            this.broadcastLog('Server is already running', 'warn');
            return { success: false, error: 'Server is already running' };
        }

        if (!this.checkServerScript()) {
            return { success: false, error: 'Server script not found' };
        }

        this.port = port;
        this.broadcastLog(`Starting WebSocket server on port ${port}...`, 'info');
        this.broadcastStatus('Starting...', 'starting');

        try {
            // Spawn the Node.js process for the WebSocket server
            this.serverProcess = spawn('node', [this.serverScript], {
                stdio: ['pipe', 'pipe', 'pipe'],
                env: { ...process.env, PORT: port.toString() }
            });

            // Handle server process stdout
            this.serverProcess.stdout.on('data', (data) => {
                const message = data.toString().trim();
                if (message) {
                    this.broadcastLog(`Server: ${message}`, 'info');
                }
            });

            // Handle server process stderr
            this.serverProcess.stderr.on('data', (data) => {
                const message = data.toString().trim();
                if (message) {
                    this.broadcastLog(`Server Error: ${message}`, 'error');
                }
            });

            // Handle server process exit
            this.serverProcess.on('exit', (code, signal) => {
                this.isRunning = false;
                this.serverProcess = null;
                
                if (code === 0) {
                    this.broadcastLog('WebSocket server stopped normally', 'info');
                    this.broadcastStatus('Stopped', 'stopped');
                } else if (signal) {
                    this.broadcastLog(`WebSocket server terminated by signal: ${signal}`, 'warn');
                    this.broadcastStatus('Terminated', 'stopped');
                } else {
                    this.broadcastLog(`WebSocket server exited with code: ${code}`, 'error');
                    this.broadcastStatus('Error', 'stopped');
                }
            });

            // Handle server process error
            this.serverProcess.on('error', (error) => {
                this.isRunning = false;
                this.serverProcess = null;
                this.broadcastLog(`Failed to start server: ${error.message}`, 'error');
                this.broadcastStatus('Failed to Start', 'stopped');
            });

            // Wait a moment to see if the process starts successfully
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    if (this.serverProcess && !this.serverProcess.killed) {
                        this.isRunning = true;
                        this.broadcastLog(`WebSocket server started successfully on port ${port}`, 'info');
                        this.broadcastStatus('Running', 'running');
                        resolve();
                    } else {
                        reject(new Error('Server process failed to start'));
                    }
                }, 2000);

                // If the process exits immediately, it's an error
                this.serverProcess.on('exit', (code) => {
                    clearTimeout(timeout);
                    if (code !== 0) {
                        reject(new Error(`Server process exited immediately with code ${code}`));
                    }
                });
            });

            return { success: true };

        } catch (error) {
            this.isRunning = false;
            this.serverProcess = null;
            this.broadcastLog(`Error starting server: ${error.message}`, 'error');
            this.broadcastStatus('Failed to Start', 'stopped');
            return { success: false, error: error.message };
        }
    }

    /**
     * Stop the WebSocket server
     */
    async stop() {
        if (!this.isRunning || !this.serverProcess) {
            this.broadcastLog('Server is not running', 'warn');
            return { success: false, error: 'Server is not running' };
        }

        this.broadcastLog('Stopping WebSocket server...', 'info');
        this.broadcastStatus('Stopping...', 'stopping');

        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                // Force kill if graceful shutdown doesn't work
                if (this.serverProcess && !this.serverProcess.killed) {
                    this.broadcastLog('Force killing server process...', 'warn');
                    this.serverProcess.kill('SIGKILL');
                }
                resolve({ success: true });
            }, 5000);

            this.serverProcess.on('exit', () => {
                clearTimeout(timeout);
                this.isRunning = false;
                this.serverProcess = null;
                this.broadcastLog('WebSocket server stopped', 'info');
                this.broadcastStatus('Stopped', 'stopped');
                resolve({ success: true });
            });

            // Try graceful shutdown first
            this.serverProcess.kill('SIGTERM');
        });
    }

    /**
     * Restart the WebSocket server
     */
    async restart(port = this.port) {
        this.broadcastLog('Restarting WebSocket server...', 'info');

        if (this.isRunning) {
            const stopResult = await this.stop();
            if (!stopResult.success) {
                return stopResult;
            }
            // Wait a moment before restarting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        return await this.start(port);
    }

    /**
     * Get current server status
     */
    getStatus() {
        return {
            running: this.isRunning,
            port: this.port,
            processId: this.serverProcess ? this.serverProcess.pid : null,
            scriptPath: this.serverScript
        };
    }

    /**
     * Check if server is responding on the specified port
     */
    async healthCheck() {
        if (!this.isRunning) {
            return { healthy: false, error: 'Server is not running' };
        }

        try {
            // Try to create a WebSocket connection to test the server
            const WebSocket = require('ws');
            const ws = new WebSocket(`ws://localhost:${this.port}`);

            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    ws.terminate();
                    resolve({ healthy: false, error: 'Connection timeout' });
                }, 3000);

                ws.on('open', () => {
                    clearTimeout(timeout);
                    ws.close();
                    resolve({ healthy: true });
                });

                ws.on('error', (error) => {
                    clearTimeout(timeout);
                    resolve({ healthy: false, error: error.message });
                });
            });
        } catch (error) {
            return { healthy: false, error: error.message };
        }
    }
}

// Export for use in other modules
module.exports = WebSocketServerLauncher;

// If run directly, start the server
if (require.main === module) {
    const launcher = new WebSocketServerLauncher();

    launcher.onLog((message, type) => {
        console.log(message);
    });

    launcher.onStatus((status, state) => {
        console.log(`Status: ${status} (${state})`);
    });

    // Handle command line arguments
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
WebSocket Server Launcher for The New Fuse

Usage: node launchWebSocketServer.js [port]

Options:
  port              Port number (default: 3710)
  --help, -h        Show this help message

Examples:
  node launchWebSocketServer.js        # Start on default port 3710
  node launchWebSocketServer.js 3711   # Start on port 3711
        `);
        process.exit(0);
    }

    // Parse port from command line or use default
    let port = 3710;
    const portArg = args.find(arg => !isNaN(parseInt(arg)));
    if (portArg) {
        port = parseInt(portArg);
        if (isNaN(port) || port < 1 || port > 65535) {
            console.error('Invalid port number. Port must be between 1 and 65535.');
            process.exit(1);
        }
    }

    launcher.start(port).then(result => {
        if (!result.success) {
            console.error('Failed to start server:', result.error);
            process.exit(1);
        }
    });

    // Handle process signals for graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\nReceived SIGINT, shutting down gracefully...');
        await launcher.stop();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        console.log('\nReceived SIGTERM, shutting down gracefully...');
        await launcher.stop();
        process.exit(0);
    });
}
