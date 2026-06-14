/**
 * NestJS Testing Helpers
 *
 * Utilities for testing NestJS applications across the monorepo.
 */
import { TestingModule } from '@nestjs/testing';
import request from 'supertest';
/**
 * Create a test module with common configuration
 */
export declare function createTestingModule(imports?: any[], providers?: any[], controllers?: any[]): Promise<TestingModule>;
/**
 * Create and initialize a test application
 */
export declare function createTestApp(module: TestingModule): Promise<any>;
/**
 * Close test application and clean up
 */
export declare function closeTestApp(app: any): Promise<void>;
/**
 * Create a mock repository
 */
export declare function createMockRepository<T>(): {
    find: jest.Mock<any, any, any>;
    findOne: jest.Mock<any, any, any>;
    findOneBy: jest.Mock<any, any, any>;
    findBy: jest.Mock<any, any, any>;
    save: jest.Mock<any, any, any>;
    create: jest.Mock<any, any, any>;
    update: jest.Mock<any, any, any>;
    delete: jest.Mock<any, any, any>;
    remove: jest.Mock<any, any, any>;
    count: jest.Mock<any, any, any>;
    findAndCount: jest.Mock<any, any, any>;
};
/**
 * Create a mock service
 */
export declare function createMockService<T extends Record<string, any>>(methods: (keyof T)[]): {
    [K in keyof T]: jest.Mock;
};
/**
 * HTTP request helpers
 */
export declare class TestRequest {
    private app;
    constructor(app: any);
    get(url: string): request.SuperTestStatic.Test;
    post(url: string, body?: any): request.SuperTestStatic.Test;
    put(url: string, body?: any): request.SuperTestStatic.Test;
    patch(url: string, body?: any): request.SuperTestStatic.Test;
    delete(url: string): request.SuperTestStatic.Test;
    withAuth(token: string): {
        get: (url: string) => request.SuperTestStatic.Test;
        post: (url: string, body?: any) => request.SuperTestStatic.Test;
        put: (url: string, body?: any) => request.SuperTestStatic.Test;
        patch: (url: string, body?: any) => request.SuperTestStatic.Test;
        delete: (url: string) => request.SuperTestStatic.Test;
    };
}
/**
 * Create mock ConfigService
 */
export declare function createMockConfigService(config?: Record<string, any>): {
    get: jest.Mock<any, [key: string], any>;
    getOrThrow: jest.Mock<any, [key: string], any>;
};
/**
 * Create mock Logger
 */
export declare function createMockLogger(): {
    log: jest.Mock<any, any, any>;
    error: jest.Mock<any, any, any>;
    warn: jest.Mock<any, any, any>;
    debug: jest.Mock<any, any, any>;
    verbose: jest.Mock<any, any, any>;
};
/**
 * Wait for WebSocket connection
 */
export declare function waitForWebSocket(app: any, timeout?: number): Promise<void>;
//# sourceMappingURL=nestjs-helpers.d.ts.map