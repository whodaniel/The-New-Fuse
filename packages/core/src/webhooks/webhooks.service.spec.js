"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const webhooks_service_1 = require("./webhooks.service");
describe('WebhooksService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [webhooks_service_1.WebhooksService],
        }).compile();
        service = module.get(webhooks_service_1.WebhooksService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
//# sourceMappingURL=webhooks.service.spec.js.map