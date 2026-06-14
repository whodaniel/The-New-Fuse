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
exports.WorkflowDeploymentController = void 0;
const common_1 = require("@nestjs/common");
const cloudflare_deployment_service_1 = require("./cloudflare-deployment.service");
let WorkflowDeploymentController = class WorkflowDeploymentController {
    constructor(deploymentService) {
        this.deploymentService = deploymentService;
    }
    async deploy(id, workflow) {
        // Note: In a production scenario, we would fetch the workflow from the database
        // using the ID. For this implementation, we expect the full workflow object in the body
        // to allow for deploying "draft" versions from the UI.
        if (!workflow) {
            throw new common_1.NotFoundException('Workflow definition required');
        }
        return await this.deploymentService.deployWorkflow(workflow);
    }
};
exports.WorkflowDeploymentController = WorkflowDeploymentController;
__decorate([
    (0, common_1.Post)(':id/deploy-to-cloudflare'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkflowDeploymentController.prototype, "deploy", null);
exports.WorkflowDeploymentController = WorkflowDeploymentController = __decorate([
    (0, common_1.Controller)('workflow'),
    __metadata("design:paramtypes", [cloudflare_deployment_service_1.CloudflareDeploymentService])
], WorkflowDeploymentController);
//# sourceMappingURL=workflow-deployment.controller.js.map