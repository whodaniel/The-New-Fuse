"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAPIResponse = exports.generateAPIRequest = void 0;
const utils_1 = require("./utils");
const DEFAULT_REQUEST_OPTIONS = {
    method: 'GET',
    withAuth: true,
    withPagination: false,
    withFilters: false
};
const DEFAULT_RESPONSE_OPTIONS = {
    status: 200,
    withPagination: false,
    withMeta: true,
    withError: false
};
const API_PATHS = [
    '/api/users',
    '/api/workflows',
    '/api/agents',
    '/api/tasks',
    '/api/metrics'
];
const generateAPIRequest = (options = {}) => {
    const finalOptions = { ...DEFAULT_REQUEST_OPTIONS, ...options };
    const requestId = (0, utils_1.generateId)();
    const request = {
        id: requestId,
        method: finalOptions.method || 'GET',
        path: (0, utils_1.pickRandom)(API_PATHS),
        headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId,
            ...(finalOptions.withAuth && {
                'Authorization': `Bearer test-token-${(0, utils_1.generateId)()}`
            })
        },
        timestamp: (0, utils_1.generateTimestamp)(),
        user: finalOptions.user ? {
            id: finalOptions.user.id,
            username: finalOptions.user.username,
            role: finalOptions.user.role
        } : undefined
    };
    if (finalOptions.withPagination) {
        request.query = {
            page: '1',
            limit: '10',
            sort: 'createdAt:desc'
        };
    }
    if (finalOptions.withFilters) {
        request.query = {
            ...request.query,
            status: 'active',
            type: 'user',
            from: new Date().toISOString()
        };
    }
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        request.body = generateRequestBody(request.path);
    }
    return request;
};
exports.generateAPIRequest = generateAPIRequest;
const generateAPIResponse = (request, options = {}) => {
    const finalOptions = { ...DEFAULT_RESPONSE_OPTIONS, ...options };
    if (finalOptions.withError) {
        return generateErrorResponse(request);
    }
    const response = {
        id: (0, utils_1.generateId)(),
        status: finalOptions.status || 200,
        headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': request.id
        },
        body: generateResponseBody(request, finalOptions),
        timestamp: (0, utils_1.generateTimestamp)(),
        requestId: request.id
    };
    if (finalOptions.withMeta) {
        response.meta = {
            processingTime: Math.random() * 100,
            apiVersion: '1.0',
            serverRegion: 'us-east-1'
        };
    }
    return response;
};
exports.generateAPIResponse = generateAPIResponse;
const generateRequestBody = (path) => {
    const basePath = path.split('/')[2]; // Extract resource type from path
    switch (basePath) {
        case 'users':
            return {
                username: 'testuser',
                email: 'test@example.com',
                role: 'user'
            };
        case 'workflows':
            return {
                name: 'Test Workflow',
                description: 'Test workflow description',
                isActive: true
            };
        default:
            return {
                name: 'Test Resource',
                description: 'Test description'
            };
    }
};
const generateResponseBody = (request, options) => {
    const basePath = request.path.split('/')[2];
    const data = Array.from({ length: 5 }, (_, i) => ({
        id: (0, utils_1.generateId)(),
        name: `Test ${basePath} ${i + 1}`,
        createdAt: (0, utils_1.generateTimestamp)({ past: true }),
        updatedAt: (0, utils_1.generateTimestamp)({ past: true })
    }));
    if (options.withPagination) {
        return {
            data,
            pagination: {
                total: 100,
                page: 1,
                limit: 10,
                totalPages: 10
            }
        };
    }
    return data;
};
const generateErrorResponse = (request) => {
    const errorResponses = [
        {
            status: 400,
            error: 'Bad Request',
            message: 'Invalid request parameters'
        },
        {
            status: 401,
            error: 'Unauthorized',
            message: 'Authentication required'
        },
        {
            status: 403,
            error: 'Forbidden',
            message: 'Insufficient permissions'
        },
        {
            status: 404,
            error: 'Not Found',
            message: 'Resource not found'
        },
        {
            status: 500,
            error: 'Internal Server Error',
            message: 'An unexpected error occurred'
        }
    ];
    const error = (0, utils_1.pickRandom)(errorResponses);
    return {
        id: (0, utils_1.generateId)(),
        status: error.status,
        headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': request.id
        },
        body: {
            error: error.error,
            message: error.message,
            requestId: request.id,
            timestamp: new Date().toISOString()
        },
        timestamp: (0, utils_1.generateTimestamp)(),
        requestId: request.id
    };
};
//# sourceMappingURL=apiGenerator.js.map