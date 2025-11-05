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
var _a, _b;
import { Controller, Get, Put, Body, Param, UseGuards, ParseUUIDPipe, Req } from '@nestjs/common';
import { PermissionService } from '../services/permission.service';
import { UpdateUserPermissionsDto } from '../dtos/permission.dto';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
let PermissionController = class PermissionController {
    permissionService;
    constructor(permissionService) {
        this.permissionService = permissionService;
    }
    getUserPermissions(userId) {
        return this.permissionService.getUserPermissions(userId);
    }
    updateUserPermissions(userId, updateUserPermissionsDto, req) {
        const adminUser = req.user; // Type assertion for user object
        const ipAddress = req.ip || req.connection?.remoteAddress;
        return this.permissionService.updateUserPermissions(userId, updateUserPermissionsDto.agentIds, adminUser?.id, adminUser?.email, ipAddress);
    }
    getAllAgents() {
        return this.permissionService.getAllAgents();
    }
};
__decorate([
    Get('user/:userId'),
    Roles('ADMIN', 'SUPER_ADMIN') // Only admins can view permissions
    ,
    ApiOperation({ summary: "Get a user's agent permissions" }),
    __param(0, Param('userId', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PermissionController.prototype, "getUserPermissions", null);
__decorate([
    Put('user/:userId'),
    Roles('ADMIN', 'SUPER_ADMIN') // Only admins can update permissions
    ,
    ApiOperation({ summary: "Update a user's agent permissions" }),
    __param(0, Param('userId', ParseUUIDPipe)),
    __param(1, Body()),
    __param(2, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_b = typeof UpdateUserPermissionsDto !== "undefined" && UpdateUserPermissionsDto) === "function" ? _b : Object, Object]),
    __metadata("design:returntype", void 0)
], PermissionController.prototype, "updateUserPermissions", null);
__decorate([
    Get('agents'),
    Roles('ADMIN', 'SUPER_ADMIN'),
    ApiOperation({ summary: 'Get all available agents for permission assignment' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PermissionController.prototype, "getAllAgents", null);
PermissionController = __decorate([
    ApiTags('Permissions'),
    ApiBearerAuth(),
    UseGuards(JwtAuthGuard, RolesGuard),
    Controller('permissions'),
    __metadata("design:paramtypes", [typeof (_a = typeof PermissionService !== "undefined" && PermissionService) === "function" ? _a : Object])
], PermissionController);
export { PermissionController };
//# sourceMappingURL=permission.controller.js.map