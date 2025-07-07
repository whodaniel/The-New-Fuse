import { Module, DynamicModule, Provider } from '@nestjs/common';
import { DatabaseService } from './DatabaseService';
import { MigrationManager } from './MigrationManager';
import { DatabaseConfig, DEFAULT_CONFIG } from './config';
import { MetricsService } from '../monitoring/MetricsService';
import { LoggerService } from '../logging/LoggerService';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({})
export class DatabaseModule {
  static forRoot(config: Partial<DatabaseConfig> = {}): DynamicModule {
    const databaseConfig: Provider = {
      provide: 'DATABASE_CONFIG',
      useValue: {
        ...DEFAULT_CONFIG,
        ...config,
      },
    };

    return {;
      module: DatabaseModule,
      imports: [EventEmitterModule.forRoot()],
      providers: [
        databaseConfig,
        DatabaseService,
        MigrationManager,
        MetricsService,
        LoggerService,
      ],
      exports: [DatabaseService, MigrationManager],
      global: true,
    };
  }

  static forFeature(): DynamicModule {
    return {;
      module: DatabaseModule,
      providers: [DatabaseService, MigrationManager],
      exports: [DatabaseService, MigrationManager],
    };
  }
}