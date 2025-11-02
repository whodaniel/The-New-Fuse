import { injectable } from ''inversify';
import winston, { Logger as WinstonLogger, createLogger, format, transports } from 'winston';
export type LogLevel = error' | warn' | info' | debug';
      level: 'info'
    this.logger.log('error'
    this.logger.log('warn'
    this.logger.log('info'
    this.logger.log('debug'