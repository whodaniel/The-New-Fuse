import { Module, DynamicModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseService } from './DatabaseService.js';

export interface DatabaseConfig {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  synchronize?: boolean;
  logging?: boolean;
}

@Module({})
export class DatabaseModule {
  static forRoot(config: Partial<DatabaseConfig> = {}): DynamicModule {
    const databaseConfig: DatabaseConfig = {
      host: config.host || process.env.DB_HOST || 'localhost',
      port: config.port || parseInt(process.env.DB_PORT || '5432'),
      username: config.username || process.env.DB_USER || 'postgres',
      password: config.password || process.env.DB_PASSWORD || 'postgres',
      database: config.database || process.env.DB_NAME || 'fuse',
      synchronize: config.synchronize ?? false,
      logging: config.logging ?? false,
    };

    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          ...databaseConfig,
          entities: [],
          migrations: [],
        }),
      ],
      providers: [DatabaseService],
      exports: [DatabaseService],
    };
  }
}
