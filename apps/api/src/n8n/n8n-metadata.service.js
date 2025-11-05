var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var N8nMetadataService_1;
var _a;
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { Logger } from '@nestjs/common';
let N8nMetadataService = N8nMetadataService_1 = class N8nMetadataService {
    httpService;
    configService;
    logger;
    constructor(httpService, configService) {
        this.httpService = httpService;
        this.configService = configService;
        this.logger = new Logger(N8nMetadataService_1.name);
    }
    async getAllNodeTypes() {
        try {
            const n8nUrl = this.configService.get('N8N_URL');
            const n8nApiKey = this.configService.get('N8N_API_KEY');
            if (!n8nUrl || !n8nApiKey) {
                throw new Error('N8N configuration missing');
            }
            const response = await firstValueFrom(this.httpService.get(`${n8nUrl}/api/v1/node-types`, {
                headers: {
                    'X-N8N-API-KEY': n8nApiKey,
                },
            }));
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to fetch node types: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }
    async getNodeTypeDescription(nodeType) {
        try {
            const n8nUrl = this.configService.get('N8N_URL');
            const n8nApiKey = this.configService.get('N8N_API_KEY');
            if (!n8nUrl || !n8nApiKey) {
                throw new Error('N8N configuration missing');
            }
            const response = await firstValueFrom(this.httpService.get(`${n8nUrl}/api/v1/node-types/${nodeType}`, {
                headers: {
                    'X-N8N-API-KEY': n8nApiKey,
                },
            }));
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to fetch node type description for ${nodeType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }
    async getCredentialTypes() {
        try {
            const n8nUrl = this.configService.get('N8N_URL');
            const n8nApiKey = this.configService.get('N8N_API_KEY');
            if (!n8nUrl || !n8nApiKey) {
                throw new Error('N8N configuration missing');
            }
            const response = await firstValueFrom(this.httpService.get(`${n8nUrl}/api/v1/credentials/schema`, {
                headers: {
                    'X-N8N-API-KEY': n8nApiKey,
                },
            }));
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to fetch credential types: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }
};
N8nMetadataService = N8nMetadataService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof HttpService !== "undefined" && HttpService) === "function" ? _a : Object, ConfigService])
], N8nMetadataService);
export { N8nMetadataService };
//# sourceMappingURL=n8n-metadata.service.js.map