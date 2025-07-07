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
exports.LLMProviderController = void 0;
const common_1 = require("@nestjs/common");
const llm_provider_service_1 = require("./llm-provider.service");
const swagger_1 = require("@nestjs/swagger");
let LLMProviderController = class LLMProviderController {
    llmProviderService;
    constructor(llmProviderService) {
        this.llmProviderService = llmProviderService;
    }
    async findAll() {
        try {
            return await this.llmProviderService.findAll();
        }
        catch (error) {
            throw new common_1.HttpException(`Failed to fetch LLM providers: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async create(createLLMProviderDto) {
        try {
            return await this.llmProviderService.create(createLLMProviderDto);
        }
        catch (error) {
            throw new common_1.HttpException(`Failed to create LLM provider: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async findOne(id) {
        try {
            return await this.llmProviderService.findById(id);
        }
        catch (error) {
            throw new common_1.HttpException(`Failed to find LLM provider: ${error.message}`, common_1.HttpStatus.NOT_FOUND);
        }
    }
    async update(id, updateLLMProviderDto) {
        try {
            return await this.llmProviderService.update(id, updateLLMProviderDto);
        }
        catch (error) {
            throw new common_1.HttpException(`Failed to update LLM provider: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async remove(id) {
        try {
            await this.llmProviderService.delete(id);
            return { success: true };
        }
        catch (error) {
            throw new common_1.HttpException(`Failed to delete LLM provider: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async setDefault(id) {
        try {
            return await this.llmProviderService.setDefault(id);
        }
        catch (error) {
            throw new common_1.HttpException(`Failed to set LLM provider as default: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.LLMProviderController = LLMProviderController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all LLM providers' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns all available LLM providers' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LLMProviderController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new LLM provider' }),
    (0, swagger_1.ApiBody)({ type: llm_provider_service_1.CreateLLMProviderDTO }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'The LLM provider has been successfully created' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LLMProviderController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get an LLM provider by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns the LLM provider' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'LLM provider not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LLMProviderController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update an LLM provider' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'The LLM provider has been successfully updated' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LLMProviderController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete an LLM provider' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'The LLM provider has been successfully deleted' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LLMProviderController.prototype, "remove", null);
__decorate([
    (0, common_1.Put)(':id/default'),
    (0, swagger_1.ApiOperation)({ summary: 'Set an LLM provider as default' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'The LLM provider has been set as default' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LLMProviderController.prototype, "setDefault", null);
exports.LLMProviderController = LLMProviderController = __decorate([
    (0, swagger_1.ApiTags)('llm'),
    (0, common_1.Controller)('api/llm/providers'),
    __metadata("design:paramtypes", [llm_provider_service_1.LLMProviderService])
], LLMProviderController);
