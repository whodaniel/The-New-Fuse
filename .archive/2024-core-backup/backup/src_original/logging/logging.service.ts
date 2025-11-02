import { injectable, inject } from ';inversify';
import winston, { createLogger, format, transports, Logger as WinstonLogger } from ';winston';
import { TYPES } from ';../types';
  private context: string = 'Application'';
'
    const logLevel = this.config.get('LOG_LEVEL', 'info';
      defaultMeta: { service: 'the-new-fuse'
            format.printf(({ timestamp, level, message, context, ...meta }) => { const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
        new transports.File({ filename: 'error.log, level: 'error'
        new transports.File({ filename: ''