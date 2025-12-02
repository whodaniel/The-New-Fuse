import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { A2AController, A2ACoreModule } from '@the-new-fuse/a2a-core';
import { DatabaseModule } from '@the-new-fuse/database';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CacheService } from './cache/cache.service';
import { getDatabaseConfig } from './config/database.config';
import llmProviderConfig from './config/llm-provider.config';
import securityConfig from './config/security.config';
import { N8nWorkflowsController } from './controllers/n8n-workflows.controller';
import { SystemController } from './controllers/system.controller';
import { WebSocketController } from './controllers/websocket.controller';
import { WorkflowController } from './controllers/workflow.controller';
import { GraphqlModule } from './graphql/graphql.module';
import { LLMProviderController } from './llm/llm-provider.controller';
import { LLMProviderService } from './llm/llm-provider.service';
import { TNFMCPModule } from './mcp/TNFMCPModule';
import { AgentModule } from './modules/agent.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChatModule } from './modules/chat/chat.module';
import { ClaudeDevAutomationModule } from './modules/ClaudeDevAutomationModule';
import { EntityDiscoveryModule } from './modules/discovery/entity-discovery.module';
import { TaskModule } from './modules/task/task.module';
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
import { ApiEndpointMonitoringService } from './security/api-endpoint-monitoring.service';
import { EnhancedRateLimitService } from './security/enhanced-rate-limit.service';
import { InputSanitizationService } from './security/input-sanitization.service';
import { ResponseSanitizationService } from './security/response-sanitization.service';
import { SecurityIntegrationService } from './security/security-integration.service';
import { SecurityLoggingService } from './security/security-logging.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [llmProviderConfig, securityConfig],
    }) as any,
    // Provide TypeORM DataSource for modules using @InjectRepository/Repository
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => getDatabaseConfig(configService),
    }) as any,
    // Use Prisma instead of TypeORM
    DatabaseModule as any,
    JwtModule.registerAsync({
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
    ChatModule,
    TaskModule,
    EntityDiscoveryModule,
    ClaudeDevAutomationModule,
    TNFMCPModule, // Add The New Fuse MCP Module
    A2ACoreModule.forRoot(), // Add A2A Protocol Module
    WalletsModule, // Web3Auth Wallet Module
    TransactionsModule, // Blockchain Transaction Module
    Web3authModule, // Web3Auth Integration Module
    SmartAccountModule, // Smart Account (ERC-4337) Module
    MonitoringModule, // Wallet Platform Monitoring
    GraphqlModule, // GraphQL API Module
  ],
  controllers: [
    AppController,
    A2AController,
    LLMProviderController,
    SystemController,
    WebSocketController,
    WorkflowController,
    N8nWorkflowsController,
  ],
  providers: [
    AppService,
    CacheService,
    WebsocketGateway,
    LLMProviderService,
    SystemController,
    WebSocketController,
    WorkflowController,
    // Mock UnifiedMonitoringService (typed as 'any' in core.ts)
    {
      provide: 'UnifiedMonitoringService',
      useValue: {
        recordMetric: () => {},
        captureError: () => {},
      },
    },
    // Security services
    InputSanitizationService,
    ResponseSanitizationService,
    SecurityLoggingService,
    EnhancedRateLimitService,
    ApiEndpointMonitoringService,
    SecurityIntegrationService,
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
export class AppModule {}
