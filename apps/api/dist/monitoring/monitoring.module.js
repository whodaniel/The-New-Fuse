"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
// @ts-ignore
const database_1 = require("@the-new-fuse/database");
const security_logging_service_1 = require("../security/security-logging.service");
const monitoring_controller_1 = require("./monitoring.controller");
const wallet_monitoring_service_1 = require("./wallet-monitoring.service");
let MonitoringModule = class MonitoringModule {
};
exports.MonitoringModule = MonitoringModule;
exports.MonitoringModule = MonitoringModule = __decorate([
    (0, common_1.Module)({
        imports: [jwt_1.JwtModule, database_1.DatabaseModule],
        controllers: [monitoring_controller_1.MonitoringController],
        providers: [wallet_monitoring_service_1.WalletMonitoringService, security_logging_service_1.SecurityLoggingService],
        exports: [wallet_monitoring_service_1.WalletMonitoringService],
    })
], MonitoringModule);
//# sourceMappingURL=monitoring.module.js.map