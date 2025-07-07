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
var ClaudeDevAutomationController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeDevAutomationController = exports.AuthGuard = exports.CreateTemplateDto = exports.CreateAutomationDto = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const ClaudeDevAutomationService_1 = require("../services/ClaudeDevAutomationService");
// DTOs for request/response validation
class CreateAutomationDto {
    templateId;
    parameters;
    priority;
    deadline; // ISO date string
    context;
}
exports.CreateAutomationDto = CreateAutomationDto;
class CreateTemplateDto {
    name;
    description;
    category;
    prompt;
    parameters;
    outputFormat;
    estimatedTokens;
    tags;
}
exports.CreateTemplateDto = CreateTemplateDto;
// Mock AuthGuard - replace with your actual authentication guard
class AuthGuard {
    canActivate() {
        return true; // Mock implementation
    }
}
exports.AuthGuard = AuthGuard;
let ClaudeDevAutomationController = ClaudeDevAutomationController_1 = class ClaudeDevAutomationController {
    claudeDevService;
    logger = new common_1.Logger(ClaudeDevAutomationController_1.name);
    constructor(claudeDevService) {
        this.claudeDevService = claudeDevService;
    }
    async listTemplates(category) {
        try {
            const templates = await this.claudeDevService.listTemplates(category);
            return { templates };
        }
        catch (error) {
            this.logger.error('Failed to list templates:', error);
            throw new common_1.HttpException('Failed to retrieve templates', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getTemplate(templateId) {
        try {
            const template = await this.claudeDevService.getTemplate(templateId);
            if (!template) {
                throw new common_1.HttpException('Template not found', common_1.HttpStatus.NOT_FOUND);
            }
            return { template };
        }
        catch (error) {
            if (error instanceof common_1.HttpException)
                throw error;
            this.logger.error(`Failed to get template ${templateId}:`, error);
            throw new common_1.HttpException('Failed to retrieve template', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async createTemplate(createTemplateDto, req) {
        try {
            // Validate template data
            if (!createTemplateDto.name || !createTemplateDto.prompt) {
                throw new common_1.HttpException('Template name and prompt are required', common_1.HttpStatus.BAD_REQUEST);
            }
            if (!createTemplateDto.parameters || !Array.isArray(createTemplateDto.parameters)) {
                throw new common_1.HttpException('Template parameters must be an array', common_1.HttpStatus.BAD_REQUEST);
            }
            const templateId = await this.claudeDevService.createCustomTemplate(createTemplateDto);
            this.logger.log(`User ${req.user?.id} created template ${templateId}`);
            return {
                templateId,
                message: 'Template created successfully',
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException)
                throw error;
            this.logger.error('Failed to create template:', error);
            throw new common_1.HttpException('Failed to create template', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async deleteTemplate(templateId, req) {
        try {
            const deleted = await this.claudeDevService.deleteTemplate(templateId);
            if (!deleted) {
                throw new common_1.HttpException('Template not found', common_1.HttpStatus.NOT_FOUND);
            }
            this.logger.log(`User ${req.user?.id} deleted template ${templateId}`);
            return { message: 'Template deleted successfully' };
        }
        catch (error) {
            if (error instanceof common_1.HttpException)
                throw error;
            this.logger.error(`Failed to delete template ${templateId}:`, error);
            throw new common_1.HttpException(error.message || 'Failed to delete template', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async executeAutomation(createAutomationDto, req) {
        try {
            // Validate request
            if (!createAutomationDto.templateId) {
                throw new common_1.HttpException('Template ID is required', common_1.HttpStatus.BAD_REQUEST);
            }
            if (!createAutomationDto.parameters || typeof createAutomationDto.parameters !== 'object') {
                throw new common_1.HttpException('Parameters must be an object', common_1.HttpStatus.BAD_REQUEST);
            }
            // Create automation request
            const automationRequest = {
                templateId: createAutomationDto.templateId,
                parameters: createAutomationDto.parameters,
                userId: req.user?.id || 'anonymous',
                priority: createAutomationDto.priority || 'medium',
                deadline: createAutomationDto.deadline ? new Date(createAutomationDto.deadline) : undefined,
                context: createAutomationDto.context,
            };
            const automation = await this.claudeDevService.executeAutomation(automationRequest);
            this.logger.log(`User ${automationRequest.userId} started automation ${automation.id}`);
            return { automation };
        }
        catch (error) {
            if (error instanceof common_1.HttpException)
                throw error;
            this.logger.error('Failed to execute automation:', error);
            throw new common_1.HttpException(error.message || 'Failed to execute automation', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async listAutomations(limit, req) {
        try {
            const userId = req.user?.id || 'anonymous';
            const maxResults = limit ? parseInt(limit, 10) : 50;
            if (maxResults > 200) {
                throw new common_1.HttpException('Limit cannot exceed 200', common_1.HttpStatus.BAD_REQUEST);
            }
            const automations = await this.claudeDevService.listAutomations(userId, maxResults);
            return { automations };
        }
        catch (error) {
            if (error instanceof common_1.HttpException)
                throw error;
            this.logger.error('Failed to list automations:', error);
            throw new common_1.HttpException('Failed to retrieve automations', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getAutomation(automationId, req) {
        try {
            const automation = await this.claudeDevService.getAutomationResult(automationId);
            if (!automation) {
                throw new common_1.HttpException('Automation not found', common_1.HttpStatus.NOT_FOUND);
            }
            // Verify user has access to this automation
            const userId = req.user?.id || 'anonymous';
            if (automation.metadata.userId !== userId) {
                throw new common_1.HttpException('Access denied', common_1.HttpStatus.FORBIDDEN);
            }
            return { automation };
        }
        catch (error) {
            if (error instanceof common_1.HttpException)
                throw error;
            this.logger.error(`Failed to get automation ${automationId}:`, error);
            throw new common_1.HttpException('Failed to retrieve automation', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async cancelAutomation(automationId, req) {
        try {
            const userId = req.user?.id || 'anonymous';
            const cancelled = await this.claudeDevService.cancelAutomation(automationId, userId);
            if (!cancelled) {
                throw new common_1.HttpException('Automation not found or cannot be cancelled', common_1.HttpStatus.BAD_REQUEST);
            }
            this.logger.log(`User ${userId} cancelled automation ${automationId}`);
            return { message: 'Automation cancelled successfully' };
        }
        catch (error) {
            if (error instanceof common_1.HttpException)
                throw error;
            this.logger.error(`Failed to cancel automation ${automationId}:`, error);
            throw new common_1.HttpException('Failed to cancel automation', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getUserStats(req) {
        try {
            const userId = req.user?.id || 'anonymous';
            const stats = await this.claudeDevService.getUsageStats(userId);
            return { stats };
        }
        catch (error) {
            this.logger.error('Failed to get user stats:', error);
            throw new common_1.HttpException('Failed to retrieve statistics', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async healthCheck() {
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
        };
    }
};
exports.ClaudeDevAutomationController = ClaudeDevAutomationController;
__decorate([
    (0, common_1.Get)('templates'),
    (0, swagger_1.ApiOperation)({ summary: 'List all available automation templates' }),
    (0, swagger_1.ApiQuery)({ name: 'category', required: false, description: 'Filter by template category' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Templates retrieved successfully' }),
    __param(0, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClaudeDevAutomationController.prototype, "listTemplates", null);
__decorate([
    (0, common_1.Get)('templates/:templateId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get specific template details' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Template retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Template not found' }),
    __param(0, (0, common_1.Param)('templateId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClaudeDevAutomationController.prototype, "getTemplate", null);
__decorate([
    (0, common_1.Post)('templates'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a custom automation template' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Template created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid template data' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateTemplateDto, Object]),
    __metadata("design:returntype", Promise)
], ClaudeDevAutomationController.prototype, "createTemplate", null);
__decorate([
    (0, common_1.Delete)('templates/:templateId'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a custom template' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Template deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Template not found' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Cannot delete built-in templates' }),
    __param(0, (0, common_1.Param)('templateId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ClaudeDevAutomationController.prototype, "deleteTemplate", null);
__decorate([
    (0, common_1.Post)('automations'),
    (0, swagger_1.ApiOperation)({ summary: 'Execute an automation using a template' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Automation started successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid automation request' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Template not found' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateAutomationDto, Object]),
    __metadata("design:returntype", Promise)
], ClaudeDevAutomationController.prototype, "executeAutomation", null);
__decorate([
    (0, common_1.Get)('automations'),
    (0, swagger_1.ApiOperation)({ summary: 'List user automations' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Maximum number of results' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Automations retrieved successfully' }),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ClaudeDevAutomationController.prototype, "listAutomations", null);
__decorate([
    (0, common_1.Get)('automations/:automationId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get specific automation result' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Automation result retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Automation not found' }),
    __param(0, (0, common_1.Param)('automationId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ClaudeDevAutomationController.prototype, "getAutomation", null);
__decorate([
    (0, common_1.Put)('automations/:automationId/cancel'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel a running automation' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Automation cancelled successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Automation not found' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Automation cannot be cancelled' }),
    __param(0, (0, common_1.Param)('automationId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ClaudeDevAutomationController.prototype, "cancelAutomation", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user automation usage statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Statistics retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClaudeDevAutomationController.prototype, "getUserStats", null);
__decorate([
    (0, common_1.Get)('health'),
    (0, swagger_1.ApiOperation)({ summary: 'Health check for Claude Dev automation service' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Service is healthy' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ClaudeDevAutomationController.prototype, "healthCheck", null);
exports.ClaudeDevAutomationController = ClaudeDevAutomationController = ClaudeDevAutomationController_1 = __decorate([
    (0, swagger_1.ApiTags)('Claude Dev Automation'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(AuthGuard),
    (0, common_1.Controller)('api/claude-dev'),
    __metadata("design:paramtypes", [ClaudeDevAutomationService_1.ClaudeDevAutomationService])
], ClaudeDevAutomationController);
