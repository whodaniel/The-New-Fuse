"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = void 0;
const http_1 = require("http");
// Initialize basic HTTP server
const server = (0, http_1.createServer)((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        status: 'running',
        message: 'The New Fuse backend is operational',
        time: new Date().toISOString()
    }));
});
exports.server = server;
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
//# sourceMappingURL=index.js.map