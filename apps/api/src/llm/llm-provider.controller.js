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
import { Controller, Get, Post, Body, Param, Put, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { LLMProviderService, CreateLLMProviderDTO } from './llm-provider.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
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
            throw new HttpException(`Failed to fetch LLM providers: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async create(createLLMProviderDto) {
        try {
            return await this.llmProviderService.create(createLLMProviderDto);
        }
        catch (error) {
            throw new HttpException(`Failed to create LLM provider: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async findOne(id) {
        try {
            return await this.llmProviderService.findById(id);
        }
        catch (error) {
            throw new HttpException(`Failed to find LLM provider: ${error.message}`, HttpStatus.NOT_FOUND);
        }
    }
    async update(id, updateLLMProviderDto) {
        try {
            return await this.llmProviderService.update(id, updateLLMProviderDto);
        }
        catch (error) {
            throw new HttpException(`Failed to update LLM provider: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async remove(id) {
        try {
            await this.llmProviderService.delete(id);
            return { success: true };
        }
        catch (error) {
            throw new HttpException(`Failed to delete LLM provider: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async setDefault(id) {
        try {
            return await this.llmProviderService.setDefault(id);
        }
        catch (error) {
            throw new HttpException(`Failed to set LLM provider as default: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async registerClaudeCodeCLI() {
        try {
            const provider = await this.llmProviderService.registerClaudeCodeCLI();
            if (!provider) {
                return {
                    success: false,
                    message: 'Claude Code CLI is not available on this system. Please ensure it is installed and accessible.'
                };
            }
            return {
                success: true,
                provider,
                message: 'Claude Code CLI has been successfully registered as a local LLM provider'
            };
        }
        catch (error) {
            throw new HttpException(`Failed to register Claude Code CLI: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async registerGeminiCLI() {
        try {
            const provider = await this.llmProviderService.registerGeminiCLI();
            if (!provider) {
                return {
                    success: false,
                    message: 'Gemini CLI is not available on this system. Please ensure it is installed and accessible.'
                };
            }
            return {
                success: true,
                provider,
                message: 'Gemini CLI has been successfully registered as a local LLM provider'
            };
        }
        catch (error) {
            throw new HttpException(`Failed to register Gemini CLI: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async registerOllama() {
        try {
            const provider = await this.llmProviderService.registerOllama();
            if (!provider) {
                return {
                    success: false,
                    message: 'Ollama is not available on this system. Please ensure it is installed and running.'
                };
            }
            return {
                success: true,
                provider,
                message: 'Ollama has been successfully registered as a local LLM provider'
            };
        }
        catch (error) {
            throw new HttpException(`Failed to register Ollama: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
__decorate([
    Get(),
    ApiOperation({ summary: 'Get all LLM providers' }),
    ApiResponse({ status: 200, description: 'Returns all available LLM providers' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LLMProviderController.prototype, "findAll", null);
__decorate([
    Post(),
    ApiOperation({ summary: 'Create a new LLM provider' }),
    ApiBody({ description: 'LLM Provider creation data' }),
    ApiResponse({ status: 201, description: 'The LLM provider has been successfully created' }),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof CreateLLMProviderDTO !== "undefined" && CreateLLMProviderDTO) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], LLMProviderController.prototype, "create", null);
__decorate([
    Get(':id'),
    ApiOperation({ summary: 'Get an LLM provider by ID' }),
    ApiResponse({ status: 200, description: 'Returns the LLM provider' }),
    ApiResponse({ status: 404, description: 'LLM provider not found' }),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LLMProviderController.prototype, "findOne", null);
__decorate([
    Put(':id'),
    ApiOperation({ summary: 'Update an LLM provider' }),
    ApiResponse({ status: 200, description: 'The LLM provider has been successfully updated' }),
    __param(0, Param('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LLMProviderController.prototype, "update", null);
__decorate([
    Delete(':id'),
    ApiOperation({ summary: 'Delete an LLM provider' }),
    ApiResponse({ status: 200, description: 'The LLM provider has been successfully deleted' }),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LLMProviderController.prototype, "remove", null);
__decorate([
    Put(':id/default'),
    ApiOperation({ summary: 'Set an LLM provider as default' }),
    ApiResponse({ status: 200, description: 'The LLM provider has been set as default' }),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LLMProviderController.prototype, "setDefault", null);
__decorate([
    Post('register-claude-code-cli'),
    ApiOperation({ summary: 'Register Claude Code CLI as local LLM provider' }),
    ApiResponse({ status: 201, description: 'Claude Code CLI has been successfully registered' }),
    ApiResponse({ status: 404, description: 'Claude Code CLI not available on this system' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LLMProviderController.prototype, "registerClaudeCodeCLI", null);
__decorate([
    Post('register-gemini-cli'),
    ApiOperation({ summary: 'Register Gemini CLI as local LLM provider' }),
    ApiResponse({ status: 201, description: 'Gemini CLI has been successfully registered' }),
    ApiResponse({ status: 404, description: 'Gemini CLI not available on this system' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LLMProviderController.prototype, "registerGeminiCLI", null);
__decorate([
    Post('register-ollama'),
    ApiOperation({ summary: 'Register Ollama local LLM provider' }),
    ApiResponse({ status: 201, description: 'Ollama has been successfully registered' }),
    ApiResponse({ status: 404, description: 'Ollama not available on this system' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LLMProviderController.prototype, "registerOllama", null);
LLMProviderController = __decorate([
    ApiTags('llm'),
    Controller('api/llm/providers'),
    __metadata("design:paramtypes", [typeof (_a = typeof LLMProviderService !== "undefined" && LLMProviderService) === "function" ? _a : Object])
], LLMProviderController);
export { LLMProviderController };
//# sourceMappingURL=llm-provider.controller.js.map