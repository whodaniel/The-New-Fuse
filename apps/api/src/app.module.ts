import { MiddlewareConsumer, Module, NestModule, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { A2AController, A2ACoreModule } from '@the-new-fuse/a2a-core';

import { DrizzleModule } from '@the-new-fuse/database/drizzle';
import { AgentsModule } from './agents/agents.module';
import { BrandConsistencyAgentModule } from './agents/brand-consistency-agent.module';
import { BrowserHubSwarmModule } from './agents/browser-hub-swarm.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BrowserStreamingModule } from './browser-streaming/browser-streaming.module';
import { CacheService } from './cache/cache.service';
import llmProviderConfig from './config/llm-provider.config';
import securityConfig from './config/security.config';
import { CLIController } from './controllers/cli.controller';
import { HealthController } from './controllers/health.controller';
import { MCPController } from './controllers/mcp.controller';
import { ModelsController } from './controllers/models.controller';
import { N8nWorkflowsController } from './controllers/n8n-workflows.controller';
import { SystemController } from './controllers/system.controller';
import { UserManagementController } from './controllers/user-management.controller';
import { WebSocketController } from './controllers/websocket.controller';
import { WorkflowController } from './controllers/workflow.controller';
import { WorkspaceController } from './controllers/workspace.controller';
import { AdvancedLLMProviderController } from './llm/advanced-llm-provider.controller';
import { AdvancedLLMProviderService } from './llm/advanced-llm-provider.service';
import { LLMProviderController } from './llm/llm-provider.controller';
import { LLMProviderService, LLM_REGISTRY } from './llm/llm-provider.service';
import { RealLLMRegistry } from './llm/real-llm-registry.service';
import { TNFMCPModule } from './mcp/TNFMCPModule';
import { AdminModule } from './modules/admin/admin.module';
import { AgencyHubModule } from './modules/agency-hub/agency-hub.module';
import { AgentModule } from './modules/agent.module';
import { AuthModule } from './modules/auth/auth.module';
import { BillingModule } from './modules/billing/billing.module';
import { ChatModule } from './modules/chat/chat.module';
import { ClaudeDevAutomationModule } from './modules/ClaudeDevAutomationModule';
import { CLIModule } from './modules/cli/cli.module';
import { EntityDiscoveryModule } from './modules/discovery/entity-discovery.module';
import { ExportModule } from './modules/export/export.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { PromptTemplatesModule } from './modules/prompt-templates.module';
import { SecurityModule } from './modules/security/security.module';
import { TaskModule } from './modules/task/task.module'; // Migrated to Drizzle ORM
import { TNFAutonomousModule } from './modules/tnf-autonomous.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module'; // Migrated to Drizzle ORM
import { WorkflowTemplatesModule } from './modules/workflow-templates.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { SmartAccountModule } from './smart-accounts/smart-account.module';
import { TransactionsModule } from './transactions/transactions.module';
import { WalletsModule } from './wallets/wallets.module';
import { Web3authModule } from './web3auth/web3auth.module';
import { WebsocketGateway } from './websocket/websocket.gateway';

// Security imports
import { SecureAuthGuard } from './guards/secure-auth.guard';
import { SecurityGuard } from './guards/security.guard';
import { CsrfProtectionMiddleware } from './middleware/csrf-protection.middleware';
import { EnhancedErrorHandlerMiddleware } from './middleware/enhanced-error-handler.middleware';
import { EnhancedSecurityMiddleware } from './middleware/enhanced-security.middleware';
import { SecurityValidationMiddleware } from './middleware/security-validation.middleware';
import { SecurityModule as GlobalSecurityModule } from './security/security.module';

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
    AuthModule,
    AgentModule, // Add our new agent module
    AgentsModule, // Self-Improvement Agents Module
    AgencyHubModule, // Agency Hub with Swarm coordination
    ChatModule,
    CLIModule, // CLI command execution
    TaskModule, // Task management - Migrated to Drizzle ORM
    EntityDiscoveryModule,
    ClaudeDevAutomationModule,
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
    BrandConsistencyAgentModule, // Self-Improving Brand Consistency Agent
    BrowserHubSwarmModule, // Browser Hub Improvement Agent Swarm
    BrowserStreamingModule, // Browser-as-a-Service Streaming
    // GraphqlModule, // TEMPORARILY DISABLED: GraphQL has HttpAdapterHost DI issue - REST API still works
    TNFAutonomousModule, // 🔮 Autonomous System (Director, BMAD, Swarm)
    BillingModule,
    MarketplaceModule, // Unified AI Asset Marketplace
  ],
  controllers: [
    AppController,
    A2AController,
    CLIController, // CLI command execution endpoints
    HealthController, // CRITICAL: Health checks for monitoring/K8s
    LLMProviderController,
    AdvancedLLMProviderController,
    MCPController, // MCP server management (20+ endpoints)
    ModelsController, // AI model provider selection
    SystemController,
    UserManagementController, // User CRUD operations
    WebSocketController,
    WorkflowController,
    WorkspaceController, // Multi-workspace support
    N8nWorkflowsController,
  ],
  providers: [
    AppService,
    CacheService,
    WebsocketGateway,
    // LLM Provider Services
    {
      provide: LLM_REGISTRY,
      useClass: RealLLMRegistry,
    },
    LLMProviderService,
    AdvancedLLMProviderService,
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
      .exclude('api/agents/(.*)', 'api/a2a/(.*)', 'api/system/(.*)') // Exclude test routes
      .forRoutes('*');
  }
}
