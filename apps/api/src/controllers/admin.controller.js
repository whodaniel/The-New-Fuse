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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const child_process_1 = require("child_process");
const role_service_1 = require("../services/role.service");
const audit_service_1 = require("../services/audit.service");
const metrics_service_1 = require("../services/metrics.service");
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
            const output = (0, child_process_1.execSync)(`yarn fuse ${script}`, { encoding: 'utf-8' });
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
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Post)('run-script'),
    __param(0, (0, common_1.Body)('script')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "runScript", null);
__decorate([
    (0, common_1.Get)('roles'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getRoles", null);
__decorate([
    (0, common_1.Put)('roles/:roleId/permissions'),
    __param(0, (0, common_1.Param)('roleId')),
    __param(1, (0, common_1.Body)('permissions')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateRolePermissions", null);
__decorate([
    (0, common_1.Get)('audit-logs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAuditLogs", null);
__decorate([
    (0, common_1.Get)('metrics'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSystemMetrics", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [role_service_1.RoleService,
        audit_service_1.AuditService,
        metrics_service_1.MetricsService])
], AdminController);
