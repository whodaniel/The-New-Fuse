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
exports.PromptTemplatesController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const prompt_templates_service_1 = require("../services/prompt-templates.service");
let PromptTemplatesController = class PromptTemplatesController {
    constructor(service) {
        this.service = service;
    }
    // Templates
    createTemplate(data) {
        return this.service.createTemplate(data);
    }
    findAllTemplates(query) {
        return this.service.findAllTemplates(query);
    }
    findTemplate(id) {
        return this.service.findTemplate(id);
    }
    updateTemplate(id, data) {
        return this.service.updateTemplate(id, data);
    }
    deleteTemplate(id) {
        return this.service.deleteTemplate(id);
    }
    // Versions
    createVersion(id, data) {
        return this.service.createVersion(id, data);
    }
    getVersions(id) {
        return this.service.getVersions(id);
    }
    compileTemplate(id, body) {
        return this.service.compileTemplate(id, body.variables);
    }
    // Snippets
    createSnippet(data) {
        return this.service.createSnippet(data);
    }
    findAllSnippets(query) {
        return this.service.findAllSnippets(query);
    }
    updateSnippet(id, data) {
        return this.service.updateSnippet(id, data);
    }
    deleteSnippet(id) {
        return this.service.deleteSnippet(id);
    }
};
exports.PromptTemplatesController = PromptTemplatesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PromptTemplatesController.prototype, "createTemplate", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PromptTemplatesController.prototype, "findAllTemplates", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PromptTemplatesController.prototype, "findTemplate", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PromptTemplatesController.prototype, "updateTemplate", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PromptTemplatesController.prototype, "deleteTemplate", null);
__decorate([
    (0, common_1.Post)(':id/versions'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PromptTemplatesController.prototype, "createVersion", null);
__decorate([
    (0, common_1.Get)(':id/versions'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PromptTemplatesController.prototype, "getVersions", null);
__decorate([
    (0, common_1.Post)(':id/compile'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PromptTemplatesController.prototype, "compileTemplate", null);
__decorate([
    (0, common_1.Post)('snippets'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PromptTemplatesController.prototype, "createSnippet", null);
__decorate([
    (0, common_1.Get)('snippets'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PromptTemplatesController.prototype, "findAllSnippets", null);
__decorate([
    (0, common_1.Put)('snippets/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PromptTemplatesController.prototype, "updateSnippet", null);
__decorate([
    (0, common_1.Delete)('snippets/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PromptTemplatesController.prototype, "deleteSnippet", null);
exports.PromptTemplatesController = PromptTemplatesController = __decorate([
    (0, common_1.Controller)('prompt-templates'),
    __metadata("design:paramtypes", [prompt_templates_service_1.PromptTemplatesService])
], PromptTemplatesController);
//# sourceMappingURL=prompt-templates.controller.js.map