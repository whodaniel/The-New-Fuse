"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = exports.auth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const redis_service_1 = require("../services/redis.service");
const config_1 = require("@nestjs/config");
const prisma = new client_1.PrismaClient();
const configService = new config_1.ConfigService();
const redisService = new redis_service_1.RedisService(configService);
const auth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            res.status(401).json({ success: false, message: 'No token provided' });
            return;
        }
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-default-secret-key');
        // Fetch full user object from database
        // Check Redis cache first
        try {
            const cachedUser = await redisService.get(`user:${decoded.id}`);
            if (cachedUser) {
                req.user = JSON.parse(cachedUser);
                req.userId = decoded.id;
                next();
                return;
            }
        }
        catch (redisError) {
            console.warn('Redis cache error, falling back to database:', redisError);
        }
        const user = await prisma.user.findUnique({
            where: { id: decoded.id }
        });
        if (!user) {
            res.status(401).json({ success: false, message: 'User not found' });
            return;
        }
        // Attach the full user object and userId for convenience
        req.user = user;
        req.userId = user.id;
        // Cache user in Redis for 1 hour
        try {
            await redisService.setex(`user:${user.id}`, 3600, JSON.stringify(user));
        }
        catch (redisError) {
            console.warn('Redis cache set error:', redisError);
        }
        next();
    }
    catch {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};
exports.auth = auth;
// Export as authMiddleware for compatibility
exports.authMiddleware = exports.auth;
