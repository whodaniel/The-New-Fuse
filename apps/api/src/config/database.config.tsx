import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/User.js';
import { Agent } from '../entities/Agent.js';
import { Pipeline } from '../entities/Pipeline.js';
import { Task } from '../entities/Task.js';
import { TaskExecution } from '../entities/TaskExecution.js';
import { AuthSession } from '../entities/AuthSession.js';
import { LoginAttempt } from '../entities/LoginAttempt.js';
import { AuthEvent } from '../entities/AuthEvent.js';

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get('DB_HOST', 'localhost'),
  port: configService.get<number>('DB_PORT', 5432),
  username: configService.get('DB_USERNAME', 'postgres'),
  password: configService.get('DB_PASSWORD', 'postgres'),
  database: configService.get('DB_DATABASE', 'the_new_fuse'),
  entities: [
    User,
    Agent,
    Pipeline,
    Task,
    TaskExecution,
    AuthSession,
    LoginAttempt,
    AuthEvent
  ],
  synchronize: configService.get('NODE_ENV') === 'development', // Only for development
  logging: configService.get('NODE_ENV') === 'development',
});
