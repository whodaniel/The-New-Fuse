// filepath: src/core/di/container.ts
import { Container } from "inversify";
import TYPES from './types.js';
import { ConfigService } from '../config/config.service.js';
import { DatabaseService } from '../database/database.service.js';
import { LoggingService } from '../logging/logging.service.js';
import { CacheService } from '../cache/cache.service.js';
import { SecurityService } from '../security/security-service.js';
import { TimeService } from '../time/time.service.js';
import { ErrorHandler } from '../errors/error-handler.js';

const container = new Container();

// Register core services
(container as any)
  .bind(TYPES.ConfigService)
  .to(ConfigService)
  .inSingletonScope();
(container as any)
  .bind(TYPES.DatabaseService)
  .to(DatabaseService)
  .inSingletonScope();
(container as any)
  .bind(TYPES.LoggingService)
  .to(LoggingService)
  .inSingletonScope();
(container as any).bind(TYPES.CacheService).to(CacheService).inSingletonScope();
(container as any)
  .bind(TYPES.SecurityService)
  .to(SecurityService)
  .inSingletonScope();
(container as any).bind(TYPES.TimeService).to(TimeService).inSingletonScope();
(container as any).bind(TYPES.ErrorHandler).to(ErrorHandler).inSingletonScope();

// Register aliases
(container as any).bind(TYPES.Config).toService(TYPES.ConfigService);
(container as any).bind(TYPES.Logger).toService(TYPES.LoggingService);
(container as any).bind(TYPES.Cache).toService(TYPES.CacheService);
(container as any).bind(TYPES.Time).toService(TYPES.TimeService);

export { container };
