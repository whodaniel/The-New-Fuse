import { Container } from 'inversify';

// TODO: Implement test container with proper service mocks
// See git history for previous ConfigService and DatabaseService bindings

export async function createTestContainer(): Promise<Container> {
  const container = new Container();
  // Register mock services here
  return container;
}
