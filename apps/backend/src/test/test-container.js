import { Container } from 'inversify';
// import { ConfigService, DatabaseService, TYPES } from '@the-new-fuse/core';
export async function createTestContainer() {
    const container = new Container();
    // Register mock services
    container.bind(TYPES.ConfigService).to(ConfigService);
    container.bind(TYPES.DatabaseService).to(DatabaseService);
    return container;
}
