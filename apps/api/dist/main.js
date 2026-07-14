"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const dotenv = __importStar(require("dotenv"));
// Load environment variables specific to the API service from apps/api/.env BEFORE importing AppModule
dotenv.config();
const express = __importStar(require("express"));
require("reflect-metadata");
const app_module_1 = require("./app.module");
const app_constants_1 = require("./config/app.constants");
const cors_config_1 = require("./config/cors.config");
const gcp_config_1 = require("./config/gcp.config");
const swagger_config_1 = require("./config/swagger.config");
const route_fallback_middleware_1 = require("./middleware/route-fallback.middleware");
const security_middleware_1 = require("./middleware/security.middleware");
const logger = new common_1.Logger('Bootstrap');
async function bootstrap() {
    // Validate GCP environment variables
    (0, gcp_config_1.validateGcpEnvironment)();
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        rawBody: true,
        // Enable CORS with strict configuration
        cors: (0, cors_config_1.getCorsOptions)(),
    });
    // Back-compat: clients still call /v1/* or /api/v1/* while routes are registered at /api/*.
    // Also rewrite checklist probe paths (M02/M05) so they hit NestJS controllers under /api.
    const CHECKLIST_REWRITES = new Set(['/docs', '/pricing', '/features']);
    app.use((req, _res, next) => {
        const rawUrl = req.url || '';
        const queryIndex = rawUrl.indexOf('?');
        const query = queryIndex >= 0 ? rawUrl.slice(queryIndex) : '';
        let pathname = queryIndex >= 0 ? rawUrl.slice(0, queryIndex) : rawUrl;
        if (pathname.startsWith('/v1/') || pathname === '/v1') {
            pathname = `/api${pathname}`;
        }
        if (pathname.startsWith('/api/v1/')) {
            // Don't rewrite /api/v1/health — it's a direct route
            if (pathname === '/api/v1/health') {
                // keep as-is
            }
            else {
                pathname = pathname.replace('/api/v1/', '/api/');
            }
        }
        else if (pathname === '/api/v1') {
            pathname = '/api';
        }
        // M02/M05: Rewrite bare /docs, /pricing, /features, /bridges/* to /api/*
        if (CHECKLIST_REWRITES.has(pathname) || pathname.startsWith('/bridges/')) {
            pathname = `/api${pathname}`;
        }
        if (pathname + query !== rawUrl) {
            const rewritten = `${pathname}${query}`;
            req.url = rewritten;
            req.originalUrl = rewritten;
        }
        next();
    });
    // Explicitly add body parsers (essential for POST data processing)
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    // Global validation pipe with enhanced options
    app.useGlobalPipes(new common_1.ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: true,
        disableErrorMessages: process.env.NODE_ENV === 'production',
        validationError: {
            target: false,
            value: false,
        },
    }));
    // Note: Security middleware should be applied in module configure() method
    // Using app.use(app.get()) causes "requires a middleware function" error
    // These are NestJS providers, not Express middleware functions
    // They should be applied via MiddlewareConsumer in AppModule
    // Set global prefix for API routes
    app.setGlobalPrefix(app_constants_1.GLOBAL_API_PREFIX);
    // Swagger API Documentation Setup
    (0, swagger_config_1.setupSwagger)(app);
    // Enhanced security headers
    app.use(security_middleware_1.securityMiddleware);
    // Route fallback: when users hit SPA paths on the API host, redirect to frontend app.
    app.use(route_fallback_middleware_1.routeFallbackMiddleware);
    // Root endpoint for health checks
    app.getHttpAdapter().get(app_constants_1.ROOT_PATH, (req, res) => {
        res.json({
            status: app_constants_1.SERVICE_STATUS_HEALTHY,
            service: app_constants_1.SERVICE_NAME_API,
            timestamp: new Date().toISOString(),
        });
    });
    app.getHttpAdapter().get(app_constants_1.HEALTH_CHECK_PATH, (req, res) => {
        res.json({
            status: app_constants_1.SERVICE_STATUS_HEALTHY,
            service: app_constants_1.SERVICE_NAME_API,
            timestamp: new Date().toISOString(),
        });
    });
    app.getHttpAdapter().get('/api/v1/health', async (req, res) => {
        // V02: Include Redis connectivity status for monitoring dashboards
        let redisConnected = false;
        try {
            const Redis = require('ioredis');
            const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
            const client = new Redis(redisUrl, { connectTimeout: 2000, lazyConnect: true });
            await client.connect();
            const pong = await client.ping();
            redisConnected = pong === 'PONG';
            client.disconnect();
        }
        catch {
            // Redis unavailable — report gracefully, don't crash
            redisConnected = false;
        }
        res.json({
            status: 'ok',
            service: app_constants_1.SERVICE_NAME_API,
            timestamp: new Date().toISOString(),
            redis: {
                connected: redisConnected,
                note: redisConnected ? undefined : 'Redis unreachable from this deployment',
            },
        });
    });
    const port = process.env.PORT || app_constants_1.DEFAULT_PORT;
    await app.listen(port, app_constants_1.DEFAULT_HOST);
    logger.log(`API Server running on port ${port} and host 0.0.0.0`);
}
bootstrap().catch((error) => {
    logger.error('Failed to start API application', error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map