"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestContainer = createTestContainer;
const inversify_1 = require("inversify");
// import { ConfigService, DatabaseService, TYPES } from '@the-new-fuse/core';
async function createTestContainer() {
    const container = new inversify_1.Container();
    // Register mock services
    container.bind(TYPES.ConfigService).to(ConfigService);
    container.bind(TYPES.DatabaseService).to(DatabaseService);
    return container;
}
