import { getCustomRepository } from 'typeorm';
import { LogRepository } from '../database/repositories/LogRepository.js';
import { Log } from '../database/entities/Log.js';
import { createLogger, format, transports, Logger as WinstonLogger } from 'winston';

export class LoggingService {
    private logRepository: LogRepository;
    private logger: WinstonLogger;

    constructor() {
        this.logRepository = getCustomRepository(LogRepository);
        this.initializeWinston();
    }

    private initializeWinston() {
        this.logger = createLogger({
            level: 'info',
            format: format.combine(
                format.timestamp(),
                format.json()
            ),
            transports: [
                new transports.Console({
                    format: format.combine(
                        format.colorize(),
                        format.simple()
                    )
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

    async log(
        level: 'debug' | 'info' | 'warn' | 'error',
        message: string,
        metadata?: Record<string, unknown>
    ): Promise<Log> {
        // Log to Winston
        this.logger.log(level, message, metadata);
        
        // Store in database
        return this.logRepository.createLog({
            level,
            message,
            metadata
        });
    }

    async debug(message: string, metadata?: Record<string, unknown>): Promise<Log> {
        return this.log('debug', message, metadata);
    }

    async info(message: string, metadata?: Record<string, unknown>): Promise<Log> {
        return this.log('info', message, metadata);
    }

    async warn(message: string, metadata?: Record<string, unknown>): Promise<Log> {
        return this.log('warn', message, metadata);
    }

    async error(message: string, metadata?: Record<string, unknown>): Promise<Log> {
        return this.log('error', message, metadata);
    }

    async findByLevel(
        level: Log['level'],
        limit?: number
    ): Promise<Log[]> {
        return this.logRepository.findByLevel(level, { take: limit });
    }

    async searchLogs(options: {
        searchTerm: string;
        level?: Log['level'];
        startTime?: Date;
        endTime?: Date;
        limit?: number;
    }): Promise<Log[]> {
        return this.logRepository.searchLogs(
            options.searchTerm,
            {
                level: options.level,
                startTime: options.startTime,
                endTime: options.endTime,
                limit: options.limit
            }
        );
    }

    async getLogStats(options: {
        startTime?: Date;
        endTime?: Date;
    }): Promise<Record<Log['level'], number>> {
        return this.logRepository.getLogStats(options);
    }

    async deleteOldLogs(retentionDays: number): Promise<number> {
        return this.logRepository.deleteOldLogs(retentionDays);
    }
}
