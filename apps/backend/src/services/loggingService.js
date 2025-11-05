"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingService = void 0;
const common_1 = require("@nestjs/common");
const winston_1 = require("winston");
let LoggingService = class LoggingService {
    logger;
    defaultMetadata = {};
    constructor(config) {
        this.logger = this.createLogger(config);
    }
    createLogger(config) {
        const logTransports = [];
        // Console transport
        if (config.transports.console) {
            logTransports.push(new winston_1.transports.Console({
                format: config.format === 'json'
                    ? winston_1.format.json()
                    : winston_1.format.simple()
            }));
        }
        // File transport
        if (config.transports.file) {
            logTransports.push(new winston_1.transports.File({
                filename: config.transports.file.filename,
                maxFiles: config.transports.file.maxFiles,
                maxsize: parseInt(config.transports.file.maxSize),
                format: winston_1.format.json()
            }));
        }
        return (0, winston_1.createLogger)({
            level: config.level,
            format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.errors({ stack: true }), winston_1.format.metadata()),
            defaultMeta: this.defaultMetadata,
            transports: logTransports
        });
    }
    setDefaultMetadata(metadata) {
        this.defaultMetadata = { ...this.defaultMetadata, ...metadata };
        this.logger.defaultMeta = this.defaultMetadata;
    }
    info(message, metadata) {
        this.logger.info(message, { metadata });
    }
    warn(message, metadata) {
        this.logger.warn(message, { metadata });
    }
    error(message, metadata) {
        this.logger.error(message, { metadata });
    }
    debug(message, metadata) {
        this.logger.debug(message, { metadata });
    }
    // Specialized logging methods
    logRequest(metadata) {
        this.info('HTTP Request', {
            ...metadata,
            type: 'request'
        });
    }
    logError(error, metadata) {
        this.error(error.message, {
            ...metadata,
            type: 'error',
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack
            }
        });
    }
    logSecurity(event, metadata) {
        this.warn(event, {
            ...metadata,
            type: 'security'
        });
    }
    logPerformance(operation, duration, metadata) {
        this.info('Performance metric', {
            ...metadata,
            type: 'performance',
            operation,
            duration
        });
    }
    logAudit(action, metadata) {
        this.info('Audit event', {
            ...metadata,
            type: 'audit',
            action
        });
    }
    // Create child logger with additional default metadata
    child(metadata) {
        const childLogger = Object.create(this);
        childLogger.logger = this.logger.child(metadata);
        childLogger.defaultMetadata = { ...this.defaultMetadata, ...metadata };
        return childLogger;
    }
};
exports.LoggingService = LoggingService;
exports.LoggingService = LoggingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object])
], LoggingService);
//# sourceMappingURL=loggingService.js.map