"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@the-new-fuse/database");
let AuditService = class AuditService {
    /**
     * Create an audit log entry
     */
    async log(action, data) {
        return database_1.drizzleAuditLogsRepository.create({
            action,
            ...data,
        });
    }
    /**
     * Get all audit logs with optional filtering and pagination
     */
    async getLogs(query) {
        return database_1.drizzleAuditLogsRepository.findAll(query);
    }
    /**
     * Get audit logs with pagination
     */
    async findAll(limit, offset) {
        return database_1.drizzleAuditLogsRepository.findAll({ limit, offset });
    }
    /**
     * Find audit log by ID
     */
    async findById(id) {
        return database_1.drizzleAuditLogsRepository.findById(id);
    }
    /**
     * Get audit logs for a specific user
     */
    async findByUserId(userId, limit) {
        return database_1.drizzleAuditLogsRepository.findByUserId(userId, limit);
    }
    /**
     * Get audit logs for a specific resource
     */
    async findByResource(resourceType, resourceId, limit) {
        return database_1.drizzleAuditLogsRepository.findByResource(resourceType, resourceId, limit);
    }
    /**
     * Get audit log statistics
     */
    async getStatistics(startDate, endDate) {
        return database_1.drizzleAuditLogsRepository.getStatistics(startDate, endDate);
    }
    /**
     * Count audit logs with filters
     */
    async count(query) {
        return database_1.drizzleAuditLogsRepository.count(query);
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)()
], AuditService);
//# sourceMappingURL=audit.service.js.map