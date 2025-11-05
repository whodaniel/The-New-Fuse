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
var _a, _b, _c, _d;
import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Request, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { WorkflowVersionService } from '../services/workflow-version.service';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { AuthenticatedRequest } from '../types/request.types';
class CreateVersionRequest {
    changeLog;
    changeType;
    semanticVersion;
}
class RollbackVersionRequest {
    targetVersion;
    reason;
}
let WorkflowVersionController = class WorkflowVersionController {
    workflowVersionService;
    constructor(workflowVersionService) {
        this.workflowVersionService = workflowVersionService;
    }
    async createVersion(workflowId, body, req) {
        const dto = {
            workflowId,
            changeLog: body.changeLog,
            changeType: body.changeType,
            semanticVersion: body.semanticVersion,
            userId: req.user?.id,
            userEmail: req.user?.email,
        };
        return this.workflowVersionService.createVersion(dto);
    }
    async getWorkflowVersions(workflowId, includeDiff) {
        return this.workflowVersionService.getWorkflowVersions(workflowId, includeDiff);
    }
    async getVersionStats(workflowId) {
        return this.workflowVersionService.getVersionStats(workflowId);
    }
    async getVersion(workflowId, version) {
        return this.workflowVersionService.getVersion(workflowId, version);
    }
    async compareVersions(workflowId, version1, version2) {
        return this.workflowVersionService.compareVersions(workflowId, version1, version2);
    }
    async rollbackToVersion(workflowId, body, req) {
        const dto = {
            workflowId,
            targetVersion: body.targetVersion,
            reason: body.reason,
            userId: req.user?.id,
            userEmail: req.user?.email,
        };
        return this.workflowVersionService.rollbackToVersion(dto);
    }
    async deleteVersion(workflowId, version, req) {
        return this.workflowVersionService.deleteVersion(workflowId, version, req.user?.id, req.user?.email);
    }
};
__decorate([
    Post(),
    Roles('ADMIN', 'SUPER_ADMIN', 'USER') // Allow users to version their own workflows
    ,
    ApiOperation({ summary: 'Create a new version of a workflow' }),
    ApiParam({ name: 'workflowId', description: 'Workflow ID' }),
    ApiBody({ type: CreateVersionRequest }),
    __param(0, Param('workflowId')),
    __param(1, Body()),
    __param(2, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateVersionRequest, typeof (_b = typeof AuthenticatedRequest !== "undefined" && AuthenticatedRequest) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], WorkflowVersionController.prototype, "createVersion", null);
__decorate([
    Get(),
    Roles('ADMIN', 'SUPER_ADMIN', 'USER'),
    ApiOperation({ summary: 'Get all versions of a workflow' }),
    ApiParam({ name: 'workflowId', description: 'Workflow ID' }),
    ApiQuery({ name: 'includeDiff', required: false, type: Boolean, description: 'Include diff information between versions' }),
    __param(0, Param('workflowId')),
    __param(1, Query('includeDiff', new DefaultValuePipe(false))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", Promise)
], WorkflowVersionController.prototype, "getWorkflowVersions", null);
__decorate([
    Get('stats'),
    Roles('ADMIN', 'SUPER_ADMIN', 'USER'),
    ApiOperation({ summary: 'Get version statistics for a workflow' }),
    ApiParam({ name: 'workflowId', description: 'Workflow ID' }),
    __param(0, Param('workflowId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WorkflowVersionController.prototype, "getVersionStats", null);
__decorate([
    Get(':version'),
    Roles('ADMIN', 'SUPER_ADMIN', 'USER'),
    ApiOperation({ summary: 'Get a specific version of a workflow' }),
    ApiParam({ name: 'workflowId', description: 'Workflow ID' }),
    ApiParam({ name: 'version', description: 'Version number' }),
    __param(0, Param('workflowId')),
    __param(1, Param('version', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], WorkflowVersionController.prototype, "getVersion", null);
__decorate([
    Get(':version1/compare/:version2'),
    Roles('ADMIN', 'SUPER_ADMIN', 'USER'),
    ApiOperation({ summary: 'Compare two versions of a workflow' }),
    ApiParam({ name: 'workflowId', description: 'Workflow ID' }),
    ApiParam({ name: 'version1', description: 'First version to compare' }),
    ApiParam({ name: 'version2', description: 'Second version to compare' }),
    __param(0, Param('workflowId')),
    __param(1, Param('version1', ParseIntPipe)),
    __param(2, Param('version2', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], WorkflowVersionController.prototype, "compareVersions", null);
__decorate([
    Put('rollback'),
    Roles('ADMIN', 'SUPER_ADMIN') // Only admins can rollback
    ,
    ApiOperation({ summary: 'Rollback workflow to a specific version' }),
    ApiParam({ name: 'workflowId', description: 'Workflow ID' }),
    ApiBody({ type: RollbackVersionRequest }),
    __param(0, Param('workflowId')),
    __param(1, Body()),
    __param(2, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, RollbackVersionRequest, typeof (_c = typeof AuthenticatedRequest !== "undefined" && AuthenticatedRequest) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], WorkflowVersionController.prototype, "rollbackToVersion", null);
__decorate([
    Delete(':version'),
    Roles('SUPER_ADMIN') // Only super admins can delete versions
    ,
    ApiOperation({ summary: 'Delete a specific version (currently disabled for safety)' }),
    ApiParam({ name: 'workflowId', description: 'Workflow ID' }),
    ApiParam({ name: 'version', description: 'Version number to delete' }),
    __param(0, Param('workflowId')),
    __param(1, Param('version', ParseIntPipe)),
    __param(2, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, typeof (_d = typeof AuthenticatedRequest !== "undefined" && AuthenticatedRequest) === "function" ? _d : Object]),
    __metadata("design:returntype", Promise)
], WorkflowVersionController.prototype, "deleteVersion", null);
WorkflowVersionController = __decorate([
    ApiTags('Workflow Versioning'),
    ApiBearerAuth(),
    UseGuards(JwtAuthGuard, RolesGuard),
    Controller('workflows/:workflowId/versions'),
    __metadata("design:paramtypes", [typeof (_a = typeof WorkflowVersionService !== "undefined" && WorkflowVersionService) === "function" ? _a : Object])
], WorkflowVersionController);
export { WorkflowVersionController };
//# sourceMappingURL=workflow-version.controller.js.map