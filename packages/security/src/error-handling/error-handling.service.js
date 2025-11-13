"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ErrorHandlingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorHandlingService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let ErrorHandlingService = ErrorHandlingService_1 = class ErrorHandlingService {
    logger = new common_1.Logger(ErrorHandlingService_1.name);
    handleError(error, request, response) {
        let statusCode = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let details = undefined;
        if (error instanceof common_1.HttpException) {
            statusCode = error.getStatus();
            message = error.message;
            details = error.getResponse();
        }
        else if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            switch (error.code) {
                case 'P2002':
                    statusCode = common_1.HttpStatus.CONFLICT;
                    message = 'Resource already exists';
                    details = { field: error.meta?.target };
                    break;
                case 'P2025':
                    statusCode = common_1.HttpStatus.NOT_FOUND;
                    message = 'Resource not found';
                    break;
                case 'P2003':
                    statusCode = common_1.HttpStatus.BAD_REQUEST;
                    message = 'Invalid foreign key';
                    break;
                default:
                    statusCode = common_1.HttpStatus.BAD_REQUEST;
                    message = 'Database error';
                    details = { code: error.code };
            }
        }
        else if (error instanceof client_1.Prisma.PrismaClientValidationError) {
            statusCode = common_1.HttpStatus.BAD_REQUEST;
            message = 'Validation error';
            details = error.message;
        }
        else if (error.name === 'JsonWebTokenError') {
            statusCode = common_1.HttpStatus.UNAUTHORIZED;
            message = 'Invalid token';
        }
        else if (error.name === 'TokenExpiredError') {
            statusCode = common_1.HttpStatus.UNAUTHORIZED;
            message = 'Token expired';
        }
        const errorResponse = {
            statusCode,
            message,
            error: common_1.HttpStatus[statusCode],
            timestamp: new Date().toISOString(),
            path: request.url,
            details,
        };
        this.logger.error(`HTTP ${statusCode} Error: ${message}`, {
            url: request.url,
            method: request.method,
            ip: request.ip,
            userAgent: request.get('user-agent'),
            error: error.message,
            stack: error.stack,
        });
        response.status(statusCode).json(errorResponse);
    }
    createHttpException(message, status, details) {
        const response = details ? { message, details } : message;
        return new common_1.HttpException(response, status);
    }
};
exports.ErrorHandlingService = ErrorHandlingService;
exports.ErrorHandlingService = ErrorHandlingService = ErrorHandlingService_1 = __decorate([
    (0, common_1.Injectable)()
], ErrorHandlingService);
//# sourceMappingURL=error-handling.service.js.map