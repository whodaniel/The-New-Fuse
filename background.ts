
// Use type assertion for the dynamic import
const launchWebSocketServer = await import('./launchWebSocketServer.js') as any;

// ...existing code...

        if (currentRedisConfig.env === 'custom') {
            return {
                host: currentRedisConfig.host,
                port: currentRedisConfig.port,
                username: currentRedisConfig.username,
                password: currentRedisConfig.password,
                tls: currentRedisConfig.tls,
            } as any; // Explicitly cast to any to resolve potential type issues
        }
// Start the WebSocket server
await launchWebSocketServer.launchWebSocketServer();