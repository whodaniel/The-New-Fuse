var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
import { Controller, Get, Post, Put, Delete, UseGuards, HttpException, HttpStatus, Logger, } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
// DTOs for request/response validation
export class CreateAutomationDto {
}
export class CreateTemplateDto {
}
// Mock AuthGuard - replace with your actual authentication guard
export class AuthGuard {
    canActivate() {
        return true; // Mock implementation
    }
}
let ClaudeDevAutomationController = (() => {
    let _classDecorators = [ApiTags('Claude Dev Automation'), ApiBearerAuth(), UseGuards(AuthGuard), Controller('api/claude-dev')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _listTemplates_decorators;
    let _getTemplate_decorators;
    let _createTemplate_decorators;
    let _deleteTemplate_decorators;
    let _executeAutomation_decorators;
    let _listAutomations_decorators;
    let _getAutomation_decorators;
    let _cancelAutomation_decorators;
    let _getUserStats_decorators;
    let _healthCheck_decorators;
    var ClaudeDevAutomationController = _classThis = class {
        constructor(claudeDevService) {
            this.claudeDevService = (__runInitializers(this, _instanceExtraInitializers), claudeDevService);
            this.logger = new Logger(ClaudeDevAutomationController.name);
        }
        async listTemplates(category) {
            try {
                const templates = await this.claudeDevService.listTemplates(category);
                return { templates };
            }
            catch (error) {
                this.logger.error('Failed to list templates:', error);
                throw new HttpException('Failed to retrieve templates', HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async getTemplate(templateId) {
            try {
                const template = await this.claudeDevService.getTemplate(templateId);
                if (!template) {
                    throw new HttpException('Template not found', HttpStatus.NOT_FOUND);
                }
                return { template };
            }
            catch (error) {
                if (error instanceof HttpException)
                    throw error;
                this.logger.error(`Failed to get template ${templateId}:`, error);
                throw new HttpException('Failed to retrieve template', HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async createTemplate(createTemplateDto, req) {
            try {
                // Validate template data
                if (!createTemplateDto.name || !createTemplateDto.prompt) {
                    throw new HttpException('Template name and prompt are required', HttpStatus.BAD_REQUEST);
                }
                if (!createTemplateDto.parameters || !Array.isArray(createTemplateDto.parameters)) {
                    throw new HttpException('Template parameters must be an array', HttpStatus.BAD_REQUEST);
                }
                const templateId = await this.claudeDevService.createCustomTemplate(createTemplateDto);
                this.logger.log(`User ${req.user?.id} created template ${templateId}`);
                return {
                    templateId,
                    message: 'Template created successfully',
                };
            }
            catch (error) {
                if (error instanceof HttpException)
                    throw error;
                this.logger.error('Failed to create template:', error);
                throw new HttpException('Failed to create template', HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async deleteTemplate(templateId, req) {
            try {
                const deleted = await this.claudeDevService.deleteTemplate(templateId);
                if (!deleted) {
                    throw new HttpException('Template not found', HttpStatus.NOT_FOUND);
                }
                this.logger.log(`User ${req.user?.id} deleted template ${templateId}`);
                return { message: 'Template deleted successfully' };
            }
            catch (error) {
                if (error instanceof HttpException)
                    throw error;
                this.logger.error(`Failed to delete template ${templateId}:`, error);
                throw new HttpException(error.message || 'Failed to delete template', HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async executeAutomation(createAutomationDto, req) {
            try {
                // Validate request
                if (!createAutomationDto.templateId) {
                    throw new HttpException('Template ID is required', HttpStatus.BAD_REQUEST);
                }
                if (!createAutomationDto.parameters || typeof createAutomationDto.parameters !== 'object') {
                    throw new HttpException('Parameters must be an object', HttpStatus.BAD_REQUEST);
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
                if (error instanceof HttpException)
                    throw error;
                this.logger.error('Failed to execute automation:', error);
                throw new HttpException(error.message || 'Failed to execute automation', HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async listAutomations(limit, req) {
            try {
                const userId = req.user?.id || 'anonymous';
                const maxResults = limit ? parseInt(limit, 10) : 50;
                if (maxResults > 200) {
                    throw new HttpException('Limit cannot exceed 200', HttpStatus.BAD_REQUEST);
                }
                const automations = await this.claudeDevService.listAutomations(userId, maxResults);
                return { automations };
            }
            catch (error) {
                if (error instanceof HttpException)
                    throw error;
                this.logger.error('Failed to list automations:', error);
                throw new HttpException('Failed to retrieve automations', HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async getAutomation(automationId, req) {
            try {
                const automation = await this.claudeDevService.getAutomationResult(automationId);
                if (!automation) {
                    throw new HttpException('Automation not found', HttpStatus.NOT_FOUND);
                }
                // Verify user has access to this automation
                const userId = req.user?.id || 'anonymous';
                if (automation.metadata.userId !== userId) {
                    throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
                }
                return { automation };
            }
            catch (error) {
                if (error instanceof HttpException)
                    throw error;
                this.logger.error(`Failed to get automation ${automationId}:`, error);
                throw new HttpException('Failed to retrieve automation', HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async cancelAutomation(automationId, req) {
            try {
                const userId = req.user?.id || 'anonymous';
                const cancelled = await this.claudeDevService.cancelAutomation(automationId, userId);
                if (!cancelled) {
                    throw new HttpException('Automation not found or cannot be cancelled', HttpStatus.BAD_REQUEST);
                }
                this.logger.log(`User ${userId} cancelled automation ${automationId}`);
                return { message: 'Automation cancelled successfully' };
            }
            catch (error) {
                if (error instanceof HttpException)
                    throw error;
                this.logger.error(`Failed to cancel automation ${automationId}:`, error);
                throw new HttpException('Failed to cancel automation', HttpStatus.INTERNAL_SERVER_ERROR);
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
                throw new HttpException('Failed to retrieve statistics', HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async healthCheck() {
            return {
                status: 'healthy',
                timestamp: new Date().toISOString(),
            };
        }
    };
    __setFunctionName(_classThis, "ClaudeDevAutomationController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _listTemplates_decorators = [Get('templates'), ApiOperation({ summary: 'List all available automation templates' }), ApiQuery({ name: 'category', required: false, description: 'Filter by template category' }), ApiResponse({ status: 200, description: 'Templates retrieved successfully' })];
        _getTemplate_decorators = [Get('templates/:templateId'), ApiOperation({ summary: 'Get specific template details' }), ApiResponse({ status: 200, description: 'Template retrieved successfully' }), ApiResponse({ status: 404, description: 'Template not found' })];
        _createTemplate_decorators = [Post('templates'), ApiOperation({ summary: 'Create a custom automation template' }), ApiResponse({ status: 201, description: 'Template created successfully' }), ApiResponse({ status: 400, description: 'Invalid template data' })];
        _deleteTemplate_decorators = [Delete('templates/:templateId'), ApiOperation({ summary: 'Delete a custom template' }), ApiResponse({ status: 200, description: 'Template deleted successfully' }), ApiResponse({ status: 404, description: 'Template not found' }), ApiResponse({ status: 403, description: 'Cannot delete built-in templates' })];
        _executeAutomation_decorators = [Post('automations'), ApiOperation({ summary: 'Execute an automation using a template' }), ApiResponse({ status: 201, description: 'Automation started successfully' }), ApiResponse({ status: 400, description: 'Invalid automation request' }), ApiResponse({ status: 404, description: 'Template not found' })];
        _listAutomations_decorators = [Get('automations'), ApiOperation({ summary: 'List user automations' }), ApiQuery({ name: 'limit', required: false, description: 'Maximum number of results' }), ApiResponse({ status: 200, description: 'Automations retrieved successfully' })];
        _getAutomation_decorators = [Get('automations/:automationId'), ApiOperation({ summary: 'Get specific automation result' }), ApiResponse({ status: 200, description: 'Automation result retrieved successfully' }), ApiResponse({ status: 404, description: 'Automation not found' })];
        _cancelAutomation_decorators = [Put('automations/:automationId/cancel'), ApiOperation({ summary: 'Cancel a running automation' }), ApiResponse({ status: 200, description: 'Automation cancelled successfully' }), ApiResponse({ status: 404, description: 'Automation not found' }), ApiResponse({ status: 400, description: 'Automation cannot be cancelled' })];
        _getUserStats_decorators = [Get('stats'), ApiOperation({ summary: 'Get user automation usage statistics' }), ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })];
        _healthCheck_decorators = [Get('health'), ApiOperation({ summary: 'Health check for Claude Dev automation service' }), ApiResponse({ status: 200, description: 'Service is healthy' })];
        __esDecorate(_classThis, null, _listTemplates_decorators, { kind: "method", name: "listTemplates", static: false, private: false, access: { has: obj => "listTemplates" in obj, get: obj => obj.listTemplates }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getTemplate_decorators, { kind: "method", name: "getTemplate", static: false, private: false, access: { has: obj => "getTemplate" in obj, get: obj => obj.getTemplate }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createTemplate_decorators, { kind: "method", name: "createTemplate", static: false, private: false, access: { has: obj => "createTemplate" in obj, get: obj => obj.createTemplate }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteTemplate_decorators, { kind: "method", name: "deleteTemplate", static: false, private: false, access: { has: obj => "deleteTemplate" in obj, get: obj => obj.deleteTemplate }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _executeAutomation_decorators, { kind: "method", name: "executeAutomation", static: false, private: false, access: { has: obj => "executeAutomation" in obj, get: obj => obj.executeAutomation }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _listAutomations_decorators, { kind: "method", name: "listAutomations", static: false, private: false, access: { has: obj => "listAutomations" in obj, get: obj => obj.listAutomations }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAutomation_decorators, { kind: "method", name: "getAutomation", static: false, private: false, access: { has: obj => "getAutomation" in obj, get: obj => obj.getAutomation }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _cancelAutomation_decorators, { kind: "method", name: "cancelAutomation", static: false, private: false, access: { has: obj => "cancelAutomation" in obj, get: obj => obj.cancelAutomation }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getUserStats_decorators, { kind: "method", name: "getUserStats", static: false, private: false, access: { has: obj => "getUserStats" in obj, get: obj => obj.getUserStats }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _healthCheck_decorators, { kind: "method", name: "healthCheck", static: false, private: false, access: { has: obj => "healthCheck" in obj, get: obj => obj.healthCheck }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ClaudeDevAutomationController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ClaudeDevAutomationController = _classThis;
})();
export { ClaudeDevAutomationController };
