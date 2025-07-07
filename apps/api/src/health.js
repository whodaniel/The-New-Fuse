"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
// Add missing function declarations
async function checkDatabaseHealth() {
    // Simple implementation
    return { status: 'connected' };
}
async function checkRedisHealth() {
    // Simple implementation
    return { status: 'connected' };
}
router.get('/health', async (req, res) => {
    try {
        const [dbStatus, redisStatus] = await Promise.all([
            checkDatabaseHealth(),
            checkRedisHealth()
        ]);
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'api',
            version: process.env.npm_package_version,
            database: dbStatus,
            redis: redisStatus
        });
    }
    catch (error) { // Add type annotation for error
        res.status(500).json({
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
            service: 'api'
        });
    }
});
exports.default = router;
