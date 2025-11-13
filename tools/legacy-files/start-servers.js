import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Start the WebSocket server
const wsServer = spawn('node', [join(__dirname, 'secure-websocket-server.js')], {
  stdio: 'inherit'
});

// Start the HTTP server
const httpServer = spawn('node', [join(__dirname, 'http-server.js')], {
  stdio: 'inherit'
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down servers...');
  wsServer.kill();
  httpServer.kill();
  process.exit(0);
});
