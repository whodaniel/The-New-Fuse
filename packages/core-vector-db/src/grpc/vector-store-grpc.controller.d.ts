import { VectorDatabaseService } from '../vector-database.service';
import { OpenAIEmbeddingProvider } from '../drivers/openai-embedding.provider';
import type { Metadata, ServerUnaryCall } from '@grpc/grpc-js';
interface CreateCollectionRequest {
    name: string;
    dimension: number;
    metric: "cosine" | "euclidean" | "dot_product";
    config: {
        [key: string]: string;
    };
}
interface CreateCollectionResponse {
    success: boolean;
    message: string;
}
export declare class VectorStoreGrpcController {
    private readonly vectorService;
    private readonly embeddingProvider;
    private readonly logger;
    constructor(vectorService: VectorDatabaseService, embeddingProvider: OpenAIEmbeddingProvider);
    createCollection(request: CreateCollectionRequest, _metadata: Metadata, _call: ServerUnaryCall<CreateCollectionRequest, CreateCollectionResponse>): Promise<CreateCollectionResponse>;
    catch(error: any): {
        success: boolean;
        message: string;
    };
}
export {};
//# sourceMappingURL=vector-store-grpc.controller.d.ts.map