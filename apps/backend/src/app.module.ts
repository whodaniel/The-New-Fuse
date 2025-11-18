import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MassModule } from './modules/mass/mass.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { JobsModule } from './jobs/jobs.module';
import { EventBus } from './events/event-bus.service';
import { LoggingService } from './services/logging.service';
import { AgentExecutionsModule } from './modules/agent-executions/agent-executions.module';
import { WorkflowTemplatesModule } from './modules/workflow-templates/workflow-templates.module';
import { FilesModule } from './modules/files/files.module';
import { SystemMetricsModule } from './modules/system-metrics/system-metrics.module';
import { CacheModule } from './cache/cache.module';
import { CacheController } from './cache/cache.controller';
import { MCPModule } from './modules/mcp/mcp.module';

// Create a comprehensive module to support all frontend routing expectations

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    MassModule,
    JobsModule,
    AgentExecutionsModule,
    WorkflowTemplatesModule,
    FilesModule,
    SystemMetricsModule,
    CacheModule,
    MCPModule, // MCP Integration for agent communication
  ],
  controllers: [AppController, CacheController],
  providers: [AppService, EventBus, LoggingService],
})
export class AppModule {}
