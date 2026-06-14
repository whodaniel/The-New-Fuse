"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const cache_service_1 = require("../../cache/cache.service");
const admin_config_controller_1 = require("../../controllers/admin-config.controller");
const admin_metrics_controller_1 = require("../../controllers/admin-metrics.controller");
const admin_openclaw_runtime_controller_1 = require("../../controllers/admin-openclaw-runtime.controller");
const admin_users_controller_1 = require("../../controllers/admin-users.controller");
const admin_controller_1 = require("../../controllers/admin.controller");
const security_logging_service_1 = require("../../security/security-logging.service");
const audit_service_1 = require("../../services/audit.service");
const metrics_service_1 = require("../../services/metrics.service");
const openclaw_runtime_service_1 = require("../../services/openclaw-runtime.service");
const role_service_1 = require("../../services/role.service");
const auth_module_1 = require("../auth/auth.module");
const unified_ledger_module_1 = require("../unified-ledger/unified-ledger.module");
const chronological_processes_service_1 = require("./chronological-processes.service");
/**
 * Admin Module
 *
 * Handles all administrative operations including system management,
 * role-based access control, audit logging, and system monitoring.
 *
 * This module provides:
 * - System script execution capabilities
 * - Role and permission management
 * - Audit log retrieval and analysis
 * - System metrics and monitoring
 * - User management (admin operations)
 * - Real-time system performance monitoring
 * - Configuration management
 */
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [jwt_1.JwtModule, auth_module_1.AuthModule, unified_ledger_module_1.UnifiedLedgerModule],
        controllers: [
            admin_controller_1.AdminController,
            admin_users_controller_1.AdminUsersController,
            admin_metrics_controller_1.AdminMetricsController,
            admin_config_controller_1.AdminConfigController,
            admin_openclaw_runtime_controller_1.AdminOpenClawRuntimeController,
        ],
        providers: [
            role_service_1.RoleService,
            audit_service_1.AuditService,
            metrics_service_1.MetricsService,
            security_logging_service_1.SecurityLoggingService,
            cache_service_1.CacheService,
            openclaw_runtime_service_1.OpenClawRuntimeService,
            chronological_processes_service_1.ChronologicalProcessesService,
        ],
        exports: [role_service_1.RoleService, audit_service_1.AuditService, metrics_service_1.MetricsService],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map