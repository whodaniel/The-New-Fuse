import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

export const createTestingModule = async (providers: any[]) => {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      ...providers,
      {
        provide: ConfigService,
        useValue: {
          get: jest.fn((key: string) => {
            // Add default test configuration values
            const config = {
              'database.host': 'localhost',
              'database.port': 5432,
              'redis.host': 'localhost',
              'redis.port': 6379
            };
            return config[key];
          })
        }
      }
    ]
  }).compile();

  return module;
};

export const createMockWebSocket = (): any => {
  return {
    send: jest.fn(),
    close: jest.fn(),
    on: jest.fn(),
    emit: jest.fn()
  };
};