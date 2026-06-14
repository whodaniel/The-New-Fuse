"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment-specific .env file
const env = process.env.TEST_ENV || 'local';
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, `../../.env.${env}`) });
exports.config = {
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    apiUrl: process.env.API_URL || 'http://localhost:3001',
    testTimeout: parseInt(process.env.TEST_TIMEOUT || '30000', 10),
    userPool: {
        admin: {
            username: process.env.ADMIN_USER || 'admin',
            password: process.env.ADMIN_PASSWORD || 'admin123',
        },
        testUser: {
            username: process.env.TEST_USER || 'testuser',
            password: process.env.TEST_PASSWORD || 'testpass123',
        },
    },
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        name: process.env.DB_NAME || 'fuse_test',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
    },
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
    },
};
//# sourceMappingURL=test-config.js.map