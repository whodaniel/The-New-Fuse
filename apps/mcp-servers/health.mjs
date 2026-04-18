// Simple health check endpoint
import http from 'http';
import { fileURLToPath } from 'url';

const port = process.env.PORT || 3000;

// Basic health check function
export function healthCheck() {
    return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version
    };
}

// If this is run directly, start a simple health server
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
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
