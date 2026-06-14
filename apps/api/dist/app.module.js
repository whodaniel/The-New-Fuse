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
// @ts-nocheck
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const event_emitter_1 = require("@nestjs/event-emitter");
const jwt_1 = require("@nestjs/jwt");
const throttler_1 = require("@nestjs/throttler");
const a2a_core_1 = require("@the-new-fuse/a2a-core");
const drizzle_1 = require("@the-new-fuse/database/drizzle");
const infrastructure_1 = require("@the-new-fuse/infrastructure");
const agents_module_1 = require("./agents/agents.module");
const brand_consistency_agent_module_1 = require("./agents/brand-consistency-agent.module");
const browser_hub_swarm_module_1 = require("./agents/browser-hub-swarm.module");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const cache_service_1 = require("./cache/cache.service");
const llm_provider_config_1 = __importDefault(require("./config/llm-provider.config"));
const security_config_1 = __importDefault(require("./config/security.config"));
const admin_openclaw_oauth_controller_1 = require("./controllers/admin-openclaw-oauth.controller");
const agent_grants_controller_1 = require("./controllers/agent-grants.controller");
const agent_handoff_controller_1 = require("./controllers/agent-handoff.controller");
const agent_pfp_overrides_controller_1 = require("./controllers/agent-pfp-overrides.controller");
const agent_proxy_controller_1 = require("./controllers/agent-proxy.controller");
const ai_controller_1 = require("./controllers/ai.controller");
const community_controller_1 = require("./controllers/community.controller");
const compounding_memory_controller_1 = require("./controllers/compounding-memory.controller");
const health_controller_1 = require("./controllers/health.controller");
const llm_intel_controller_1 = require("./controllers/llm-intel.controller");
const mcp_controller_1 = require("./controllers/mcp.controller");
const models_controller_1 = require("./controllers/models.controller");
const n8n_workflows_controller_1 = require("./controllers/n8n-workflows.controller");
const onboarding_controller_1 = require("./controllers/onboarding.controller");
const orchestration_controller_1 = require("./controllers/orchestration.controller");
const provider_keys_controller_1 = require("./controllers/provider-keys.controller");
const system_controller_1 = require("./controllers/system.controller");
const user_management_controller_1 = require("./controllers/user-management.controller");
const websocket_controller_1 = require("./controllers/websocket.controller");
const workflow_controller_1 = require("./controllers/workflow.controller");
const workspace_controller_1 = require("./controllers/workspace.controller");
const graphql_module_1 = require("./graphql/graphql.module");
const llm_provider_controller_1 = require("./llm/llm-provider.controller");
const llm_provider_service_1 = require("./llm/llm-provider.service");
const TNFMCPModule_1 = require("./mcp/TNFMCPModule");
const access_module_1 = require("./modules/access/access.module");
const admin_module_1 = require("./modules/admin/admin.module");
const agency_hub_module_1 = require("./modules/agency-hub/agency-hub.module");
const agent_module_1 = require("./modules/agent.module");
const goose_module_1 = require("./modules/agentic/goose/goose.module");
const auth_module_1 = require("./modules/auth/auth.module");
const billing_module_1 = require("./modules/billing/billing.module");
const chat_module_1 = require("./modules/chat/chat.module");
const ClaudeDevAutomationModule_1 = require("./modules/ClaudeDevAutomationModule");
const director_module_1 = require("./modules/director/director.module");
const entity_discovery_module_1 = require("./modules/discovery/entity-discovery.module");
const export_module_1 = require("./modules/export/export.module");
const marketplace_module_1 = require("./modules/marketplace/marketplace.module");
const prompt_templates_module_1 = require("./modules/prompt-templates.module");
const resources_module_1 = require("./modules/resources/resources.module");
const security_module_1 = require("./modules/security/security.module");
const task_module_1 = require("./modules/task/task.module"); // Migrated to Drizzle ORM
const terminals_module_1 = require("./modules/terminals/terminals.module");
const tnf_autonomous_module_1 = require("./modules/tnf-autonomous.module");
const unified_ledger_module_1 = require("./modules/unified-ledger/unified-ledger.module");
const webhooks_module_1 = require("./modules/webhooks/webhooks.module"); // Migrated to Drizzle ORM
const workflow_templates_module_1 = require("./modules/workflow-templates.module");
const monitoring_module_1 = require("./monitoring/monitoring.module");
const agent_api_grants_service_1 = require("./services/agent-api-grants.service");
const agent_handoff_service_1 = require("./services/agent-handoff.service");
const agent_pfp_overrides_service_1 = require("./services/agent-pfp-overrides.service");
const openclaw_oauth_rotation_service_1 = require("./services/openclaw-oauth-rotation.service");
const provider_keys_service_1 = require("./services/provider-keys.service");
const smart_account_module_1 = require("./smart-accounts/smart-account.module");
const transactions_module_1 = require("./transactions/transactions.module");
const wallets_module_1 = require("./wallets/wallets.module");
const web3auth_module_1 = require("./web3auth/web3auth.module");
const websocket_gateway_1 = require("./websocket/websocket.gateway");
// Security imports
const secure_auth_guard_1 = require("./guards/secure-auth.guard");
const security_guard_1 = require("./guards/security.guard");
const csrf_protection_middleware_1 = require("./middleware/csrf-protection.middleware");
const enhanced_error_handler_middleware_1 = require("./middleware/enhanced-error-handler.middleware");
const enhanced_security_middleware_1 = require("./middleware/enhanced-security.middleware");
const security_validation_middleware_1 = require("./middleware/security-validation.middleware");
const security_module_2 = require("./security/security.module");
const WorkflowExecutionService_1 = require("./services/workflow/WorkflowExecutionService");
const graphqlAdapterAvailable = (() => {
    try {
        require.resolve('@as-integrations/express5');
        return true;
    }
    catch {
        return false;
    }
})();
const enableGraphql = process.env.ENABLE_GRAPHQL !== 'false' && graphqlAdapterAvailable;
let AppModule = class AppModule {
    configure(consumer) {
        // Simplified middleware chain - only apply essential middleware
        // Removed: EnhancedErrorHandlerMiddleware (it's an error handler, not middleware)
        // Removed: SecurityValidationMiddleware, CsrfProtectionMiddleware (causing read-only issues)
        // TODO: Re-enable after fixing middleware implementation
        consumer
            .apply(enhanced_security_middleware_1.EnhancedSecurityMiddleware)
            .exclude('agents/(.*)', 'a2a/(.*)', 'system/(.*)') // Global prefix adds /api
            .forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            security_module_2.SecurityModule, // Global security services
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['../../.env', '.env.local', '.env'],
                load: [llm_provider_config_1.default, security_config_1.default],
            }),
            // Event Emitter for inter-service communication (must be configured at root level)
            event_emitter_1.EventEmitterModule.forRoot({
                wildcard: true,
                delimiter: '.',
                maxListeners: 20,
                verboseMemoryLeak: true,
            }),
            // Database modules - Drizzle ORM (production ready)
            drizzle_1.DrizzleModule.forRootAsync(), // New Drizzle ORM - production ready
            infrastructure_1.StorageModule.forRoot(),
            // NOTE: ScheduleModule removed - not currently used and causes Reflector dependency issues
            jwt_1.JwtModule.registerAsync({
                global: true,
                imports: [config_1.ConfigModule],
                useFactory: (config) => ({
                    secret: config.get('JWT_SECRET'),
                    signOptions: { expiresIn: '15m' },
                }),
                inject: [config_1.ConfigService],
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000, // 60 seconds in milliseconds
                    limit: 10,
                },
            ]),
            access_module_1.AccessModule,
            auth_module_1.AuthModule,
            agent_module_1.AgentModule, // Add our new agent module
            agents_module_1.AgentsModule, // Self-Improvement Agents Module
            agency_hub_module_1.AgencyHubModule, // Agency Hub with Swarm coordination
            goose_module_1.GooseModule, // Goose CLI dispatch bridge under policy
            chat_module_1.ChatModule,
            task_module_1.TaskModule, // Task management - Migrated to Drizzle ORM
            entity_discovery_module_1.EntityDiscoveryModule,
            ClaudeDevAutomationModule_1.ClaudeDevAutomationModule,
            director_module_1.DirectorModule,
            admin_module_1.AdminModule, // Admin operations and role management
            export_module_1.ExportModule, // Data export functionality
            security_module_1.SecurityModule, // Security testing and validation
            TNFMCPModule_1.TNFMCPModule, // Add The New Fuse MCP Module
            a2a_core_1.A2ACoreModule.forRoot(), // Add A2A Protocol Module
            webhooks_module_1.WebhooksModule, // Webhook management - Migrated to Drizzle ORM
            wallets_module_1.WalletsModule, // Web3Auth Wallet Module
            transactions_module_1.TransactionsModule, // Blockchain Transaction Module
            web3auth_module_1.Web3authModule, // Web3Auth Integration Module
            smart_account_module_1.SmartAccountModule, // Smart Account (ERC-4337) Module
            monitoring_module_1.MonitoringModule, // Wallet Platform Monitoring
            workflow_templates_module_1.WorkflowTemplatesModule,
            prompt_templates_module_1.PromptTemplatesModule,
            marketplace_module_1.MarketplaceModule,
            resources_module_1.ResourcesModule,
            terminals_module_1.TerminalsModule,
            unified_ledger_module_1.UnifiedLedgerModule,
            brand_consistency_agent_module_1.BrandConsistencyAgentModule, // Self-Improving Brand Consistency Agent
            browser_hub_swarm_module_1.BrowserHubSwarmModule, // Browser Hub Improvement Agent Swarm
            ...(enableGraphql ? [graphql_module_1.GraphqlModule] : []), // GraphQL API (optional in local runtime)
            tnf_autonomous_module_1.TNFAutonomousModule, // 🔮 Autonomous System (Director, BMAD, Swarm)
            billing_module_1.BillingModule,
        ],
        controllers: [
            app_controller_1.AppController,
            a2a_core_1.A2AController,
            health_controller_1.HealthController, // CRITICAL: Health checks for monitoring/K8s
            llm_provider_controller_1.LLMProviderController,
            mcp_controller_1.MCPServerController, // MCP server management (20+ endpoints)
            agent_pfp_overrides_controller_1.AgentPfpOverridesController,
            agent_grants_controller_1.AgentGrantsController,
            agent_handoff_controller_1.AgentHandoffController,
            agent_proxy_controller_1.AgentProxyController,
            ai_controller_1.AiController,
            community_controller_1.CommunityController,
            compounding_memory_controller_1.CompoundingMemoryController,
            llm_intel_controller_1.LLMIntelController,
            models_controller_1.ModelsController, // AI model provider selection
            system_controller_1.SystemController,
            user_management_controller_1.UserManagementController, // User CRUD operations
            websocket_controller_1.WebSocketController,
            workflow_controller_1.WorkflowController,
            workspace_controller_1.WorkspaceController, // Multi-workspace support
            provider_keys_controller_1.ProviderKeysController, // Per-user provider API key management
            orchestration_controller_1.OrchestrationController, // Tenant-aware orchestration chat endpoint
            admin_openclaw_oauth_controller_1.AdminOpenClawOAuthController,
            n8n_workflows_controller_1.N8nWorkflowsController,
            onboarding_controller_1.OnboardingController,
        ],
        providers: [
            app_service_1.AppService,
            cache_service_1.CacheService,
            websocket_gateway_1.WebsocketGateway,
            // LLM Provider Services
            {
                provide: llm_provider_service_1.LLM_REGISTRY,
                useClass: llm_provider_service_1.MockLLMRegistry,
            },
            llm_provider_service_1.LLMProviderService,
            agent_pfp_overrides_service_1.AgentPfpOverridesService,
            provider_keys_service_1.ProviderKeysService,
            openclaw_oauth_rotation_service_1.OpenClawOAuthRotationService,
            agent_api_grants_service_1.AgentApiGrantsService,
            agent_handoff_service_1.AgentHandoffService,
            WorkflowExecutionService_1.WorkflowExecutionService,
            // Middleware
            security_validation_middleware_1.SecurityValidationMiddleware,
            csrf_protection_middleware_1.CsrfProtectionMiddleware,
            enhanced_security_middleware_1.EnhancedSecurityMiddleware,
            enhanced_error_handler_middleware_1.EnhancedErrorHandlerMiddleware,
            // Global security guards (in order of precedence)
            {
                provide: core_1.APP_GUARD,
                useClass: security_guard_1.SecurityGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: secure_auth_guard_1.SecureAuthGuard,
            },
            // Global validation pipe
            {
                provide: core_1.APP_PIPE,
                useValue: new common_1.ValidationPipe({
                    transform: true,
                    whitelist: true,
                    forbidNonWhitelisted: true,
                    forbidUnknownValues: true,
                    disableErrorMessages: process.env.NODE_ENV === 'production',
                    validationError: {
                        target: false,
                        value: false,
                    },
                }),
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map