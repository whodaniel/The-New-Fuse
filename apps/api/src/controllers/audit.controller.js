var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d;
import { Controller, Get, Query, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { AuditService } from '../security/audit.service';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditAction, AuditResource, AuditStatus } from '@the-new-fuse/database';
let AuditController = class AuditController {
    auditService;
    constructor(auditService) {
        this.auditService = auditService;
    }
    async getAuditLogs(userId, resource, action, status, startDate, endDate, limit = 100, offset = 0) {
        const filters = {
            userId,
            resource,
            action,
            status,
            limit,
            offset,
        };
        if (startDate) {
            filters.startDate = new Date(startDate);
        }
        if (endDate) {
            filters.endDate = new Date(endDate);
        }
        return this.auditService.getAuditLogs(filters);
    }
    async getAuditStats(timeRange = 'week') {
        return this.auditService.getAuditStats(timeRange);
    }
    async getAuditLog(id) {
        return this.auditService.findById(id);
    }
    // Legacy endpoints for backward compatibility
    async getLogs() {
        return this.auditService.getLogs();
    }
};
__decorate([
    Get('logs'),
    Roles('ADMIN', 'SUPER_ADMIN'),
    ApiOperation({ summary: 'Get audit logs with filtering and pagination' }),
    ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' }),
    ApiQuery({ name: 'resource', required: false, enum: AuditResource, description: 'Filter by resource type' }),
    ApiQuery({ name: 'action', required: false, enum: AuditAction, description: 'Filter by action type' }),
    ApiQuery({ name: 'status', required: false, enum: AuditStatus, description: 'Filter by status' }),
    ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date (ISO string)' }),
    ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date (ISO string)' }),
    ApiQuery({ name: 'limit', required: false, description: 'Number of logs to return (default: 100)' }),
    ApiQuery({ name: 'offset', required: false, description: 'Number of logs to skip (default: 0)' }),
    __param(0, Query('userId')),
    __param(1, Query('resource')),
    __param(2, Query('action')),
    __param(3, Query('status')),
    __param(4, Query('startDate')),
    __param(5, Query('endDate')),
    __param(6, Query('limit', new DefaultValuePipe(100), ParseIntPipe)),
    __param(7, Query('offset', new DefaultValuePipe(0), ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_b = typeof AuditResource !== "undefined" && AuditResource) === "function" ? _b : Object, typeof (_c = typeof AuditAction !== "undefined" && AuditAction) === "function" ? _c : Object, typeof (_d = typeof AuditStatus !== "undefined" && AuditStatus) === "function" ? _d : Object, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "getAuditLogs", null);
__decorate([
    Get('stats'),
    Roles('ADMIN', 'SUPER_ADMIN'),
    ApiOperation({ summary: 'Get audit statistics for dashboard' }),
    ApiQuery({
        name: 'timeRange',
        required: false,
        enum: ['day', 'week', 'month'],
        description: 'Time range for statistics (default: week)'
    }),
    __param(0, Query('timeRange')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "getAuditStats", null);
__decorate([
    Get('logs/:id'),
    Roles('ADMIN', 'SUPER_ADMIN'),
    ApiOperation({ summary: 'Get specific audit log by ID' }),
    __param(0, Query('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "getAuditLog", null);
__decorate([
    Get(),
    Roles('ADMIN', 'SUPER_ADMIN'),
    ApiOperation({ summary: 'Get recent audit logs (legacy endpoint)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "getLogs", null);
AuditController = __decorate([
    ApiTags('Audit Logs'),
    ApiBearerAuth(),
    UseGuards(JwtAuthGuard, RolesGuard),
    Controller('audit'),
    __metadata("design:paramtypes", [typeof (_a = typeof AuditService !== "undefined" && AuditService) === "function" ? _a : Object])
], AuditController);
export { AuditController };
//# sourceMappingURL=audit.controller.js.map