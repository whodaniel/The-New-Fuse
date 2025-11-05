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
var _a, _b, _c;
import { Controller, Post, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { execSync } from 'child_process';
import { RoleService } from '../services/role.service';
import { AuditService } from '../services/audit.service';
import { MetricsService } from '../services/metrics.service';
let AdminController = class AdminController {
    roleService;
    auditService;
    metricsService;
    constructor(roleService, auditService, metricsService) {
        this.roleService = roleService;
        this.auditService = auditService;
        this.metricsService = metricsService;
    }
    async runScript(script) {
        try {
            const output = execSync(`pnpm fuse ${script}`, { encoding: 'utf-8' });
            return { success: true, output };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async getRoles() {
        return this.roleService.getAllRoles();
    }
    async updateRolePermissions(roleId, permissions) {
        return this.roleService.updateRolePermissions(roleId, permissions);
    }
    async getAuditLogs() {
        return this.auditService.getLogs();
    }
    async getSystemMetrics() {
        return this.metricsService.getSystemMetrics();
    }
};
__decorate([
    Post('run-script'),
    __param(0, Body('script')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "runScript", null);
__decorate([
    Get('roles'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getRoles", null);
__decorate([
    Put('roles/:roleId/permissions'),
    __param(0, Param('roleId')),
    __param(1, Body('permissions')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateRolePermissions", null);
__decorate([
    Get('audit-logs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAuditLogs", null);
__decorate([
    Get('metrics'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSystemMetrics", null);
AdminController = __decorate([
    Controller('admin'),
    UseGuards(JwtAuthGuard),
    __metadata("design:paramtypes", [typeof (_a = typeof RoleService !== "undefined" && RoleService) === "function" ? _a : Object, typeof (_b = typeof AuditService !== "undefined" && AuditService) === "function" ? _b : Object, typeof (_c = typeof MetricsService !== "undefined" && MetricsService) === "function" ? _c : Object])
], AdminController);
export { AdminController };
//# sourceMappingURL=admin.controller.js.map