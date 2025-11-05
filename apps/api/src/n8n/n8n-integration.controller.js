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
var _a, _b;
import { Controller, Post, Body, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { Logger } from '@nestjs/common';
import { N8nMetadataService } from './n8n-metadata.service';
import { WorkflowValidator } from './workflow.validator';
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
        this.logger = new Logger(N8nIntegrationController_1.name);
        this.validator = new WorkflowValidator();
    }
    async createWorkflow(workflowData) {
        try {
            // Validate workflow structure
            const nodeTypes = await this.metadataService.getAllNodeTypes();
            const validationErrors = this.validator.validate(workflowData.nodes, workflowData.edges, nodeTypes);
            if (validationErrors.length > 0) {
                throw new HttpException({
                    status: HttpStatus.BAD_REQUEST,
                    error: 'Invalid workflow',
                    details: validationErrors,
                }, HttpStatus.BAD_REQUEST);
            }
            const n8nUrl = this.configService.get('N8N_URL');
            const n8nApiKey = this.configService.get('N8N_API_KEY');
            if (!n8nUrl || !n8nApiKey) {
                throw new Error('N8N configuration missing');
            }
            const response = await firstValueFrom(this.httpService.post(`${n8nUrl}/api/v1/workflows`, {
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
            const response = await firstValueFrom(this.httpService.get(`${n8nUrl}/api/v1/credentials?type=${type}`, {
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
            const response = await firstValueFrom(this.httpService.post(`${n8nUrl}/api/v1/workflows/test`, {
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
__decorate([
    Post('workflow'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], N8nIntegrationController.prototype, "createWorkflow", null);
__decorate([
    Get('node-types'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], N8nIntegrationController.prototype, "getNodeTypes", null);
__decorate([
    Get('node-types/:type'),
    __param(0, Param('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], N8nIntegrationController.prototype, "getNodeTypeDescription", null);
__decorate([
    Get('credentials/:type'),
    __param(0, Param('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], N8nIntegrationController.prototype, "getCredentials", null);
__decorate([
    Post('test-workflow'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], N8nIntegrationController.prototype, "testWorkflow", null);
N8nIntegrationController = N8nIntegrationController_1 = __decorate([
    Controller('n8n'),
    __metadata("design:paramtypes", [typeof (_a = typeof HttpService !== "undefined" && HttpService) === "function" ? _a : Object, ConfigService, typeof (_b = typeof N8nMetadataService !== "undefined" && N8nMetadataService) === "function" ? _b : Object])
], N8nIntegrationController);
export { N8nIntegrationController };
//# sourceMappingURL=n8n-integration.controller.js.map