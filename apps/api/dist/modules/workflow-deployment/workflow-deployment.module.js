"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowDeploymentModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const cloudflare_deployment_service_1 = require("./cloudflare-deployment.service");
const workflow_deployment_controller_1 = require("./workflow-deployment.controller");
let WorkflowDeploymentModule = class WorkflowDeploymentModule {
};
exports.WorkflowDeploymentModule = WorkflowDeploymentModule;
exports.WorkflowDeploymentModule = WorkflowDeploymentModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        controllers: [workflow_deployment_controller_1.WorkflowDeploymentController],
        providers: [cloudflare_deployment_service_1.CloudflareDeploymentService],
        exports: [cloudflare_deployment_service_1.CloudflareDeploymentService],
    })
], WorkflowDeploymentModule);
//# sourceMappingURL=workflow-deployment.module.js.map