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
var _a, _b, _c;
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { InterfaceService } from '../services/interface.service';
import { CreateInterfaceDto, UpdateInterfaceDto } from '../dtos/interface.dto';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
let InterfaceController = class InterfaceController {
    interfaceService;
    constructor(interfaceService) {
        this.interfaceService = interfaceService;
    }
    create(createInterfaceDto, userId) {
        return this.interfaceService.create(createInterfaceDto, userId);
    }
    findAll(userId) {
        return this.interfaceService.findAll(userId);
    }
    // This endpoint can be public if interfaces are shareable
    findOne(id) {
        return this.interfaceService.findOne(id);
    }
    update(id, updateInterfaceDto, userId) {
        return this.interfaceService.update(id, updateInterfaceDto, userId);
    }
    remove(id, userId) {
        return this.interfaceService.remove(id, userId);
    }
    // This is the public endpoint for executing the workflow
    execute(id, executionData) {
        return this.interfaceService.execute(id, executionData.formData);
    }
};
__decorate([
    Post(),
    UseGuards(JwtAuthGuard) // Secure this endpoint
    ,
    ApiBearerAuth(),
    ApiOperation({ summary: 'Create a new interface' }),
    ApiResponse({ status: 201, description: 'The interface has been successfully created.' }),
    ApiResponse({ status: 400, description: 'Bad Request.' }),
    __param(0, Body()),
    __param(1, Param('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof CreateInterfaceDto !== "undefined" && CreateInterfaceDto) === "function" ? _b : Object, String]),
    __metadata("design:returntype", void 0)
], InterfaceController.prototype, "create", null);
__decorate([
    Get(),
    UseGuards(JwtAuthGuard) // Secure this endpoint
    ,
    ApiBearerAuth(),
    ApiOperation({ summary: 'Get all interfaces for the current user' }),
    __param(0, Param('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InterfaceController.prototype, "findAll", null);
__decorate([
    Get(':id'),
    ApiOperation({ summary: 'Get an interface by ID' }),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InterfaceController.prototype, "findOne", null);
__decorate([
    Patch(':id'),
    UseGuards(JwtAuthGuard) // Secure this endpoint
    ,
    ApiBearerAuth(),
    ApiOperation({ summary: 'Update an interface' }),
    __param(0, Param('id')),
    __param(1, Body()),
    __param(2, Param('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_c = typeof UpdateInterfaceDto !== "undefined" && UpdateInterfaceDto) === "function" ? _c : Object, String]),
    __metadata("design:returntype", void 0)
], InterfaceController.prototype, "update", null);
__decorate([
    Delete(':id'),
    UseGuards(JwtAuthGuard) // Secure this endpoint
    ,
    ApiBearerAuth(),
    ApiOperation({ summary: 'Delete an interface' }),
    __param(0, Param('id')),
    __param(1, Param('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], InterfaceController.prototype, "remove", null);
__decorate([
    Post(':id/execute'),
    ApiOperation({ summary: 'Execute the workflow associated with an interface' }),
    ApiResponse({ status: 200, description: 'Workflow execution started.' }),
    __param(0, Param('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InterfaceController.prototype, "execute", null);
InterfaceController = __decorate([
    ApiTags('Interfaces'),
    Controller('interfaces'),
    __metadata("design:paramtypes", [typeof (_a = typeof InterfaceService !== "undefined" && InterfaceService) === "function" ? _a : Object])
], InterfaceController);
export { InterfaceController };
//# sourceMappingURL=interface.controller.js.map