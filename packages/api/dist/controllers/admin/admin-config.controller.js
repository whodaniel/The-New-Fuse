/**
 * Admin Configuration Controller
 * Route: admin/config
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
import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../modules/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../modules/guards/jwt-auth.guard.js';
import { AdminConfigurationService } from '../../services/admin-configuration.service.js';
import { toError } from '../../utils/error.js';
let AdminConfigController = class AdminConfigController {
    constructor(configService) {
        this.configService = configService;
    }
    async getConfigs(res) {
        try {
            const configs = await this.configService.getAllConfigs();
            return res.status(200).json(configs);
        }
        catch (error) {
            const err = toError(error);
            return res.status(500).json({ error: err.message });
        }
    }
    async updateConfig(body, user, res) {
        try {
            if (!body.key || body.value === undefined) {
                return res.status(400).json({ error: 'Key and value are required' });
            }
            const config = await this.configService.updateConfig(body.key, body.value, user.id);
            return res.status(200).json(config);
        }
        catch (error) {
            const err = toError(error);
            return res.status(500).json({ error: err.message });
        }
    }
};
__decorate([
    Get(),
    ApiOperation({ summary: 'Get all system configurations' }),
    __param(0, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminConfigController.prototype, "getConfigs", null);
__decorate([
    Post(),
    ApiOperation({ summary: 'Update or create a configuration' }),
    ApiBody({
        schema: { type: 'object', properties: { key: { type: 'string' }, value: { type: 'string' } } },
    }),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __param(2, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminConfigController.prototype, "updateConfig", null);
AdminConfigController = __decorate([
    ApiTags('admin'),
    Controller('admin/config'),
    UseGuards(JwtAuthGuard),
    __metadata("design:paramtypes", [AdminConfigurationService])
], AdminConfigController);
export { AdminConfigController };
//# sourceMappingURL=admin-config.controller.js.map