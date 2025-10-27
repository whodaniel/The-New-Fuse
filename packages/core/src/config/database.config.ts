import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
@Injectable()
export class DatabaseConfig {
  constructor(private readonly configService: ConfigService) {}

  createTypeOrmOptions(): any {
    return {
  // Implementation needed
}
      type: 'postgres',
      host: this.configService.get('DB_HOST', 'localhost'),
      port: this.configService.get('DB_PORT', 5432),
      username: this.configService.get('DB_USERNAME'),
      password: this.configService.get('DB_PASSWORD'),
      database: this.configService.get('DB_NAME'),
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: this.configService.get('NODE_ENV') !== 'production',
      migrations: [__dirname + '/../migrations/*{.ts,.js}'],
      logging: this.configService.get('NODE_ENV') === 'development',
      ssl: this.configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
      autoLoadEntities: true,
      retryAttempts: 5,
      retryDelay: 3000,
      maxQueryExecutionTime: 1000,
      extra: unknown;
  // Implementation needed
}
        connectionLimit: 20,
        acquireTimeout: 60000,
        timeout: 60000
      }
    };
  }
}

export const databaseConfig = {
  // Implementation needed
}
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.NODE_ENV === 'production',
  poolSize: parseInt(process.env.DB_POOL_SIZE || '10'),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000')
};