import express from 'express';
import session from 'express-session';
import { createClient } from 'redis';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import { setupLogging } from './logging_config.js';
import { dbConfig } from './database.js';
dotenv.config();
const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
    cors: {
        origin: process.env.CORS_ORIGINS?.split(',') || '*',
        methods: ['GET', 'POST']
    },
    pingTimeout: parseInt(process.env.SOCKET_IO_PING_TIMEOUT || '5000'),
    pingInterval: parseInt(process.env.SOCKET_IO_PING_INTERVAL || '25000')
});
// Load default configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(session({
    secret: process.env.SECRET_KEY || 'your-secret-key-here',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.SESSION_COOKIE_SECURE === 'true',
        httpOnly: process.env.SESSION_COOKIE_HTTPONLY === 'true',
        sameSite: process.env.SESSION_COOKIE_SAMESITE || 'lax',
        maxAge: parseInt(process.env.PERMANENT_SESSION_LIFETIME || '86400') * 1000
    }
}));
// Setup logging
setupLogging(app);
// Add test route
app.get('/', (req, res) => {
    res.json({ message: 'Server is running!' });
});
// Initialize Redis for session handling
let redisClient;
if (process.env.REDIS_URL) {
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.connect().catch(console.error);
}
// Error handlers
app.use((req, res, next) => {
    res.status(404).json({ error: 'Not Found' });
});
app.use((err, req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        database: dbConfig.getHealthStatus(),
        redis: checkRedisHealth()
    });
});
// Metrics endpoint
app.get('/metrics', (req, res) => {
    res.json({
        database: dbConfig.getMetrics(),
        redis: getRedisMetrics()
    });
});
function checkRedisHealth() {
    if (redisClient) {
        return redisClient.ping().then(() => ({ status: 'healthy' })).catch(() => ({ status: 'unhealthy' }));
    }
    return { status: 'not_configured' };
}
function getRedisMetrics() {
    if (redisClient) {
        return redisClient.info().then(info => ({
            connected_clients: info.connected_clients,
            used_memory: info.used_memory_human,
            total_connections_received: info.total_connections_received,
            total_commands_processed: info.total_commands_processed
        })).catch(() => ({}));
    }
    return {};
}
export { app, server, io };
