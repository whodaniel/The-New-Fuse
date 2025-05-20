import { Module } from "@nestjs/common";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import { DatabaseService } from './database.service.js';
import {
  User,
  Agent,
  Task,
  TaskExecution,
  Pipeline,
  AuthSession,
  LoginAttempt,
  AuthEvent,
} from '../entities.js';

const getDatabaseConfig = (): TypeOrmModuleOptions => ({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_DATABASE || "thefuse",
  entities: [__dirname + "/../**/*.entity{.ts,.js}"],
  synchronize: process.env.NODE_ENV !== "production",
});

@Module({
  imports: [
    TypeOrmModule.forRoot(getDatabaseConfig())
  ],
  providers: [DatabaseService],
  exports: [DatabaseService]
})
export class DatabaseModule {}
