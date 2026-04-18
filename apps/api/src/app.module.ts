// @ts-nocheck
import { MiddlewareConsumer, Module, NestModule, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
// @ts-ignore
// @ts-ignore
import { A2AController, A2ACoreModule } from '@the-new-fuse/a2a-core';

// @ts-ignore
// @ts-ignore
// @ts-ignore
import { DrizzleModule } from '@the-new-fuse/database/drizzle';
// @ts-ignore
// @ts-ignore
import { StorageModule } from '@the-new-fuse/infrastructure';
import { AgentsModule } from './agents/agents.module.js';
import { BrandConsistencyAgentModule } from './agents/brand-consistency-agent.module.js';
import { BrowserHubSwarmModule } from './agents/browser-hub-swarm.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { CacheService } from './cache/cache.service.js';
import llmProviderConfig from './config/llm-provider.config.js';
import securityConfig from './config/security.config.js';
import { AdminOpenClawOAuthController } from './controllers/admin-openclaw-oauth.controller.js';
import { AgentGrantsController } from './controllers/agent-grants.controller.js';
import { AgentHandoffController } from './controllers/agent-handoff.controller.js';
import { AgentPfpOverridesController } from './controllers/agent-pfp-overrides.controller.js';
import { AgentProxyController } from './controllers/agent-proxy.controller.js';
import { AiController } from './controllers/ai.controller.js';
import { CommunityController } from './controllers/community.controller.js';
import { HealthController } from './controllers/health.controller.js';
import { MCPServerController } from './controllers/mcp.controller.js';
import { ModelsController } from './controllers/models.controller.js';
import { N8nWorkflowsController } from './controllers/n8n-workflows.controller.js';
import { OnboardingController } from './controllers/onboarding.controller.js';
import { OrchestrationController } from './controllers/orchestration.controller.js';
import { ProviderKeysController } from './controllers/provider-keys.controller.js';
import { SystemController } from './controllers/system.controller.js';
import { UserManagementController } from './controllers/user-management.controller.js';
import { WebSocketController } from './controllers/websocket.controller.js';
import { WorkflowController } from './controllers/workflow.controller.js';
import { WorkspaceController } from './controllers/workspace.controller.js';
import { GraphqlModule } from './graphql/graphql.module.js';
import { LLMProviderController } from './llm/llm-provider.controller.js';
import { LLMProviderService, LLM_REGISTRY, MockLLMRegistry } from './llm/llm-provider.service.js';
import { TNFMCPModule } from './mcp/TNFMCPModule.js';
import { AccessModule } from './modules/access/access.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { AgencyHubModule } from './modules/agency-hub/agency-hub.module.js';
import { AgentModule } from './modules/agent.module.js';
import { GooseModule } from './modules/agentic/goose/goose.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { BillingModule } from './modules/billing/billing.module.js';
import { ChatModule } from './modules/chat/chat.module.js';
import { ClaudeDevAutomationModule } from './modules/ClaudeDevAutomationModule.js';
import { DirectorModule } from './modules/director/director.module.js';
import { EntityDiscoveryModule } from './modules/discovery/entity-discovery.module.js';
import { ExportModule } from './modules/export/export.module.js';
import { MarketplaceModule } from './modules/marketplace/marketplace.module.js';
import { PromptTemplatesModule } from './modules/prompt-templates.module.js';
import { ResourcesModule } from './modules/resources/resources.module.js';
import { SecurityModule } from './modules/security/security.module.js';
import { TaskModule } from './modules/task/task.module.js'; // Migrated to Drizzle ORM
import { TerminalsModule } from './modules/terminals/terminals.module.js';
import { TNFAutonomousModule } from './modules/tnf-autonomous.module.js';
import { UnifiedLedgerModule } from './modules/unified-ledger/unified-ledger.module.js';
import { WebhooksModule } from './modules/webhooks/webhooks.module.js'; // Migrated to Drizzle ORM
import { WorkflowTemplatesModule } from './modules/workflow-templates.module.js';
import { MonitoringModule } from './monitoring/monitoring.module.js';
import { AgentApiGrantsService } from './services/agent-api-grants.service.js';
import { AgentHandoffService } from './services/agent-handoff.service.js';
import { AgentPfpOverridesService } from './services/agent-pfp-overrides.service.js';
import { OpenClawOAuthRotationService } from './services/openclaw-oauth-rotation.service.js';
import { ProviderKeysService } from './services/provider-keys.service.js';
import { SmartAccountModule } from './smart-accounts/smart-account.module.js';
import { TransactionsModule } from './transactions/transactions.module.js';
import { WalletsModule } from './wallets/wallets.module.js';
import { Web3authModule } from './web3auth/web3auth.module.js';
import { WebsocketGateway } from './websocket/websocket.gateway.js';

// Security imports
import { SecureAuthGuard } from './guards/secure-auth.guard.js';
import { SecurityGuard } from './guards/security.guard.js';
import { CsrfProtectionMiddleware } from './middleware/csrf-protection.middleware.js';
import { EnhancedErrorHandlerMiddleware } from './middleware/enhanced-error-handler.middleware.js';
import { EnhancedSecurityMiddleware } from './middleware/enhanced-security.middleware.js';
import { SecurityValidationMiddleware } from './middleware/security-validation.middleware.js';
import { SecurityModule as GlobalSecurityModule } from './security/security.module.js';

import { WorkflowExecutionService } from './services/workflow/WorkflowExecutionService.js';

@Module({
  imports: [
    GlobalSecurityModule, // Global security services
    ConfigModule.forRoot({
      isGlobal: true,
      load: [llmProviderConfig, securityConfig],
    }) as any,
    // Event Emitter for inter-service communication (must be configured at root level)
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 20,
      verboseMemoryLeak: true,
    }),
    // Database modules - Drizzle ORM (production ready)
    DrizzleModule.forRootAsync(), // New Drizzle ORM - production ready
    StorageModule.forRoot(),
    // NOTE: ScheduleModule removed - not currently used and causes Reflector dependency issues
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }) as any,
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds in milliseconds
        limit: 10,
      },
    ]) as any,
    AccessModule,
    AuthModule,
    AgentModule, // Add our new agent module
    AgentsModule, // Self-Improvement Agents Module
    AgencyHubModule, // Agency Hub with Swarm coordination
    GooseModule, // Goose CLI dispatch bridge under policy
    ChatModule,
    TaskModule, // Task management - Migrated to Drizzle ORM
    EntityDiscoveryModule,
    ClaudeDevAutomationModule,
    DirectorModule,
    AdminModule, // Admin operations and role management
    ExportModule, // Data export functionality
    SecurityModule, // Security testing and validation
    TNFMCPModule, // Add The New Fuse MCP Module
    A2ACoreModule.forRoot(), // Add A2A Protocol Module
    WebhooksModule, // Webhook management - Migrated to Drizzle ORM
    WalletsModule, // Web3Auth Wallet Module
    TransactionsModule, // Blockchain Transaction Module
    Web3authModule, // Web3Auth Integration Module
    SmartAccountModule, // Smart Account (ERC-4337) Module
    MonitoringModule, // Wallet Platform Monitoring
    WorkflowTemplatesModule,
    PromptTemplatesModule,
    MarketplaceModule,
    ResourcesModule,
    TerminalsModule,
    UnifiedLedgerModule,
    BrandConsistencyAgentModule, // Self-Improving Brand Consistency Agent
    BrowserHubSwarmModule, // Browser Hub Improvement Agent Swarm
    GraphqlModule, // GraphQL API
    TNFAutonomousModule, // 🔮 Autonomous System (Director, BMAD, Swarm)
    BillingModule,
  ],
  controllers: [
    AppController,
    A2AController,
    HealthController, // CRITICAL: Health checks for monitoring/K8s
    LLMProviderController,
    MCPServerController, // MCP server management (20+ endpoints)
    AgentPfpOverridesController,
    AgentGrantsController,
    AgentHandoffController,
    AgentProxyController,
    AiController,
    CommunityController,
    ModelsController, // AI model provider selection
    SystemController,
    UserManagementController, // User CRUD operations
    WebSocketController,
    WorkflowController,
    WorkspaceController, // Multi-workspace support
    ProviderKeysController, // Per-user provider API key management
    OrchestrationController, // Tenant-aware orchestration chat endpoint
    AdminOpenClawOAuthController,
    N8nWorkflowsController,
    OnboardingController,
  ],
  providers: [
    AppService,
    CacheService,
    WebsocketGateway,
    // LLM Provider Services
    {
      provide: LLM_REGISTRY,
      useClass: MockLLMRegistry,
    },
    LLMProviderService,
    AgentPfpOverridesService,
    ProviderKeysService,
    OpenClawOAuthRotationService,
    AgentApiGrantsService,
    AgentHandoffService,
    WorkflowExecutionService,
    // Middleware
    SecurityValidationMiddleware,
    CsrfProtectionMiddleware,
    EnhancedSecurityMiddleware,
    EnhancedErrorHandlerMiddleware,
    // Global security guards (in order of precedence)
    {
      provide: APP_GUARD,
      useClass: SecurityGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SecureAuthGuard,
    },
    // Global validation pipe
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
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
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Simplified middleware chain - only apply essential middleware
    // Removed: EnhancedErrorHandlerMiddleware (it's an error handler, not middleware)
    // Removed: SecurityValidationMiddleware, CsrfProtectionMiddleware (causing read-only issues)
    // TODO: Re-enable after fixing middleware implementation
    consumer
      .apply(EnhancedSecurityMiddleware)
      .exclude('agents/(.*)', 'a2a/(.*)', 'system/(.*)') // Global prefix adds /api
      .forRoutes('*');
  }
}
