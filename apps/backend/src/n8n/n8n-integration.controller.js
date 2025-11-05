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
var N8nIntegrationController_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.N8nIntegrationController = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
const common_2 = require("@nestjs/common");
const n8n_metadata_service_1 = require("./n8n-metadata.service");
const workflow_validator_1 = require("./workflow.validator");
let N8nIntegrationController = N8nIntegrationController_1 = class N8nIntegrationController {
    httpService;
    configService;
    metadataService;
    logger;
    validator;
    constructor(httpService, configService, metadataService) {
        this.httpService = httpService;
        this.configService = configService;
        this.metadataService = metadataService;
        this.logger = new common_2.Logger(N8nIntegrationController_1.name);
        this.validator = new workflow_validator_1.WorkflowValidator();
    }
    async createWorkflow(workflowData) {
        try {
            // Validate workflow structure
            const nodeTypes = await this.metadataService.getAllNodeTypes();
            const validationErrors = this.validator.validate(workflowData.nodes, workflowData.edges, nodeTypes);
            if (validationErrors.length > 0) {
                throw new common_1.HttpException({
                    status: common_1.HttpStatus.BAD_REQUEST,
                    error: 'Invalid workflow',
                    details: validationErrors,
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            const n8nUrl = this.configService.get('N8N_URL');
            const n8nApiKey = this.configService.get('N8N_API_KEY');
            if (!n8nUrl || !n8nApiKey) {
                throw new Error('N8N configuration missing');
            }
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${n8nUrl}/api/v1/workflows`, {
                name: workflowData.name || 'New Workflow',
                active: false,
                nodes: workflowData.nodes,
                connections: workflowData.connections,
                settings: {
                    saveDataErrorExecution: 'all',
                    saveDataSuccessExecution: 'all',
                    saveManualExecutions: true,
                    timezone: 'UTC',
                },
            }, {
                headers: {
                    'X-N8N-API-KEY': n8nApiKey,
                },
            }));
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to create workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }
    async getNodeTypes() {
        try {
            return await this.metadataService.getAllNodeTypes();
        }
        catch (error) {
            this.logger.error(`Failed to fetch node types: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }
    async getNodeTypeDescription(type) {
        try {
            return await this.metadataService.getNodeTypeDescription(type);
        }
        catch (error) {
            this.logger.error(`Failed to fetch node type description for ${type}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }
    async getCredentials(type) {
        try {
            const n8nUrl = this.configService.get('N8N_URL');
            const n8nApiKey = this.configService.get('N8N_API_KEY');
            if (!n8nUrl || !n8nApiKey) {
                throw new Error('N8N configuration missing');
            }
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${n8nUrl}/api/v1/credentials?type=${type}`, {
                headers: {
                    'X-N8N-API-KEY': n8nApiKey,
                },
            }));
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to fetch credentials for type ${type}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }
    async testWorkflow(workflowData) {
        try {
            const n8nUrl = this.configService.get('N8N_URL');
            const n8nApiKey = this.configService.get('N8N_API_KEY');
            if (!n8nUrl || !n8nApiKey) {
                throw new Error('N8N configuration missing');
            }
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${n8nUrl}/api/v1/workflows/test`, {
                workflowData: {
                    nodes: workflowData.nodes,
                    connections: workflowData.connections,
                },
            }, {
                headers: {
                    'X-N8N-API-KEY': n8nApiKey,
                },
            }));
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to test workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }
};
exports.N8nIntegrationController = N8nIntegrationController;
__decorate([
    (0, common_1.Post)('workflow'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], N8nIntegrationController.prototype, "createWorkflow", null);
__decorate([
    (0, common_1.Get)('node-types'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], N8nIntegrationController.prototype, "getNodeTypes", null);
__decorate([
    (0, common_1.Get)('node-types/:type'),
    __param(0, (0, common_1.Param)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], N8nIntegrationController.prototype, "getNodeTypeDescription", null);
__decorate([
    (0, common_1.Get)('credentials/:type'),
    __param(0, (0, common_1.Param)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], N8nIntegrationController.prototype, "getCredentials", null);
__decorate([
    (0, common_1.Post)('test-workflow'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], N8nIntegrationController.prototype, "testWorkflow", null);
exports.N8nIntegrationController = N8nIntegrationController = N8nIntegrationController_1 = __decorate([
    (0, common_1.Controller)('n8n'),
    __metadata("design:paramtypes", [typeof (_a = typeof axios_1.HttpService !== "undefined" && axios_1.HttpService) === "function" ? _a : Object, config_1.ConfigService,
        n8n_metadata_service_1.N8nMetadataService])
], N8nIntegrationController);
//# sourceMappingURL=n8n-integration.controller.js.map