"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCorsOptions = void 0;
const getCorsOptions = () => {
    const allowedProductionOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
        'https://thenewfuse.com',
        'https://www.thenewfuse.com',
        'https://app.thenewfuse.com',
        'https://tnf-saas-app.pages.dev',
        'https://api-gateway-241337102384.us-central1.run.app',
    ];
    const allowedDevelopmentOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173',
        'https://fae7326d.ai-arcade-poker.pages.dev',
    ];
    const commonOrigins = ['chrome-extension://kddfgejmbblgadkdmalfnagbiefbcdmi'];
    const origins = process.env.NODE_ENV === 'production'
        ? [...allowedProductionOrigins, ...commonOrigins]
        : [...allowedDevelopmentOrigins, ...commonOrigins];
    return {
        origin: origins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-Requested-With',
            'X-CSRF-Token',
            'X-Request-ID',
            'X-Client-IP',
        ],
    };
};
exports.getCorsOptions = getCorsOptions;
//# sourceMappingURL=cors.config.js.map