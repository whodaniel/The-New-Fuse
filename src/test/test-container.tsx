import { Container } from "inversify";
import { ConfigService } from '../core/config/config-service.tsx';
import { DatabaseService } from '../core/database/database-service.tsx';
import type { TYPES } from '../core/di/types.tsx';

export async function createTestContainer(): Promise<Container> {
  const container = new Container();

  // Register mock services
  (container as any).bind<ConfigService>(TYPES.ConfigService).to(ConfigService);
  (container as any)
    .bind<DatabaseService>(TYPES.DatabaseService)
    .to(DatabaseService);

  return container;
}
