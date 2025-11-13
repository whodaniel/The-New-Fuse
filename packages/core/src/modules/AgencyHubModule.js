"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AgencyHubModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgencyHubModule = void 0;
const common_1 = require("@nestjs/common");
const LoggingService_1 = require("../services/LoggingService");
const MetricsService_1 = require("../services/MetricsService");
const CommunicationService_1 = require("../services/CommunicationService");
const MessagingService_1 = require("../services/MessagingService");
const MonitoringService_1 = require("../services/MonitoringService");
const WebhookManagerService_1 = require("../services/WebhookManagerService");
const TaskService_1 = require("../services/TaskService");
const UserService_1 = require("../services/UserService");
const A2AService_1 = require("../services/A2AService");
const AgencyHubService_1 = require("../services/AgencyHubService");
const AgencyHubController_1 = require("../controllers/AgencyHubController");
const AgencyHubGateway_1 = require("../gateways/AgencyHubGateway");
const AgencyHubGuard_1 = require("../guards/AgencyHubGuard");
const AgencyHubInterceptor_1 = require("../interceptors/AgencyHubInterceptor");
const AgencyHubPipe_1 = require("../pipes/AgencyHubPipe");
const AgencyHubExceptionFilter_1 = require("../filters/AgencyHubExceptionFilter");
const AgencyHubHealthIndicator_1 = require("../health/AgencyHubHealthIndicator");
let AgencyHubModule = AgencyHubModule_1 = class AgencyHubModule {
    static forRoot(options = {}) {
        return {
            module: AgencyHubModule_1,
            providers: [
                {
                    provide: 'AGENCY_HUB_MODULE_OPTIONS',
                    useValue: options,
                },
                {
                    provide: 'AGENCY_HUB_ID',
                    useFactory: () => {
                        return options.hubId || process.env.AGENCY_HUB_ID || `hub_${Date.now()}`;
                    },
                },
                {
                    provide: 'AGENCY_HUB_NAME',
                    useFactory: () => {
                        return options.hubName || process.env.AGENCY_HUB_NAME || 'Default Agency Hub';
                    },
                },
                {
                    provide: 'AGENCY_HUB_TYPE',
                    useFactory: () => {
                        return options.hubType || process.env.AGENCY_HUB_TYPE || 'coordinator';
                    },
                },
                {
                    provide: 'AGENCY_HUB_MAX_AGENTS',
                    useFactory: () => {
                        return options.maxAgents || parseInt(process.env.AGENCY_HUB_MAX_AGENTS || '100', 10);
                    },
                },
                {
                    provide: 'AGENCY_HUB_MAX_CONNECTIONS',
                    useFactory: () => {
                        return options.maxConnections || parseInt(process.env.AGENCY_HUB_MAX_CONNECTIONS || '1000', 10);
                    },
                },
                {
                    provide: 'AGENCY_HUB_HEARTBEAT_INTERVAL',
                    useFactory: () => {
                        return options.heartbeatInterval || parseInt(process.env.AGENCY_HUB_HEARTBEAT_INTERVAL || '30000', 10);
                    },
                },
                {
                    provide: 'AGENCY_HUB_MESSAGE_TIMEOUT',
                    useFactory: () => {
                        return options.messageTimeout || parseInt(process.env.AGENCY_HUB_MESSAGE_TIMEOUT || '30000', 10);
                    },
                },
                {
                    provide: 'AGENCY_HUB_RETRY_ATTEMPTS',
                    useFactory: () => {
                        return options.retryAttempts || parseInt(process.env.AGENCY_HUB_RETRY_ATTEMPTS || '3', 10);
                    },
                },
                {
                    provide: 'AGENCY_HUB_RETRY_DELAY',
                    useFactory: () => {
                        return options.retryDelay || parseInt(process.env.AGENCY_HUB_RETRY_DELAY || '1000', 10);
                    },
                },
                {
                    provide: 'AGENCY_HUB_ENABLE_DISCOVERY',
                    useFactory: () => {
                        return options.enableDiscovery !== undefined ? options.enableDiscovery : (process.env.AGENCY_HUB_ENABLE_DISCOVERY === 'true' || true);
                    },
                },
                {
                    provide: 'AGENCY_HUB_ENABLE_LOAD_BALANCING',
                    useFactory: () => {
                        return options.enableLoadBalancing !== undefined ? options.enableLoadBalancing : (process.env.AGENCY_HUB_ENABLE_LOAD_BALANCING === 'true' || true);
                    },
                },
                {
                    provide: 'AGENCY_HUB_ENABLE_HEALTH_CHECKS',
                    useFactory: () => {
                        return options.enableHealthChecks !== undefined ? options.enableHealthChecks : (process.env.AGENCY_HUB_ENABLE_HEALTH_CHECKS === 'true' || true);
                    },
                },
                {
                    provide: 'AGENCY_HUB_ENABLE_METRICS',
                    useFactory: () => {
                        return options.enableMetrics !== undefined ? options.enableMetrics : (process.env.AGENCY_HUB_ENABLE_METRICS === 'true' || true);
                    },
                },
                {
                    provide: 'AGENCY_HUB_ENABLE_LOGGING',
                    useFactory: () => {
                        return options.enableLogging !== undefined ? options.enableLogging : (process.env.AGENCY_HUB_ENABLE_LOGGING === 'true' || true);
                    },
                },
                {
                    provide: 'AGENCY_HUB_ENABLE_SECURITY',
                    useFactory: () => {
                        return options.enableSecurity !== undefined ? options.enableSecurity : (process.env.AGENCY_HUB_ENABLE_SECURITY === 'true' || true);
                    },
                },
            ],
        };
    }
    static forRootAsync(options) {
        return {
            module: AgencyHubModule_1,
            imports: options.imports || [],
            providers: [
                {
                    provide: 'AGENCY_HUB_MODULE_OPTIONS',
                    useFactory: options.useFactory || (() => ({})),
                    inject: options.inject || [],
                },
            ],
        };
    }
    static forFeature(options = {}) {
        return {
            module: AgencyHubModule_1,
            providers: [
                {
                    provide: 'AGENCY_HUB_FEATURE_OPTIONS',
                    useValue: options,
                },
            ],
        };
    }
};
exports.AgencyHubModule = AgencyHubModule;
exports.AgencyHubModule = AgencyHubModule = AgencyHubModule_1 = __decorate([
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
            TaskService_1.TaskService,
            UserService_1.UserService,
            A2AService_1.A2AService,
            AgencyHubService_1.AgencyHubService,
            AgencyHubGateway_1.AgencyHubGateway,
            AgencyHubGuard_1.AgencyHubGuard,
            AgencyHubInterceptor_1.AgencyHubInterceptor,
            AgencyHubPipe_1.AgencyHubPipe,
            AgencyHubExceptionFilter_1.AgencyHubExceptionFilter,
            AgencyHubHealthIndicator_1.AgencyHubHealthIndicator,
        ],
        controllers: [AgencyHubController_1.AgencyHubController],
        exports: [
            LoggingService_1.LoggingService,
            MetricsService_1.MetricsService,
            CommunicationService_1.CommunicationService,
            MessagingService_1.MessagingService,
            MonitoringService_1.MonitoringService,
            WebhookManagerService_1.WebhookManagerService,
            TaskService_1.TaskService,
            UserService_1.UserService,
            A2AService_1.A2AService,
            AgencyHubService_1.AgencyHubService,
            AgencyHubGateway_1.AgencyHubGateway,
            AgencyHubGuard_1.AgencyHubGuard,
            AgencyHubInterceptor_1.AgencyHubInterceptor,
            AgencyHubPipe_1.AgencyHubPipe,
            AgencyHubExceptionFilter_1.AgencyHubExceptionFilter,
            AgencyHubHealthIndicator_1.AgencyHubHealthIndicator,
        ],
    })
], AgencyHubModule);
exports.default = AgencyHubModule;
//# sourceMappingURL=AgencyHubModule.js.map