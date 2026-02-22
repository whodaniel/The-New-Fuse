import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AppConfigService } from './app-config.service';

describe('AppConfigService', () => {
  let service: AppConfigService;
  let configService: ConfigService;

  describe('with valid configuration', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            ignoreEnvFile: true,
            load: [
              () => ({
                NODE_ENV: 'test',
                JWT_SECRET: 'a'.repeat(32), // Valid 32-char secret
                DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
                REDIS_URL:
                  'redis://default:mDNmtwseaVHcQsCHaIoZapjlWrvAjtot@tramway.proxy.rlwy.net:13570',
              }),
            ],
          }),
        ],
        providers: [AppConfigService],
      }).compile();

      service = module.get<AppConfigService>(AppConfigService);
      configService = module.get<ConfigService>(ConfigService);
    });

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should validate configuration on module init', async () => {
      await expect(service.onModuleInit()).resolves.not.toThrow();
    });

    it('should return JWT secret', async () => {
      await service.onModuleInit();
      expect(service.jwtSecret).toBe('a'.repeat(32));
    });

    it('should return database URL', async () => {
      await service.onModuleInit();
      expect(service.databaseUrl).toBe('postgresql://test:test@localhost:5432/test');
    });

    it('should return Redis URL', async () => {
      await service.onModuleInit();
      expect(service.redisUrl).toBe(
        'redis://default:mDNmtwseaVHcQsCHaIoZapjlWrvAjtot@tramway.proxy.rlwy.net:13570'
      );
    });

    it('should identify test environment', async () => {
      await service.onModuleInit();
      expect(service.nodeEnv).toBe('test');
      expect(service.isTest).toBe(true);
      expect(service.isProduction).toBe(false);
      expect(service.isDevelopment).toBe(false);
    });

    it('should provide default values for optional config', async () => {
      await service.onModuleInit();
      expect(service.jwtIssuer).toBe('the-new-fuse');
      expect(service.jwtExpiresIn).toBe('7d');
      expect(service.port).toBe(3001);
    });

    it('should parse CORS origins', async () => {
      await service.onModuleInit();
      expect(service.corsOrigins).toEqual(['http://localhost:3000']);
    });
  });

  describe('with missing JWT_SECRET', () => {
    it('should throw error on module init', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            ignoreEnvFile: true,
            load: [
              () => ({
                NODE_ENV: 'test',
                DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
                REDIS_URL:
                  'redis://default:mDNmtwseaVHcQsCHaIoZapjlWrvAjtot@tramway.proxy.rlwy.net:13570',
              }),
            ],
          }),
        ],
        providers: [AppConfigService],
      }).compile();

      const service = module.get<AppConfigService>(AppConfigService);

      await expect(service.onModuleInit()).rejects.toThrow(/Configuration validation failed/);
    });
  });

  describe('with short JWT_SECRET', () => {
    it('should throw error on module init', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            ignoreEnvFile: true,
            load: [
              () => ({
                NODE_ENV: 'test',
                JWT_SECRET: 'too-short',
                DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
                REDIS_URL:
                  'redis://default:mDNmtwseaVHcQsCHaIoZapjlWrvAjtot@tramway.proxy.rlwy.net:13570',
              }),
            ],
          }),
        ],
        providers: [AppConfigService],
      }).compile();

      const service = module.get<AppConfigService>(AppConfigService);

      await expect(service.onModuleInit()).rejects.toThrow(/Configuration validation failed/);
    });
  });

  describe('with placeholder JWT_SECRET', () => {
    it('should throw error on module init', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            ignoreEnvFile: true,
            load: [
              () => ({
                NODE_ENV: 'test',
                JWT_SECRET: 'your-secret-key-that-is-very-long-but-still-bad',
                DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
                REDIS_URL:
                  'redis://default:mDNmtwseaVHcQsCHaIoZapjlWrvAjtot@tramway.proxy.rlwy.net:13570',
              }),
            ],
          }),
        ],
        providers: [AppConfigService],
      }).compile();

      const service = module.get<AppConfigService>(AppConfigService);

      await expect(service.onModuleInit()).rejects.toThrow(/Configuration validation failed/);
    });
  });

  describe('with missing DATABASE_URL', () => {
    it('should throw error on module init', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            ignoreEnvFile: true,
            load: [
              () => ({
                NODE_ENV: 'test',
                JWT_SECRET: 'a'.repeat(32),
                REDIS_URL:
                  'redis://default:mDNmtwseaVHcQsCHaIoZapjlWrvAjtot@tramway.proxy.rlwy.net:13570',
              }),
            ],
          }),
        ],
        providers: [AppConfigService],
      }).compile();

      const service = module.get<AppConfigService>(AppConfigService);

      await expect(service.onModuleInit()).rejects.toThrow(/Configuration validation failed/);
    });
  });

  describe('with missing REDIS_URL', () => {
    it('should throw error on module init', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            ignoreEnvFile: true,
            load: [
              () => ({
                NODE_ENV: 'test',
                JWT_SECRET: 'a'.repeat(32),
                DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
              }),
            ],
          }),
        ],
        providers: [AppConfigService],
      }).compile();

      const service = module.get<AppConfigService>(AppConfigService);

      await expect(service.onModuleInit()).rejects.toThrow(/Configuration validation failed/);
    });
  });

  describe('production mode validation', () => {
    it('should require FRONTEND_URL in production', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            ignoreEnvFile: true,
            load: [
              () => ({
                NODE_ENV: 'production',
                JWT_SECRET: 'a'.repeat(32),
                DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
                REDIS_URL:
                  'redis://default:mDNmtwseaVHcQsCHaIoZapjlWrvAjtot@tramway.proxy.rlwy.net:13570',
              }),
            ],
          }),
        ],
        providers: [AppConfigService],
      }).compile();

      const service = module.get<AppConfigService>(AppConfigService);

      await expect(service.onModuleInit()).rejects.toThrow(/Configuration validation failed/);
    });

    it('should require at least one AI API key in production', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            ignoreEnvFile: true,
            load: [
              () => ({
                NODE_ENV: 'production',
                JWT_SECRET: 'a'.repeat(32),
                DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
                REDIS_URL:
                  'redis://default:mDNmtwseaVHcQsCHaIoZapjlWrvAjtot@tramway.proxy.rlwy.net:13570',
                FRONTEND_URL: 'https://example.com',
              }),
            ],
          }),
        ],
        providers: [AppConfigService],
      }).compile();

      const service = module.get<AppConfigService>(AppConfigService);

      await expect(service.onModuleInit()).rejects.toThrow(/Configuration validation failed/);
    });

    it('should pass validation with all required production config', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            ignoreEnvFile: true,
            load: [
              () => ({
                NODE_ENV: 'production',
                JWT_SECRET: 'a'.repeat(32),
                DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
                REDIS_URL:
                  'redis://default:mDNmtwseaVHcQsCHaIoZapjlWrvAjtot@tramway.proxy.rlwy.net:13570',
                FRONTEND_URL: 'https://example.com',
                ANTHROPIC_API_KEY: 'test-api-key',
                CORS_ORIGINS: 'https://example.com',
              }),
            ],
          }),
        ],
        providers: [AppConfigService],
      }).compile();

      const service = module.get<AppConfigService>(AppConfigService);

      await expect(service.onModuleInit()).resolves.not.toThrow();
      expect(service.isProduction).toBe(true);
      expect(service.frontendUrl).toBe('https://example.com');
      expect(service.anthropicApiKey).toBe('test-api-key');
    });
  });

  describe('custom configuration getter', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            ignoreEnvFile: true,
            load: [
              () => ({
                NODE_ENV: 'test',
                JWT_SECRET: 'a'.repeat(32),
                DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
                REDIS_URL:
                  'redis://default:mDNmtwseaVHcQsCHaIoZapjlWrvAjtot@tramway.proxy.rlwy.net:13570',
                CUSTOM_KEY: 'custom-value',
              }),
            ],
          }),
        ],
        providers: [AppConfigService],
      }).compile();

      service = module.get<AppConfigService>(AppConfigService);
      await service.onModuleInit();
    });

    it('should get custom configuration value', () => {
      expect(service.get('CUSTOM_KEY')).toBe('custom-value');
    });

    it('should return default for missing key', () => {
      expect(service.get('MISSING_KEY', 'default')).toBe('default');
    });

    it('should throw for required missing key', () => {
      expect(() => service.getOrThrow('MISSING_KEY')).toThrow(
        /Required configuration value MISSING_KEY is not set/
      );
    });
  });
});
