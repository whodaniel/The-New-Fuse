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
exports.MonitoringController = void 0;
const common_1 = require("@nestjs/common");
const wallet_monitoring_service_1 = require("./wallet-monitoring.service");
let MonitoringController = class MonitoringController {
    monitoringService;
    constructor(monitoringService) {
        this.monitoringService = monitoringService;
    }
    async getSystemHealth() {
        return await this.monitoringService.getSystemMetrics();
    }
    getRecentAlerts() {
        return this.monitoringService.getRecentAlerts();
    }
    async createAlert(alertData) {
        await this.monitoringService.createAlert(alertData);
        return { success: true };
    }
};
exports.MonitoringController = MonitoringController;
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "getSystemHealth", null);
__decorate([
    (0, common_1.Get)('alerts'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MonitoringController.prototype, "getRecentAlerts", null);
__decorate([
    (0, common_1.Post)('alert'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "createAlert", null);
exports.MonitoringController = MonitoringController = __decorate([
    (0, common_1.Controller)('monitoring'),
    __metadata("design:paramtypes", [wallet_monitoring_service_1.WalletMonitoringService])
], MonitoringController);
