import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createClient } from 'redis';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
app.use(express.json());
app.use(cors());

// Create HTTP server
const httpServer = createServer(app);

// Create Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Track connected clients
let vscodeSocket = null;
let chromeSocket = null;
const webClients = new Set();

// Redis client setup (optional)
let redisClient = null;
let redisSubscriber = null;

try {
  redisClient = createClient();
  redisSubscriber = redisClient.duplicate();
  
  await redisClient.connect();
  await redisSubscriber.connect();
  
  console.log('Redis connected');
  
  // Subscribe to the channel
  await redisSubscriber.subscribe('qwen_to_vscode', (message) => {
    console.log(`[Redis] Received message: ${message}`);
    forwardToVSCode(JSON.parse(message));
  });
  
  await redisSubscriber.subscribe('vscode_to_qwen', (message) => {
    console.log(`[Redis] Received message: ${message}`);
    forwardToWeb(JSON.parse(message));
  });
} catch (err) {
  console.log('Redis connection failed:', err.message);
  console.log('Continuing without Redis support');
}

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  const clientType = socket.handshake.query.clientType;
  
  if (clientType === 'vscode') {
    vscodeSocket = socket;
    console.log('VSCode client connected');
    
    // Listen for messages from VSCode
    socket.on('from-vscode', (data) => {
      console.log(`[WebSocket] Received from VSCode: ${JSON.stringify(data)}`);
      forwardToWeb(data);
    });
  } else if (clientType === 'chrome') {
    chromeSocket = socket;
    console.log('Chrome client connected');
    
    // Listen for messages from Chrome
    socket.on('from-web', (data) => {
      console.log(`[WebSocket] Received from Chrome: ${JSON.stringify(data)}`);
      forwardToVSCode(data);
    });
  } else {
    webClients.add(socket);
    console.log('Web client connected');
    
    // Listen for messages from web clients
    socket.on('to-vscode', (data) => {
      console.log(`[WebSocket] Received from web: ${JSON.stringify(data)}`);
      forwardToVSCode(data);
    });
  }
  
  // Handle disconnection
  socket.on('disconnect', () => {
    if (socket === vscodeSocket) {
      vscodeSocket = null;
      console.log('VSCode client disconnected');
    } else if (socket === chromeSocket) {
      chromeSocket = null;
      console.log('Chrome client disconnected');
    } else {
      webClients.delete(socket);
      console.log('Web client disconnected');
    }
  });
});

// Forward message to VSCode
function forwardToVSCode(data) {
  if (vscodeSocket) {
    vscodeSocket.emit('from-web', data);
  }
  
  // Also publish to Redis if available
  if (redisClient && redisClient.isOpen) {
    redisClient.publish('qwen_to_vscode', JSON.stringify(data))
      .catch(err => console.error('Redis publish error:', err));
  }
  
  // Write to file as fallback
  const fileData = JSON.stringify(data);
  fs.writeFile(path.join(__dirname, 'to_vscode.json'), fileData, (err) => {
    if (err) console.error('Error writing to file:', err);
  });
}

// Forward message to web clients
function forwardToWeb(data) {
  // Send to Chrome extension if connected
  if (chromeSocket) {
    chromeSocket.emit('from-vscode', data);
  }
  
  // Send to all web clients
  webClients.forEach(socket => {
    socket.emit('from-vscode', data);
  });
  
  // Also publish to Redis if available
  if (redisClient && redisClient.isOpen) {
    redisClient.publish('vscode_to_qwen', JSON.stringify(data))
      .catch(err => console.error('Redis publish error:', err));
  }
  
  // Write to file as fallback
  const fileData = JSON.stringify(data);
  fs.writeFile(path.join(__dirname, 'to_web.json'), fileData, (err) => {
    if (err) console.error('Error writing to file:', err);
  });
}

// HTTP endpoints
app.post('/send', (req, res) => {
  const data = req.body;
  console.log(`[HTTP] Received: ${JSON.stringify(data)}`);
  
  if (req.query.target === 'vscode') {
    forwardToVSCode(data);
    res.send({ status: 'sent to vscode' });
  } else {
    forwardToWeb(data);
    res.send({ status: 'sent to web' });
  }
});

// Status endpoint
app.get('/status', (req, res) => {
  res.json({
    vscodeConnected: !!vscodeSocket,
    chromeConnected: !!chromeSocket,
    webClientsCount: webClients.size,
    redisConnected: redisClient ? redisClient.isOpen : false
  });
});

// Serve a simple test page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>The New Fuse Relay Server</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        .status { margin: 20px 0; padding: 10px; border-radius: 4px; }
        .connected { background-color: #d4edda; color: #155724; }
        .disconnected { background-color: #f8d7da; color: #721c24; }
        textarea { width: 100%; height: 100px; margin: 10px 0; }
        button { padding: 8px 16px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background-color: #0069d9; }
        .log { background-color: #f8f9fa; padding: 10px; height: 200px; overflow-y: auto; font-family: monospace; }
      </style>
    </head>
    <body>
      <h1>The New Fuse Relay Server</h1>
      <div id="status" class="status disconnected">Checking status...</div>
      
      <h2>Send Message to VSCode</h2>
      <textarea id="vscode-message" placeholder="Type message to send to VSCode..."></textarea>
      <button onclick="sendToVSCode()">Send to VSCode</button>
      
      <h2>Send Message to Web</h2>
      <textarea id="web-message" placeholder="Type message to send to web clients..."></textarea>
      <button onclick="sendToWeb()">Send to Web</button>
      
      <h2>Communication Log</h2>
      <div id="log" class="log"></div>
      
      <script src="/socket.io/socket.io.js"></script>
      <script>
        const socket = io({ query: { clientType: 'web' } });
        const statusEl = document.getElementById('status');
        const logEl = document.getElementById('log');
        
        // Update status
        function updateStatus() {
          fetch('/status')
            .then(res => res.json())
            .then(data => {
              let statusText = 'Status: ';
              if (data.vscodeConnected) statusText += 'VSCode Connected, ';
              else statusText += 'VSCode Disconnected, ';
              
              if (data.chromeConnected) statusText += 'Chrome Connected, ';
              else statusText += 'Chrome Disconnected, ';
              
              statusText += data.webClientsCount + ' web clients, ';
              
              if (data.redisConnected) statusText += 'Redis Connected';
              else statusText += 'Redis Disconnected';
              
              statusEl.textContent = statusText;
              statusEl.className = 'status ' + (data.vscodeConnected ? 'connected' : 'disconnected');
            });
        }
        
        // Add log entry
        function addLog(message) {
          const entry = document.createElement('div');
          entry.textContent = new Date().toLocaleTimeString() + ': ' + message;
          logEl.appendChild(entry);
          logEl.scrollTop = logEl.scrollHeight;
        }
        
        // Send to VSCode
        function sendToVSCode() {
          const text = document.getElementById('vscode-message').value;
          if (!text) return;
          
          socket.emit('to-vscode', { text });
          addLog('Sent to VSCode: ' + text);
          document.getElementById('vscode-message').value = '';
        }
        
        // Send to Web
        function sendToWeb() {
          const text = document.getElementById('web-message').value;
          if (!text) return;
          
          fetch('/send?target=web', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
          });
          
          addLog('Sent to Web: ' + text);
          document.getElementById('web-message').value = '';
        }
        
        // Listen for messages
        socket.on('from-vscode', (data) => {
          addLog('Received from VSCode: ' + JSON.stringify(data));
        });
        
        // Update status periodically
        updateStatus();
        setInterval(updateStatus, 5000);
        
        // Connection events
        socket.on('connect', () => {
          addLog('Connected to server');
          updateStatus();
        });
        
        socket.on('disconnect', () => {
          addLog('Disconnected from server');
          updateStatus();
        });
      </script>
    </body>
    </html>
  `);
});

// Start the server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Relay server running on http://localhost:${PORT}`);
});
