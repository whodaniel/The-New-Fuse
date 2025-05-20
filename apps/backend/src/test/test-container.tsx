import { Container } from 'inversify';
import { ConfigService, DatabaseService, TYPES } from '@the-new-fuse/core';

export async function createTestContainer(): Promise<Container> {
  const container = new Container();

  // Register mock services
  container.bind<ConfigService>(TYPES.ConfigService).to(ConfigService);
  container.bind<DatabaseService>(TYPES.DatabaseService).to(DatabaseService);

  return container;
}
