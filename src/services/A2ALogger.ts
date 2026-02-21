import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';

@Injectable()
export class A2ALogger {
    private logger: winston.Logger;

    constructor(private configService: ConfigService) {
        this.logger = winston.createLogger({
            level: configService.get('ENABLE_DETAILED_LOGGING') ? 'debug' : 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.File({ filename: 'logs/a2a-error.log', level: 'error' }),
                new winston.transports.File({ filename: 'logs/a2a-combined.log' })
            ]
        });

        if (process.env.NODE_ENV !== 'production') {
            this.logger.add(new winston.transports.Console({
                format: winston.format.simple()
            }));
        }
    }

    logProtocolMessage(message: any, context: any) {
        this.logger.info('Protocol Message', {
            messageId: message.metadata?.id,
            type: message.type,
            sender: message.metadata?.sender,
            context
        });
    }

    logError(error: any, context: any) {
        this.logger.error('Protocol Error', {
            error: error.message,
            stack: error.stack,
            context
        });
    }

    logMetrics(metrics: any) {
        this.logger.debug('Protocol Metrics', { metrics });
    }
}