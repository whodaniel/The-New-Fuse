"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const throttler_1 = require("@nestjs/throttler");
const llm_provider_config_1 = __importDefault(require("./config/llm-provider.config"));
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const auth_module_1 = require("./modules/auth/auth.module");
const agent_module_1 = require("./modules/agent.module");
const chat_module_1 = require("./modules/chat/chat.module");
const task_module_1 = require("./modules/task/task.module");
const cache_service_1 = require("./cache/cache.service");
const websocket_gateway_1 = require("./websocket/websocket.gateway");
const monitoring_service_1 = require("./services/monitoring.service");
const monitoring_controller_1 = require("./controllers/monitoring.controller");
const entity_discovery_module_1 = require("./modules/discovery/entity-discovery.module");
const ClaudeDevAutomationModule_1 = require("./modules/ClaudeDevAutomationModule");
const TNFMCPModule_1 = require("./mcp/TNFMCPModule");
const a2a_core_1 = require("@the-new-fuse/a2a-core");
const database_1 = require("@the-new-fuse/database");
const wallets_module_1 = require("./wallets/wallets.module");
const transactions_module_1 = require("./transactions/transactions.module");
const web3auth_module_1 = require("./web3auth/web3auth.module");
const smart_account_module_1 = require("./smart-accounts/smart-account.module");
const monitoring_module_1 = require("./monitoring/monitoring.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [llm_provider_config_1.default],
            }),
            // Use Prisma instead of TypeORM
            database_1.DatabaseModule,
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: (config) => ({
                    secret: config.get('JWT_SECRET'),
                    signOptions: { expiresIn: '15m' },
                }),
                inject: [config_1.ConfigService],
            }),
            throttler_1.ThrottlerModule.forRoot([{
                    ttl: 60000, // 60 seconds in milliseconds
                    limit: 10,
                }]),
            auth_module_1.AuthModule,
            agent_module_1.AgentModule, // Add our new agent module
            chat_module_1.ChatModule,
            task_module_1.TaskModule,
            entity_discovery_module_1.EntityDiscoveryModule,
            ClaudeDevAutomationModule_1.ClaudeDevAutomationModule,
            TNFMCPModule_1.TNFMCPModule, // Add The New Fuse MCP Module
            a2a_core_1.A2ACoreModule.forRoot(), // Add A2A Protocol Module
            wallets_module_1.WalletsModule, // Web3Auth Wallet Module
            transactions_module_1.TransactionsModule, // Blockchain Transaction Module
            web3auth_module_1.Web3authModule, // Web3Auth Integration Module
            smart_account_module_1.SmartAccountModule, // Smart Account (ERC-4337) Module
            monitoring_module_1.MonitoringModule, // Wallet Platform Monitoring
        ],
        controllers: [app_controller_1.AppController, monitoring_controller_1.MonitoringController, a2a_core_1.A2AController],
        providers: [app_service_1.AppService, cache_service_1.CacheService, monitoring_service_1.MonitoringService, websocket_gateway_1.WebsocketGateway],
    })
], AppModule);
