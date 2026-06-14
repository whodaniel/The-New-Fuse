"use strict";
/**
 * NestJS Testing Helpers
 *
 * Utilities for testing NestJS applications across the monorepo.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestRequest = void 0;
exports.createTestingModule = createTestingModule;
exports.createTestApp = createTestApp;
exports.closeTestApp = closeTestApp;
exports.createMockRepository = createMockRepository;
exports.createMockService = createMockService;
exports.createMockConfigService = createMockConfigService;
exports.createMockLogger = createMockLogger;
exports.waitForWebSocket = waitForWebSocket;
const testing_1 = require("@nestjs/testing");
const supertest_1 = __importDefault(require("supertest"));
/**
 * Create a test module with common configuration
 */
async function createTestingModule(imports = [], providers = [], controllers = []) {
    const moduleRef = await testing_1.Test.createTestingModule({
        imports,
        controllers,
        providers,
    }).compile();
    return moduleRef;
}
/**
 * Create and initialize a test application
 */
async function createTestApp(module) {
    const app = module.createNestApplication();
    // Add global pipes, filters, interceptors here
    // app.useGlobalPipes(new ValidationPipe());
    await app.init();
    return app;
}
/**
 * Close test application and clean up
 */
async function closeTestApp(app) {
    await app.close();
}
/**
 * Create a mock repository
 */
function createMockRepository() {
    return {
        find: jest.fn(),
        findOne: jest.fn(),
        findOneBy: jest.fn(),
        findBy: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        remove: jest.fn(),
        count: jest.fn(),
        findAndCount: jest.fn(),
    };
}
/**
 * Create a mock service
 */
function createMockService(methods) {
    const mock = {};
    methods.forEach((method) => {
        mock[method] = jest.fn();
    });
    return mock;
}
/**
 * HTTP request helpers
 */
class TestRequest {
    constructor(app) {
        this.app = app;
    }
    get(url) {
        return (0, supertest_1.default)(this.app.getHttpServer()).get(url);
    }
    post(url, body) {
        return (0, supertest_1.default)(this.app.getHttpServer()).post(url).send(body);
    }
    put(url, body) {
        return (0, supertest_1.default)(this.app.getHttpServer()).put(url).send(body);
    }
    patch(url, body) {
        return (0, supertest_1.default)(this.app.getHttpServer()).patch(url).send(body);
    }
    delete(url) {
        return (0, supertest_1.default)(this.app.getHttpServer()).delete(url);
    }
    withAuth(token) {
        return {
            get: (url) => this.get(url).set('Authorization', `Bearer ${token}`),
            post: (url, body) => this.post(url, body).set('Authorization', `Bearer ${token}`),
            put: (url, body) => this.put(url, body).set('Authorization', `Bearer ${token}`),
            patch: (url, body) => this.patch(url, body).set('Authorization', `Bearer ${token}`),
            delete: (url) => this.delete(url).set('Authorization', `Bearer ${token}`),
        };
    }
}
exports.TestRequest = TestRequest;
/**
 * Create mock ConfigService
 */
function createMockConfigService(config = {}) {
    return {
        get: jest.fn((key) => config[key]),
        getOrThrow: jest.fn((key) => {
            if (!(key in config)) {
                throw new Error(`Config key ${key} not found`);
            }
            return config[key];
        }),
    };
}
/**
 * Create mock Logger
 */
function createMockLogger() {
    return {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        verbose: jest.fn(),
    };
}
/**
 * Wait for WebSocket connection
 */
async function waitForWebSocket(app, timeout = 5000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        try {
            // Check if WebSocket server is ready
            const httpServer = app.getHttpServer();
            if (httpServer.listening) {
                return;
            }
        }
        catch (error) {
            // Continue waiting
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error('WebSocket connection timeout');
}
//# sourceMappingURL=nestjs-helpers.js.map