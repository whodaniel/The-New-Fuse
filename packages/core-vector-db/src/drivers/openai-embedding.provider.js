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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var OpenAIEmbeddingProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIEmbeddingProvider = void 0;
const common_1 = require("@nestjs/common");
const openai_1 = __importDefault(require("openai"));
let OpenAIEmbeddingProvider = OpenAIEmbeddingProvider_1 = class OpenAIEmbeddingProvider {
    config;
    logger = new common_1.Logger(OpenAIEmbeddingProvider_1.name);
    client;
    model;
    dimension;
    constructor(config) {
        this.config = config;
        this.client = new openai_1.default({
            apiKey: config.apiKey,
            baseURL: config.baseUrl,
        });
        this.model = config.model || 'text-embedding-3-small';
        this.dimension = config.dimension || this.getDefaultDimension(this.model);
    }
    async generateEmbedding(text) {
        try {
            const response = await this.client.embeddings.create({
                model: this.model,
                input: text,
                dimensions: this.dimension,
            });
            const embedding = response.data[0].embedding;
            this.logger.debug(`Generated embedding for text of length ${text.length});
      
      return embedding;
    } catch (error) {
      this.logger.error('Failed to generate embedding', error);`);
            throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        finally {
        }
    }
    async generateEmbeddings(texts) {
        try {
            // Process in batches to avoid rate limits
            const batchSize = 100;
            const results = [];
            for (let i = 0; i < texts.length; i += batchSize) {
                const batch = texts.slice(i, i + batchSize);
                const response = await this.client.embeddings.create({
                    model: this.model,
                    input: batch,
                    dimensions: this.dimension,
                });
                const batchEmbeddings = response.data.map(item => item.embedding);
                results.push(...batchEmbeddings);
            }
            this.logger.debug(Generated, $, { results, : .length }, embeddings);
            for (batch of texts)
                ;
            return results;
        }
        catch (error) {
            this.logger.error('Failed to generate batch embeddings', error);
            `
      throw new Error(Failed to generate batch embeddings: ${error instanceof Error ? error.message : 'Unknown error'}` `);
    }
  }

  getDimension(): number {
    return this.dimension;
  }

  getModelName(): string {
    return this.model;
  }

  private getDefaultDimension(model: string): number {
    const dimensionMap: Record<string, number> = {
      'text-embedding-ada-002': 1536,
      'text-embedding-3-small': 1536,
      'text-embedding-3-large': 3072,
    };

    return dimensionMap[model] || 1536;
  }
};
        }
    }
};
exports.OpenAIEmbeddingProvider = OpenAIEmbeddingProvider;
exports.OpenAIEmbeddingProvider = OpenAIEmbeddingProvider = OpenAIEmbeddingProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object])
], OpenAIEmbeddingProvider);
//# sourceMappingURL=openai-embedding.provider.js.map