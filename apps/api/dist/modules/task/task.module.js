"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskModule = void 0;
/**
 * Task Module - Migrated to Drizzle ORM
 * Provides task management capabilities using Drizzle database service
 */
const common_1 = require("@nestjs/common");
const database_1 = require("@the-new-fuse/database");
const unified_ledger_module_1 = require("../unified-ledger/unified-ledger.module");
const task_health_monitor_service_1 = require("./task-health-monitor.service");
const task_controller_1 = require("./task.controller");
const task_service_1 = require("./task.service");
let TaskModule = class TaskModule {
};
exports.TaskModule = TaskModule;
exports.TaskModule = TaskModule = __decorate([
    (0, common_1.Module)({
        imports: [
            database_1.DatabaseModule, // Provides DatabaseService with Drizzle repositories
            unified_ledger_module_1.UnifiedLedgerModule,
        ],
        controllers: [task_controller_1.TaskController],
        providers: [task_service_1.TaskService, task_health_monitor_service_1.TaskHealthMonitorService],
        exports: [task_service_1.TaskService],
    })
], TaskModule);
//# sourceMappingURL=task.module.js.map