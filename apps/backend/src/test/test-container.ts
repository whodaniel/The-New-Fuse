import { Container } from 'inversify';
import { TYPES } from '../core/di/types';

export async function createTestContainer(): Promise<Container> {
  const container = new Container();

  // Mock ConfigService
  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'NODE_ENV') return 'test';
      return null;
    }),
  };
  container.bind(TYPES.ConfigService).toConstantValue(mockConfigService);

  // Mock DatabaseService
  const mockDatabaseService = {
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    client: {},
    isConnected: true,
    users: {},
    agents: {},
    agentApiGrants: {},
    agentManagedAccounts: {},
    jules: {},
    chats: {},
    tasks: {},
    workflows: {},
    workspaces: {},
    workspaceMembers: {},
    webhooks: {},
    apiLogs: {},
    wallets: {},
    llmConfigs: {},
    providerApiKeys: {},
    executeRaw: jest.fn(),
    healthCheck: jest.fn().mockResolvedValue(true),
    transaction: jest.fn(),
  };
  container.bind(TYPES.DatabaseService).toConstantValue(mockDatabaseService);

  return container;
}
