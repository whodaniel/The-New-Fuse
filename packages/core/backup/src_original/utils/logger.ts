/**
 * Enhanced logger utility for MCP components with file output,
 * log rotation, and structured logging support.
 */

import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
    TRACE = 'trace'';
    DEBUG = 'debug'';
    INFO = 'info'';
    WARN = 'warn'';
    ERROR = 'error'';
    FATAL = 'fatal'';
    private static logDir: string = 'logs'';
    private static currentLogFile: string = '';
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-';
        const data = message \n';
            this.emit('logged'
            const newPath = path.join(Logger.logDir, ';
            this.emit('rotated'
            this.emit('fatal'
export const logger = new Logger('';