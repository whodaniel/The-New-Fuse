"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const webhook_manager_service_1 = require("./services/webhook-manager.service");
describe('WebhookManagerService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [webhook_manager_service_1.WebhookManagerService],
        }).compile();
        service = module.get(webhook_manager_service_1.WebhookManagerService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
//# sourceMappingURL=webhook-manager.service.spec.js.map