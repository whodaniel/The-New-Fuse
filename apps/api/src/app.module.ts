import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import llmProviderConfig from './config/llm-provider.config';
import securityConfig from './config/security.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { AgentModule } from './modules/agent.module';
import { ChatModule } from './modules/chat/chat.module';
import { TaskModule } from './modules/task/task.module';
import { CacheService } from './cache/cache.service';
import { WebsocketGateway } from './websocket/websocket.gateway';
import { LLMProviderController } from './llm/llm-provider.controller';
import { LLMProviderService } from './llm/llm-provider.service';
import { SystemController } from './controllers/system.controller';
import { WebSocketController } from './controllers/websocket.controller';
import { WorkflowController } from './controllers/workflow.controller';
import { EntityDiscoveryModule } from './modules/discovery/entity-discovery.module';
import { ClaudeDevAutomationModule } from './modules/ClaudeDevAutomationModule';
import { TNFMCPModule } from './mcp/TNFMCPModule';
import { A2ACoreModule, A2AController } from '@the-new-fuse/a2a-core';
import { DatabaseModule } from '@the-new-fuse/database';
import { WalletsModule } from './wallets/wallets.module';
import { TransactionsModule } from './transactions/transactions.module';
import { Web3authModule } from './web3auth/web3auth.module';
import { SmartAccountModule } from './smart-accounts/smart-account.module';
import { MonitoringModule } from './monitoring/monitoring.module';

// Security imports
import { InputSanitizationService } from './security/input-sanitization.service';
import { ResponseSanitizationService } from './security/response-sanitization.service';
import { SecurityLoggingService } from './security/security-logging.service';
import { EnhancedRateLimitService } from './security/enhanced-rate-limit.service';
import { ApiEndpointMonitoringService } from './security/api-endpoint-monitoring.service';
import { SecurityIntegrationService } from './security/security-integration.service';
import { SecurityValidationMiddleware } from './middleware/security-validation.middleware';
import { CsrfProtectionMiddleware } from './middleware/csrf-protection.middleware';
import { EnhancedSecurityMiddleware } from './middleware/enhanced-security.middleware';
import { EnhancedErrorHandlerMiddleware } from './middleware/enhanced-error-handler.middleware';
import { SecurityGuard } from './guards/security.guard';
import { SecureAuthGuard } from './guards/secure-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [llmProviderConfig, securityConfig],
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
    ThrottlerModule.forRoot([{
      ttl: 60000, // 60 seconds in milliseconds
      limit: 10,
    }]) as any,
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
  ],
  controllers: [
    AppController,
    A2AController,
    LLMProviderController,
    SystemController,
    WebSocketController,
    WorkflowController
  ],
  providers: [
    AppService, 
    CacheService, 
    WebsocketGateway, 
    LLMProviderService,
    SystemController,
    WebSocketController,
    WorkflowController,
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
