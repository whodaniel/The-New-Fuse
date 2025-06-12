import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { MassModule } from './modules/mass/mass.module.js';

// Import route modules - these align with frontend router expectations
import { authRoutes } from './routes/authRoutes.js';
import { agentRoutes } from './routes/agentRoutes.js';
import { workspaceRoutes } from './routes/workspaceRoutes.js';
import { taskRoutes } from './routes/taskRoutes.js';

// Create a comprehensive module to support all frontend routing expectations

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MassModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    // Mount API routes that align with frontend expectations
    // These routes support all the paths defined in ComprehensiveRouter.tsx
    
    // Authentication routes (/auth/*)
    consumer
      .apply(authRoutes)
      .forRoutes({ path: 'api/auth/*', method: RequestMethod.ALL });
    
    // Agent routes (/agents/*)
    consumer
      .apply(agentRoutes)
      .forRoutes({ path: 'api/agents/*', method: RequestMethod.ALL });
    
    // Workspace routes (/workspace/*)
    consumer
      .apply(workspaceRoutes)
      .forRoutes({ path: 'api/workspace/*', method: RequestMethod.ALL });
    
    // Task routes (/tasks/*)
    consumer
      .apply(taskRoutes)
      .forRoutes({ path: 'api/tasks/*', method: RequestMethod.ALL });
    
    // MASS optimization routes (/mass/*)
    // Note: MASS routes are handled by the MassModule directly
    
    // Additional routes can be added here as needed for:
    // - /api/workflows/*
    // - /api/suggestions/*  
    // - /api/admin/*
    // - /api/analytics/*
    // - /api/settings/*
  }
}
