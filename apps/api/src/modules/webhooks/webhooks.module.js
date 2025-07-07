"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const webhooks_controller_1 = require("./webhooks.controller");
const webhooks_service_1 = require("./webhooks.service");
const business_event_service_1 = require("./services/business-event.service");
const webhook_security_service_1 = require("./services/webhook-security.service");
const sse_service_1 = require("./services/sse.service");
const integration_service_1 = require("./services/integration.service");
const business_event_entity_1 = require("./entities/business-event.entity");
const webhook_configuration_entity_1 = require("./entities/webhook-configuration.entity");
const sse_subscription_entity_1 = require("./entities/sse-subscription.entity");
const webhook_delivery_log_entity_1 = require("./entities/webhook-delivery-log.entity");
const business_analytics_entity_1 = require("./entities/business-analytics.entity");
const ai_insight_entity_1 = require("./entities/ai-insight.entity");
let WebhooksModule = class WebhooksModule {
};
exports.WebhooksModule = WebhooksModule;
exports.WebhooksModule = WebhooksModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                business_event_entity_1.BusinessEvent,
                webhook_configuration_entity_1.WebhookConfiguration,
                sse_subscription_entity_1.SseSubscription,
                webhook_delivery_log_entity_1.WebhookDeliveryLog,
                business_analytics_entity_1.BusinessAnalytics,
                ai_insight_entity_1.AiInsight,
            ]),
        ],
        controllers: [webhooks_controller_1.WebhooksController],
        providers: [
            webhooks_service_1.WebhooksService,
            business_event_service_1.BusinessEventService,
            webhook_security_service_1.WebhookSecurityService,
            sse_service_1.SSEService,
            integration_service_1.IntegrationService,
        ],
        exports: [
            webhooks_service_1.WebhooksService,
            business_event_service_1.BusinessEventService,
            sse_service_1.SSEService,
            integration_service_1.IntegrationService,
        ],
    })
], WebhooksModule);
