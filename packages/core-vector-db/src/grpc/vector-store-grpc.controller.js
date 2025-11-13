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
var VectorStoreGrpcController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorStoreGrpcController = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const vector_database_service_1 = require("../vector-database.service");
const openai_embedding_provider_1 = require("../drivers/openai-embedding.provider");
let VectorStoreGrpcController = VectorStoreGrpcController_1 = class VectorStoreGrpcController {
    vectorService;
    embeddingProvider;
    logger = new common_1.Logger(VectorStoreGrpcController_1.name);
    constructor(vectorService, embeddingProvider) {
        this.vectorService = vectorService;
        this.embeddingProvider = embeddingProvider;
    }
    async createCollection(request, _metadata, _call) {
        try {
            this.logger.log(`Creating collection: ${request.name});
      
      await this.vectorService.createCollection({
        name: request.name,
        dimension: request.dimension,
        metric: (request.metric as "cosine" | "euclidean" | "dot_product") || 'cosine',
        // config: request.config || {}, // Removed, not in CollectionConfig type
      });

      return {
        success: true,`, message, `Collection "${request.name}`, " created successfully,);
        }
        finally { }
        ;
    }
    catch(error) {
        if (error instanceof Error) {
            this.logger.error(Failed, to, create, collection, $, { error, : .message }, error.stack);
            return {
                success: false,
                message: error.message,
            };
        }
        else {
            `
        this.logger.error(Failed to create collection: ${String(error)}`;
            ;
            return {
                success: false,
                message: String(error),
            };
        }
    }
};
exports.VectorStoreGrpcController = VectorStoreGrpcController;
__decorate([
    (0, microservices_1.GrpcMethod)('VectorStoreService', 'CreateCollection'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Function, Object]),
    __metadata("design:returntype", Promise)
], VectorStoreGrpcController.prototype, "createCollection", null);
exports.VectorStoreGrpcController = VectorStoreGrpcController = VectorStoreGrpcController_1 = __decorate([
    (0, common_1.Controller)(),
    (0, microservices_1.GrpcService)(),
    __metadata("design:paramtypes", [vector_database_service_1.VectorDatabaseService,
        openai_embedding_provider_1.OpenAIEmbeddingProvider])
], VectorStoreGrpcController);
upsertDocuments(request, UpsertDocumentsRequest, _metadata, Metadata, _call, (grpc_js_1.ServerUnaryCall));
Promise < UpsertDocumentsResponse > {
    try: {
        this: .logger.log(Upserting, $, { request, : .documents.length }, documents, to, collection, $, { request, : .collection } `);
      
      let documents = request.documents;

      // Generate embeddings if requested and not provided
      if (request.generateEmbeddings) {
        documents = await Promise.all(
          request.documents.map(async (doc) => {
            if (!doc.embedding || doc.embedding.length === 0) {
              const embedding = await this.embeddingProvider.generateEmbedding(doc.content);
              return { ...doc, embedding };
            }
            return doc;
          }),
        );
      }

      await this.vectorService.addDocuments(request.collection, documents);

      return {
        success: true,
        message: Successfully upserted ${documents.length} documents,
        documentsProcessed: documents.length,
      };
    } catch (error) {`),
        if(error) { }, instanceof: Error
    }
};
{
    `
        this.logger.error(`;
    Failed;
    to;
    upsert;
    documents: $;
    {
        error.message;
    }
    error.stack;
    ;
    return {
        success: false,
        message: error.message,
        documentsProcessed: 0,
    };
}
{
    `
        this.logger.error(Failed to upsert documents: ${String(error)}`;
    ;
    return {
        success: false,
        message: String(error),
        documentsProcessed: 0,
    };
}
getDocument(request, GetDocumentRequest, _metadata, Metadata, _call, (grpc_js_1.ServerUnaryCall));
Promise < GetDocumentResponse > {
    try: {
        const: document = await this.vectorService.getDocument(request.collection, request.id),
        if(document) {
            return {
                document: {
                    ...document,
                    metadata: document.metadata || {},
                    embedding: document.embedding ?? [],
                },
                found: true,
            };
        }, else: {
            return: {
                document: {},
                found: false,
            }
        }
    }, catch(error) {
        if (error instanceof Error) {
            this.logger.error(Failed, to, get, document, $, { error, : .message } `, error.stack);
      } else {
        this.logger.error(Failed to get document: ${String(error)});
      }
      return {
        document: {} as VectorDocument,
        found: false,
      };
    }
  }

  @GrpcMethod('VectorStoreService', 'SimilaritySearch')
  async similaritySearch(
    request: SimilaritySearchRequest,
    _metadata: Metadata,
    _call: ServerUnaryCall<SimilaritySearchRequest, SimilaritySearchResponse>,
  ): Promise<SimilaritySearchResponse> {
    try {
      let embedding = request.embedding;

      // Generate embedding from text if provided
      if (request.text && (!embedding || embedding.length === 0)) {
        embedding = await this.embeddingProvider.generateEmbedding(request.text);
      }

      if (!embedding || embedding.length === 0) {
        throw new Error('Either embedding or text must be provided for similarity search');
      }

      const results = await this.vectorService.searchByEmbedding(
        request.collection,
        embedding,
        {
          limit: request.limit || 10,
          threshold: request.threshold || 0.0,
          metadata_filter: request.metadataFilter,
        }
      );

      return {
        results: results.map((result: any) => ({
          id: result.id,
          content: result.content,
          metadata: result.metadata || {},
          score: result.score,
          distance: result.distance,
        })),
      };
    } catch (error) {
      if (error instanceof Error) {`, this.logger.error(Failed, to, perform, similarity, search, $, { error, : .message } ``, error.stack));
        }
        else {
            this.logger.error(Failed, to, perform, similarity, search, $, {});
        }
        return {
            results: [],
        };
    }
};
healthCheck();
Promise < HealthCheckResponse > {
    try: {
        const: isHealthy = await this.vectorService.isHealthy(),
        return: {
            healthy: isHealthy,
            status: isHealthy ? 'healthy' : 'unhealthy',
            details: {
                service: 'vector-store',
                timestamp: new Date().toISOString(),
            },
        }
    }, catch(error) {
        if (error instanceof Error) {
            `
        this.logger.error(`;
            Health;
            check;
            failed: $;
            {
                error.message;
            }
            `, error.stack);
        return {
          healthy: false,
          status: 'error',
          details: {
            error: error.message,
            timestamp: new Date().toISOString(),
          },
        };
      } else {
        this.logger.error(Health check failed: ${String(error)});
        return {
          healthy: false,
          status: 'error',
          details: {
            error: String(error),
            timestamp: new Date().toISOString(),
          },
        };
      }
    }
  }

  @GrpcMethod('VectorStoreService', 'GetStats')
  async getStats(
    request: GetStatsRequest,
    _metadata: Metadata,
    _call: ServerUnaryCall<GetStatsRequest, GetStatsResponse>,
  ): Promise<GetStatsResponse> {
    try {
      const stats = await this.vectorService.getStats(request.collection);
      
      return {
        stats,
      };
    } catch (error) {
      if (error instanceof Error) {`;
            this.logger.error(`Failed to get stats: ${error.message}`, error.stack);
            return {
                stats: {
                    error: error.message,
                },
            };
        }
        else {
            this.logger.error(Failed, to, get, stats, $, {});
            return {
                stats: {
                    error: String(error),
                },
            };
        }
    }
};
listCollections();
Promise < { collections: string[] } > {
    try: {
        const: collections = await this.vectorService.listCollections(),
        return: { collections }
    }, catch(error) {
        if (error instanceof Error) {
            `
        this.logger.error(Failed to list collections: ${error.message}`, error.stack;
            ;
        }
        else {
            this.logger.error(Failed, to, list, collections, $, {});
        }
        return { collections: [] };
    }
};
deleteCollection(request, { name: string });
Promise < { success: boolean, message: string } > {
    try: {
        await, this: .vectorService.deleteCollection(request.name)
    } `
      return {`,
    success: true,
    message: Collection, "${request.name}`": deleted, successfully,
};
try { }
catch (error) {
    if (error instanceof Error) {
        this.logger.error(Failed, to, delete collection, $, { error, : .message }, error.stack);
        return {
            success: false,
            message: error.message,
        } `
        };`;
    }
    else {
        this.logger.error(Failed, to, delete collection, $, {} `);
        return {
          success: false,
          message: String(error),
        };
      }
    }
  }
});
    }
}
//# sourceMappingURL=vector-store-grpc.controller.js.map