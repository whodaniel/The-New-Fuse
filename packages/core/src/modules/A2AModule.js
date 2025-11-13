"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var A2AModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.A2AModule = void 0;
const common_1 = require("@nestjs/common");
const LoggingService_1 = require("../services/LoggingService");
const MetricsService_1 = require("../services/MetricsService");
const CommunicationService_1 = require("../services/CommunicationService");
const MessagingService_1 = require("../services/MessagingService");
const MonitoringService_1 = require("../services/MonitoringService");
const WebhookManagerService_1 = require("../services/WebhookManagerService");
const WebhooksController_1 = require("../controllers/WebhooksController");
const A2AService_1 = require("../services/A2AService");
const A2AController_1 = require("../controllers/A2AController");
const A2AGateway_1 = require("../gateways/A2AGateway");
const A2AGuard_1 = require("../guards/A2AGuard");
const A2AInterceptor_1 = require("../interceptors/A2AInterceptor");
const A2APipe_1 = require("../pipes/A2APipe");
const A2AExceptionFilter_1 = require("../filters/A2AExceptionFilter");
const A2AHealthIndicator_1 = require("../health/A2AHealthIndicator");
let A2AModule = A2AModule_1 = class A2AModule {
    static forRoot(options = {}) {
        return {
            module: A2AModule_1,
            providers: [
                {
                    provide: 'A2A_MODULE_OPTIONS',
                    useValue: options,
                },
                {
                    provide: 'A2A_AGENT_ID',
                    useFactory: () => {
                        return options.agentId || process.env.A2A_AGENT_ID || `agent_${Date.now()}`;
                    },
                },
                {
                    provide: 'A2A_AGENT_NAME',
                    useFactory: () => {
                        return options.agentName || process.env.A2A_AGENT_NAME || 'Default Agent';
                    },
                },
                {
                    provide: 'A2A_AGENT_TYPE',
                    useFactory: () => {
                        return options.agentType || process.env.A2A_AGENT_TYPE || 'worker';
                    },
                },
                {
                    provide: 'A2A_CAPABILITIES',
                    useFactory: () => {
                        return options.capabilities || (process.env.A2A_CAPABILITIES ? JSON.parse(process.env.A2A_CAPABILITIES) : []);
                    },
                },
                {
                    provide: 'A2A_MAX_CONNECTIONS',
                    useFactory: () => {
                        return options.maxConnections || parseInt(process.env.A2A_MAX_CONNECTIONS || '100', 10);
                    },
                },
                {
                    provide: 'A2A_HEARTBEAT_INTERVAL',
                    useFactory: () => {
                        return options.heartbeatInterval || parseInt(process.env.A2A_HEARTBEAT_INTERVAL || '30000', 10);
                    },
                },
                {
                    provide: 'A2A_MESSAGE_TIMEOUT',
                    useFactory: () => {
                        return options.messageTimeout || parseInt(process.env.A2A_MESSAGE_TIMEOUT || '30000', 10);
                    },
                },
                {
                    provide: 'A2A_RETRY_ATTEMPTS',
                    useFactory: () => {
                        return options.retryAttempts || parseInt(process.env.A2A_RETRY_ATTEMPTS || '3', 10);
                    },
                },
                {
                    provide: 'A2A_RETRY_DELAY',
                    useFactory: () => {
                        return options.retryDelay || parseInt(process.env.A2A_RETRY_DELAY || '1000', 10);
                    },
                },
                {
                    provide: 'A2A_ENABLE_DISCOVERY',
                    useFactory: () => {
                        return options.enableDiscovery !== undefined ? options.enableDiscovery : (process.env.A2A_ENABLE_DISCOVERY === 'true' || true);
                    },
                },
                {
                    provide: 'A2A_ENABLE_LOAD_BALANCING',
                    useFactory: () => {
                        return options.enableLoadBalancing !== undefined ? options.enableLoadBalancing : (process.env.A2A_ENABLE_LOAD_BALANCING === 'true' || true);
                    },
                },
                {
                    provide: 'A2A_ENABLE_HEALTH_CHECKS',
                    useFactory: () => {
                        return options.enableHealthChecks !== undefined ? options.enableHealthChecks : (process.env.A2A_ENABLE_HEALTH_CHECKS === 'true' || true);
                    },
                },
                {
                    provide: 'A2A_ENABLE_METRICS',
                    useFactory: () => {
                        return options.enableMetrics !== undefined ? options.enableMetrics : (process.env.A2A_ENABLE_METRICS === 'true' || true);
                    },
                },
                {
                    provide: 'A2A_ENABLE_LOGGING',
                    useFactory: () => {
                        return options.enableLogging !== undefined ? options.enableLogging : (process.env.A2A_ENABLE_LOGGING === 'true' || true);
                    },
                },
                {
                    provide: 'A2A_ENABLE_SECURITY',
                    useFactory: () => {
                        return options.enableSecurity !== undefined ? options.enableSecurity : (process.env.A2A_ENABLE_SECURITY === 'true' || true);
                    },
                },
            ],
        };
    }
    static forRootAsync(options) {
        return {
            module: A2AModule_1,
            imports: options.imports || [],
            providers: [
                {
                    provide: 'A2A_MODULE_OPTIONS',
                    useFactory: options.useFactory || (() => ({})),
                    inject: options.inject || [],
                },
            ],
        };
    }
    static forFeature(options = {}) {
        return {
            module: A2AModule_1,
            providers: [
                {
                    provide: 'A2A_FEATURE_OPTIONS',
                    useValue: options,
                },
            ],
        };
    }
};
exports.A2AModule = A2AModule;
exports.A2AModule = A2AModule = A2AModule_1 = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
        // Removed ConfigModule for build compatibility
        ],
        providers: [
            LoggingService_1.LoggingService,
            MetricsService_1.MetricsService,
            CommunicationService_1.CommunicationService,
            MessagingService_1.MessagingService,
            MonitoringService_1.MonitoringService,
            WebhookManagerService_1.WebhookManagerService,
            A2AService_1.A2AService,
            A2AGateway_1.A2AGateway,
            A2AGuard_1.A2AGuard,
            A2AInterceptor_1.A2AInterceptor,
            A2APipe_1.A2APipe,
            A2AExceptionFilter_1.A2AExceptionFilter,
            A2AHealthIndicator_1.A2AHealthIndicator,
        ],
        controllers: [A2AController_1.A2AController, WebhooksController_1.WebhooksController],
        exports: [
            LoggingService_1.LoggingService,
            MetricsService_1.MetricsService,
            CommunicationService_1.CommunicationService,
            MessagingService_1.MessagingService,
            MonitoringService_1.MonitoringService,
            WebhookManagerService_1.WebhookManagerService,
            A2AService_1.A2AService,
            A2AGateway_1.A2AGateway,
            A2AGuard_1.A2AGuard,
            A2AInterceptor_1.A2AInterceptor,
            A2APipe_1.A2APipe,
            A2AExceptionFilter_1.A2AExceptionFilter,
            A2AHealthIndicator_1.A2AHealthIndicator,
        ],
    })
], A2AModule);
exports.default = A2AModule;
//# sourceMappingURL=A2AModule.js.map