"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import { DatabaseService } from '@the-new-fuse/core/database';
// import { ConfigService } from '@the-new-fuse/core/config';
// import { TYPES } from '@the-new-fuse/core/di/types';
const test_container_1 = require("./test-container");
let container;
let connection;
beforeAll(async () => {
    // Create test container with mocked services
    container = await (0, test_container_1.createTestContainer)();
    // Initialize test database
    const dbService = container.get(TYPES.DatabaseService);
    connection = await dbService.getConnection();
    // Run migrations
    await connection.runMigrations();
});
afterAll(async () => {
    // Close database connection
    if (connection) {
        await connection.close();
    }
});
