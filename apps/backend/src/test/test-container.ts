import { Container } from 'inversify';
import { TYPES } from '../core/di/types';

export async function createTestContainer(): Promise<Container> {
  const container = new Container();

  // Create mock objects without Jest dependency to avoid type errors
  const mockConfigService = {
    get: () => null,
    set: () => {},
  };

  const mockDatabaseService = {
    executeRaw: async () => [],
    users: {},
    agents: {},
  };

  // Register mock services here
  container.bind(TYPES.ConfigService).toConstantValue(mockConfigService);
  container.bind(TYPES.DatabaseService).toConstantValue(mockDatabaseService);

  return container;
}
