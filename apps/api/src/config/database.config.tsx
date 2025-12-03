import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Agent } from '../entities/Agent';
import { AuthEvent } from '../entities/AuthEvent';
import { AuthSession } from '../entities/AuthSession';
import { LoginAttempt } from '../entities/LoginAttempt';
import { Pipeline } from '../entities/Pipeline';
import { Task } from '../entities/Task';
import { TaskExecution } from '../entities/TaskExecution';
import { User } from '../entities/User';

function parseDatabaseUrl(
  databaseUrl: string,
  configService: ConfigService
): {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
} {
  try {
    // Parse DATABASE_URL format: postgresql://username:password@host:port/database
    const url = new URL(databaseUrl.replace('postgresql://', 'http://'));
    return {
      host: url.hostname,
      port: parseInt(url.port, 10) || 5432,
      username: url.username,
      password: url.password,
      database: url.pathname.substring(1), // Remove leading slash
    };
  } catch (error) {
    console.error('Failed to parse DATABASE_URL, falling back to individual env vars:', error);
    return {
      host: configService.get('DB_HOST') || 'localhost',
      port: configService.get<number>('DB_PORT', 5432),
      username: configService.get('DB_USERNAME') || 'postgres',
      password: configService.get('DB_PASSWORD') || 'postgres',
      database: configService.get('DB_DATABASE', 'the_new_fuse'),
    };
  }
}

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  // Try to parse DATABASE_URL first (Railway format)
  const databaseUrl = configService.get('DATABASE_URL');
  let dbConfig;

  if (databaseUrl) {
    dbConfig = parseDatabaseUrl(databaseUrl, configService);
  } else {
    // Fallback to individual environment variables
    dbConfig = {
      host: configService.get('DB_HOST'),
      port: configService.get<number>('DB_PORT', 5432),
      username: configService.get('DB_USERNAME'),
      password: configService.get('DB_PASSWORD'),
      database: configService.get('DB_DATABASE', 'the_new_fuse'),
    };
  }

  return {
    type: 'postgres',
    host: dbConfig.host,
    port: dbConfig.port,
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    entities: [User, Agent, Pipeline, Task, TaskExecution, AuthSession, LoginAttempt, AuthEvent],
    // TODO: Replace with proper migrations - temporarily enabled for production to create missing TypeORM tables
    synchronize: true, // TEMPORARY: Enable in production to create missing tables
    logging: configService.get('NODE_ENV') === 'development',
  };
};
