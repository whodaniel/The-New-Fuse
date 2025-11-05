"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestContainer = createTestContainer;
const inversify_1 = require("inversify");
const core_1 = require("@the-new-fuse/core");
async function createTestContainer() {
    const container = new inversify_1.Container();
    // Register mock services
    container.bind(core_1.TYPES.ConfigService).to(core_1.ConfigService);
    container.bind(core_1.TYPES.DatabaseService).to(core_1.DatabaseService);
    return container;
}
//# sourceMappingURL=test-container.js.map