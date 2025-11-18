/**
 * NestJS Testing Helpers
 *
 * Utilities for testing NestJS applications across the monorepo.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

/**
 * Create a test module with common configuration
 */
export async function createTestingModule(
  imports: any[] = [],
  providers: any[] = [],
  controllers: any[] = []
): Promise<TestingModule> {
  const moduleRef = await Test.createTestingModule({
    imports,
    controllers,
    providers,
  }).compile();

  return moduleRef;
}

/**
 * Create and initialize a test application
 */
export async function createTestApp(module: TestingModule): Promise<INestApplication> {
  const app = module.createNestApplication();

  // Add global pipes, filters, interceptors here
  // app.useGlobalPipes(new ValidationPipe());

  await app.init();
  return app;
}

/**
 * Close test application and clean up
 */
export async function closeTestApp(app: INestApplication): Promise<void> {
  await app.close();
}

/**
 * Create a mock repository
 */
export function createMockRepository<T>() {
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
export function createMockService<T extends Record<string, any>>(
  methods: (keyof T)[]
): { [K in keyof T]: jest.Mock } {
  const mock: any = {};
  methods.forEach((method) => {
    mock[method] = jest.fn();
  });
  return mock;
}

/**
 * HTTP request helpers
 */
export class TestRequest {
  constructor(private app: INestApplication) {}

  get(url: string) {
    return request(this.app.getHttpServer()).get(url);
  }

  post(url: string, body?: any) {
    return request(this.app.getHttpServer()).post(url).send(body);
  }

  put(url: string, body?: any) {
    return request(this.app.getHttpServer()).put(url).send(body);
  }

  patch(url: string, body?: any) {
    return request(this.app.getHttpServer()).patch(url).send(body);
  }

  delete(url: string) {
    return request(this.app.getHttpServer()).delete(url);
  }

  withAuth(token: string) {
    return {
      get: (url: string) => this.get(url).set('Authorization', `Bearer ${token}`),
      post: (url: string, body?: any) => this.post(url, body).set('Authorization', `Bearer ${token}`),
      put: (url: string, body?: any) => this.put(url, body).set('Authorization', `Bearer ${token}`),
      patch: (url: string, body?: any) => this.patch(url, body).set('Authorization', `Bearer ${token}`),
      delete: (url: string) => this.delete(url).set('Authorization', `Bearer ${token}`),
    };
  }
}

/**
 * Create mock ConfigService
 */
export function createMockConfigService(config: Record<string, any> = {}) {
  return {
    get: jest.fn((key: string) => config[key]),
    getOrThrow: jest.fn((key: string) => {
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
export function createMockLogger() {
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
export async function waitForWebSocket(
  app: INestApplication,
  timeout: number = 5000
): Promise<void> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      // Check if WebSocket server is ready
      const httpServer = app.getHttpServer();
      if (httpServer.listening) {
        return;
      }
    } catch (error) {
      // Continue waiting
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('WebSocket connection timeout');
}
