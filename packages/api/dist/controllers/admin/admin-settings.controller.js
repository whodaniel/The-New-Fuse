/**
 * Admin Settings Controller
 * Route: admin/settings
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
var _a;
import { Body, Controller, Get, Post, Put, Res, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../modules/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../modules/guards/jwt-auth.guard';
import { AdminConfigurationService } from '../../services/admin-configuration.service';
import { toError } from '../../utils/error';
let AdminSettingsController = class AdminSettingsController {
    constructor(configService) {
        this.configService = configService;
    }
    async getSettings(res) {
        try {
            const settings = await this.configService.getSettings();
            // If null, return defaults or empty object
            return res.status(200).json(settings || {});
        }
        catch (error) {
            const err = toError(error);
            return res.status(500).json({ error: err.message });
        }
    }
    async updateSettings(settings, user, res) {
        try {
            const updated = await this.configService.updateSettings(settings, user.id);
            return res.status(200).json(updated);
        }
        catch (error) {
            const err = toError(error);
            return res.status(500).json({ error: err.message });
        }
    }
    // Also support POST for convenience
    async updateSettingsPost(settings, user, res) {
        return this.updateSettings(settings, user, res);
    }
};
__decorate([
    Get(),
    ApiOperation({ summary: 'Get system settings' }),
    __param(0, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminSettingsController.prototype, "getSettings", null);
__decorate([
    Put(),
    ApiOperation({ summary: 'Update system settings' }),
    ApiBody({ schema: { type: 'object' } }),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __param(2, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminSettingsController.prototype, "updateSettings", null);
__decorate([
    Post(),
    ApiOperation({ summary: 'Update system settings' }),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __param(2, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminSettingsController.prototype, "updateSettingsPost", null);
AdminSettingsController = __decorate([
    ApiTags('admin'),
    Controller('admin/settings'),
    UseGuards(JwtAuthGuard),
    __metadata("design:paramtypes", [typeof (_a = typeof AdminConfigurationService !== "undefined" && AdminConfigurationService) === "function" ? _a : Object])
], AdminSettingsController);
export { AdminSettingsController };
//# sourceMappingURL=admin-settings.controller.js.map