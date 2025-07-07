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
Object.defineProperty(exports, "__esModule", { value: true });
exports.N8nMetadataService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
const utils_1 = require("@the-new-fuse/utils");
let N8nMetadataService = class N8nMetadataService {
    httpService;
    configService;
    logger;
    constructor(httpService, configService) {
        this.httpService = httpService;
        this.configService = configService;
        this.logger = new utils_1.Logger({ prefix: 'N8nMetadataService' });
    }
    async getAllNodeTypes() {
        try {
            const n8nUrl = this.configService.get('N8N_URL');
            const n8nApiKey = this.configService.get('N8N_API_KEY');
            if (!n8nUrl || !n8nApiKey) {
                throw new Error('N8N configuration missing');
            }
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${n8nUrl}/api/v1/node-types`, {
                headers: {
                    'X-N8N-API-KEY': n8nApiKey,
                },
            }));
            return response.data;
        }
        catch (error) {
            this.logger.error('Failed to fetch node types', error);
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
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${n8nUrl}/api/v1/node-types/${nodeType}`, {
                headers: {
                    'X-N8N-API-KEY': n8nApiKey,
                },
            }));
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to fetch node type description for ${nodeType}`, error);
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
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${n8nUrl}/api/v1/credentials/schema`, {
                headers: {
                    'X-N8N-API-KEY': n8nApiKey,
                },
            }));
            return response.data;
        }
        catch (error) {
            this.logger.error('Failed to fetch credential types', error);
            throw error;
        }
    }
};
exports.N8nMetadataService = N8nMetadataService;
exports.N8nMetadataService = N8nMetadataService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], N8nMetadataService);
