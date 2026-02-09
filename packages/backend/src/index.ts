import { createServer } from 'http';
import * as path from 'path';
import * as fs from 'fs';

// Initialize basic HTTP server
const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'running',
    message: 'The New Fuse backend is operational',
    time: new Date().toISOString()
  }));
});

// Default port
const PORT = process.env.PORT || 3001;

// Start server
server.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});

// Basic error handling
server.on('error', (error) => {
  console.error('Server error:', error);
});

// Export server for testing purposes
export { server };