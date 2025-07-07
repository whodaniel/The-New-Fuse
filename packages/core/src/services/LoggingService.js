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
import { createLogger, format, transports } from 'winston';
import { ConfigService } from '../config/ConfigService';
let LoggingService = class LoggingService {
    constructor(configService) {
        this.configService = configService;
        this.initializeWinston();
    }
    initializeWinston() {
        this.logger = createLogger({
            level: this.configService.getLogLevel(),
            format: format.combine(format.timestamp(), format.json()),
            transports: [
                new transports.Console({
                    format: format.combine(format.colorize(), format.simple())
                }),
                new transports.File({
                    filename: 'error.log',
                    level: 'error'
                }),
                new transports.File({
                    filename: 'combined.log'
                })
            ]
        });
    }
    async log(level, message, metadata) {
        // Log to Winston
        this.logger.log(level, message, metadata);
        // Create log entry
        const logEntry = {
            id: this.generateId(),
            level,
            message,
            metadata,
            timestamp: new Date()
        };
        return logEntry;
    }
    async debug(message, metadata) {
        return this.log('debug', message, metadata);
    }
    async info(message, metadata) {
        return this.log('info', message, metadata);
    }
    async warn(message, metadata) {
        return this.log('warn', message, metadata);
    }
    async error(message, metadata) {
        return this.log('error', message, metadata);
    }
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
};
LoggingService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], LoggingService);
export { LoggingService };
