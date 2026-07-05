/**
 * Admin Audit Logs Service
 *
 * Service for retrieving and managing audit logs in the admin panel.
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
var _a;
import { Injectable } from '@nestjs/common';
import { AuditLogsRepository, } from '../repositories/audit-logs.repository';
let AdminAuditLogsService = class AdminAuditLogsService {
    constructor(auditLogsRepository) {
        this.auditLogsRepository = auditLogsRepository;
    }
    /**
     * Get all audit logs with filters
     */
    async getAuditLogs(query) {
        const [data, total] = await Promise.all([
            this.auditLogsRepository.findAll(query),
            this.auditLogsRepository.count(query),
        ]);
        return { data, total };
    }
    /**
     * Get audit log by ID
     */
    async getAuditLogById(id) {
        return this.auditLogsRepository.findById(id);
    }
    /**
     * Get audit log statistics
     */
    async getStatistics(startDate, endDate) {
        return this.auditLogsRepository.getStatistics(startDate, endDate);
    }
    /**
     * Create an audit log manually (if needed by admin)
     */
    async createAuditLog(data) {
        return this.auditLogsRepository.create(data);
    }
};
AdminAuditLogsService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof AuditLogsRepository !== "undefined" && AuditLogsRepository) === "function" ? _a : Object])
], AdminAuditLogsService);
export { AdminAuditLogsService };
//# sourceMappingURL=admin-audit-logs.service.js.map