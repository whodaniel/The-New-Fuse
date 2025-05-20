import { Container } from "inversify";
import { ConfigService } from '../core/config/config-service.js';
import { DatabaseService } from '../core/database/database-service.js';
import type { TYPES } from '../core/di/types.js';

export async function createTestContainer(): Promise<Container> {
  const container = new Container();

  // Register mock services
  (container as any).bind<ConfigService>(TYPES.ConfigService).to(ConfigService);
  (container as any)
    .bind<DatabaseService>(TYPES.DatabaseService)
    .to(DatabaseService);

  return container;
}
