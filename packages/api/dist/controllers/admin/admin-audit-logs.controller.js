/**
 * Admin Audit Logs Controller
 *
 * Exposes endpoints for managing audit logs in the admin panel.
 */
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
import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/guards/jwt-auth.guard.js';
import { AdminAuditLogsService } from '../../services/admin-audit-logs.service.js';
import { toError } from '../../utils/error.js';
let AdminAuditLogsController = class AdminAuditLogsController {
    constructor(auditLogsService) {
        this.auditLogsService = auditLogsService;
    }
    async getAuditLogs(userId, action, resourceType, status, startDate, endDate, limit, offset, res) {
        try {
            const query = {
                userId,
                action,
                resourceType,
                status,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                limit: limit ? parseInt(limit, 10) : 50,
                offset: offset ? parseInt(offset, 10) : 0,
            };
            const result = await this.auditLogsService.getAuditLogs(query);
            return res?.status(200).json(result.data); // Returning just data array as per frontend expectation?
            // Frontend expects: const data = await response.json(); const transformed = data.map(...)
            // So it expects an ARRAY, not { data: [], total: ... }
            // The service returns { data, total }.
            // I should modify logic to return array or fix frontend.
            // Frontend code: data.map((log: any) => ...)
            // So I must return an ARRAY.
        }
        catch (error) {
            const err = toError(error);
            return res?.status(500).json({ error: err.message });
        }
    }
    async getStatistics(startDate, endDate, res) {
        try {
            const stats = await this.auditLogsService.getStatistics(startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
            return res?.status(200).json(stats);
        }
        catch (error) {
            const err = toError(error);
            return res?.status(500).json({ error: err.message });
        }
    }
};
__decorate([
    Get(),
    ApiOperation({ summary: 'Get audit logs' }),
    ApiQuery({ name: 'userId', required: false }),
    ApiQuery({ name: 'action', required: false }),
    ApiQuery({ name: 'resourceType', required: false }),
    ApiQuery({ name: 'status', required: false }),
    ApiQuery({ name: 'startDate', required: false }),
    ApiQuery({ name: 'limit', required: false }),
    ApiResponse({ status: 200, description: 'List of audit logs' }),
    __param(0, Query('userId')),
    __param(1, Query('action')),
    __param(2, Query('resourceType')),
    __param(3, Query('status')),
    __param(4, Query('startDate')),
    __param(5, Query('endDate')),
    __param(6, Query('limit')),
    __param(7, Query('offset')),
    __param(8, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], AdminAuditLogsController.prototype, "getAuditLogs", null);
__decorate([
    Get('stats'),
    ApiOperation({ summary: 'Get audit log statistics' }),
    __param(0, Query('startDate')),
    __param(1, Query('endDate')),
    __param(2, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AdminAuditLogsController.prototype, "getStatistics", null);
AdminAuditLogsController = __decorate([
    ApiTags('admin'),
    Controller('admin/audit-logs'),
    UseGuards(JwtAuthGuard),
    __metadata("design:paramtypes", [AdminAuditLogsService])
], AdminAuditLogsController);
export { AdminAuditLogsController };
//# sourceMappingURL=admin-audit-logs.controller.js.map