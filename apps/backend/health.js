// Simple health check endpoint
const http = require('http');
const port = process.env.PORT || 3000;

// Basic health check function
function healthCheck() {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version,
  };
}

// If this is run directly, start a simple health server
if (require.main === module) {
  const server = http.createServer((req, res) => {
    if (req.url === '/health' || req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(healthCheck()));
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  server.listen(port, () => {
    console.log(`Health check server running on port ${port}`);
  });
}

module.exports = { healthCheck };
