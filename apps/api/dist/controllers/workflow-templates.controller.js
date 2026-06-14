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
exports.WorkflowTemplatesController = void 0;
const common_1 = require("@nestjs/common");
const workflow_templates_service_1 = require("../services/workflow-templates.service");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const user_decorator_1 = require("../decorators/user.decorator");
let WorkflowTemplatesController = class WorkflowTemplatesController {
    constructor(templatesService) {
        this.templatesService = templatesService;
    }
    async findAll(user) {
        return this.templatesService.findAll(user?.id);
    }
    async findOne(id) {
        return this.templatesService.findOne(id);
    }
    async create(createDto, user) {
        return this.templatesService.create(createDto, user.userId);
    }
    async update(id, updateDto, user) {
        return this.templatesService.update(id, updateDto, user.userId);
    }
    async remove(id, user) {
        return this.templatesService.remove(id, user.userId);
    }
};
exports.WorkflowTemplatesController = WorkflowTemplatesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkflowTemplatesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WorkflowTemplatesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WorkflowTemplatesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], WorkflowTemplatesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkflowTemplatesController.prototype, "remove", null);
exports.WorkflowTemplatesController = WorkflowTemplatesController = __decorate([
    (0, common_1.Controller)('workflow-templates'),
    __metadata("design:paramtypes", [workflow_templates_service_1.WorkflowTemplatesService])
], WorkflowTemplatesController);
//# sourceMappingURL=workflow-templates.controller.js.map