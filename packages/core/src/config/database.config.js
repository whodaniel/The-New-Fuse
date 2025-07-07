var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
let DatabaseConfig = class DatabaseConfig {
    constructor(configService) {
        this.configService = configService;
    }
    createTypeOrmOptions() {
        return {
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
            extra: {
                connectionLimit: 20,
                acquireTimeout: 60000,
                timeout: 60000
            }
        };
    }
};
DatabaseConfig = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], DatabaseConfig);
export { DatabaseConfig };
export const databaseConfig = {
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
