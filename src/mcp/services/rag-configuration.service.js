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
var RAGConfigurationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RAGConfigurationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let RAGConfigurationService = RAGConfigurationService_1 = class RAGConfigurationService {
    configService;
    logger = new common_1.Logger(RAGConfigurationService_1.name);
    config;
    constructor(configService) {
        this.configService = configService;
        this.config = this.loadConfiguration();
        this.logger.log('RAG Configuration loaded', {
            serverUrl: this.config.serverUrl,
            collections: Object.keys(this.config.collections)
        });
    }
    loadConfiguration() {
        return {
            serverUrl: this.configService.get('RAG_SERVER_URL', 'http://localhost'),
            serverPort: this.configService.get('RAG_SERVER_PORT', 8000),
            timeout: this.configService.get('RAG_TIMEOUT', 30000),
            retryAttempts: this.configService.get('RAG_RETRY_ATTEMPTS', 3),
            retryDelay: this.configService.get('RAG_RETRY_DELAY', 1000),
            crawlingConfig: {
                maxDepth: this.configService.get('RAG_CRAWL_MAX_DEPTH', 3),
                maxPages: this.configService.get('RAG_CRAWL_MAX_PAGES', 100),
                userAgent: this.configService.get('RAG_CRAWL_USER_AGENT', 'The New Fuse RAG Crawler'),
                delay: this.configService.get('RAG_CRAWL_DELAY', 1000),
            },
            collections: {
                vscode: {
                    name: this.configService.get('RAG_VSCODE_COLLECTION', 'vscode_docs'),
                    defaultUrl: this.configService.get('RAG_VSCODE_URL', 'https://code.visualstudio.com/docs'),
                },
                copilot: {
                    name: this.configService.get('RAG_COPILOT_COLLECTION', 'copilot_docs'),
                    defaultUrl: this.configService.get('RAG_COPILOT_URL', 'https://docs.github.com/en/copilot'),
                },
                typescript: {
                    name: this.configService.get('RAG_TYPESCRIPT_COLLECTION', 'typescript_docs'),
                    defaultUrl: this.configService.get('RAG_TYPESCRIPT_URL', 'https://www.typescriptlang.org/docs'),
                },
                nestjs: {
                    name: this.configService.get('RAG_NESTJS_COLLECTION', 'nestjs_docs'),
                    defaultUrl: this.configService.get('RAG_NESTJS_URL', 'https://docs.nestjs.com'),
                },
            },
        };
    }
    getConfiguration() {
        return this.config;
    }
    getServerUrl() {
        return `${this.config.serverUrl}:${this.config.serverPort}`;
    }
    getCrawlingConfig() {
        return this.config.crawlingConfig;
    }
    getCollectionConfig(collectionName) {
        return this.config.collections[collectionName];
    }
    getAllCollections() {
        return this.config.collections;
    }
    updateConfiguration(updates) {
        Object.assign(this.config, updates);
        this.logger.log('RAG Configuration updated', updates);
    }
    validateConfiguration() {
        try {
            // Validate required fields
            if (!this.config.serverUrl || !this.config.serverPort) {
                this.logger.error('Invalid RAG configuration: serverUrl and serverPort are required');
                return false;
            }
            // Validate collections
            for (const [key, collection] of Object.entries(this.config.collections)) {
                if (!collection.name || !collection.defaultUrl) {
                    this.logger.error(`Invalid collection configuration for ${key}: name and defaultUrl are required`);
                    return false;
                }
            }
            this.logger.log('RAG Configuration validation passed');
            return true;
        }
        catch (error) {
            this.logger.error('RAG Configuration validation failed:', error);
            return false;
        }
    }
    /**
     * Get environment variables template for documentation
     */
    getEnvironmentTemplate() {
        return {
            RAG_SERVER_URL: 'http://localhost',
            RAG_SERVER_PORT: '8000',
            RAG_TIMEOUT: '30000',
            RAG_RETRY_ATTEMPTS: '3',
            RAG_RETRY_DELAY: '1000',
            RAG_CRAWL_MAX_DEPTH: '3',
            RAG_CRAWL_MAX_PAGES: '100',
            RAG_CRAWL_USER_AGENT: 'The New Fuse RAG Crawler',
            RAG_CRAWL_DELAY: '1000',
            RAG_VSCODE_COLLECTION: 'vscode_docs',
            RAG_VSCODE_URL: 'https://code.visualstudio.com/docs',
            RAG_COPILOT_COLLECTION: 'copilot_docs',
            RAG_COPILOT_URL: 'https://docs.github.com/en/copilot',
            RAG_TYPESCRIPT_COLLECTION: 'typescript_docs',
            RAG_TYPESCRIPT_URL: 'https://www.typescriptlang.org/docs',
            RAG_NESTJS_COLLECTION: 'nestjs_docs',
            RAG_NESTJS_URL: 'https://docs.nestjs.com',
        };
    }
};
exports.RAGConfigurationService = RAGConfigurationService;
exports.RAGConfigurationService = RAGConfigurationService = RAGConfigurationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RAGConfigurationService);
//# sourceMappingURL=rag-configuration.service.js.map