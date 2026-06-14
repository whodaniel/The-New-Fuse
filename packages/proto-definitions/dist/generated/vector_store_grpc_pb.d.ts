export namespace VectorStoreServiceService {
    namespace createCollection {
        export let path: string;
        export let requestStream: boolean;
        export let responseStream: boolean;
        export let requestType: typeof vector_store_pb.CreateCollectionRequest;
        export let responseType: typeof vector_store_pb.CreateCollectionResponse;
        export { serialize_vectorstore_v1_CreateCollectionRequest as requestSerialize };
        export { deserialize_vectorstore_v1_CreateCollectionRequest as requestDeserialize };
        export { serialize_vectorstore_v1_CreateCollectionResponse as responseSerialize };
        export { deserialize_vectorstore_v1_CreateCollectionResponse as responseDeserialize };
    }
    namespace deleteCollection {
        let path_1: string;
        export { path_1 as path };
        let requestStream_1: boolean;
        export { requestStream_1 as requestStream };
        let responseStream_1: boolean;
        export { responseStream_1 as responseStream };
        let requestType_1: typeof vector_store_pb.DeleteCollectionRequest;
        export { requestType_1 as requestType };
        let responseType_1: typeof vector_store_pb.DeleteCollectionResponse;
        export { responseType_1 as responseType };
        export { serialize_vectorstore_v1_DeleteCollectionRequest as requestSerialize };
        export { deserialize_vectorstore_v1_DeleteCollectionRequest as requestDeserialize };
        export { serialize_vectorstore_v1_DeleteCollectionResponse as responseSerialize };
        export { deserialize_vectorstore_v1_DeleteCollectionResponse as responseDeserialize };
    }
    namespace listCollections {
        let path_2: string;
        export { path_2 as path };
        let requestStream_2: boolean;
        export { requestStream_2 as requestStream };
        let responseStream_2: boolean;
        export { responseStream_2 as responseStream };
        let requestType_2: any;
        export { requestType_2 as requestType };
        let responseType_2: typeof vector_store_pb.ListCollectionsResponse;
        export { responseType_2 as responseType };
        export { serialize_google_protobuf_Empty as requestSerialize };
        export { deserialize_google_protobuf_Empty as requestDeserialize };
        export { serialize_vectorstore_v1_ListCollectionsResponse as responseSerialize };
        export { deserialize_vectorstore_v1_ListCollectionsResponse as responseDeserialize };
    }
    namespace collectionExists {
        let path_3: string;
        export { path_3 as path };
        let requestStream_3: boolean;
        export { requestStream_3 as requestStream };
        let responseStream_3: boolean;
        export { responseStream_3 as responseStream };
        let requestType_3: typeof vector_store_pb.CollectionExistsRequest;
        export { requestType_3 as requestType };
        let responseType_3: typeof vector_store_pb.CollectionExistsResponse;
        export { responseType_3 as responseType };
        export { serialize_vectorstore_v1_CollectionExistsRequest as requestSerialize };
        export { deserialize_vectorstore_v1_CollectionExistsRequest as requestDeserialize };
        export { serialize_vectorstore_v1_CollectionExistsResponse as responseSerialize };
        export { deserialize_vectorstore_v1_CollectionExistsResponse as responseDeserialize };
    }
    namespace upsertDocuments {
        let path_4: string;
        export { path_4 as path };
        let requestStream_4: boolean;
        export { requestStream_4 as requestStream };
        let responseStream_4: boolean;
        export { responseStream_4 as responseStream };
        let requestType_4: typeof vector_store_pb.UpsertDocumentsRequest;
        export { requestType_4 as requestType };
        let responseType_4: typeof vector_store_pb.UpsertDocumentsResponse;
        export { responseType_4 as responseType };
        export { serialize_vectorstore_v1_UpsertDocumentsRequest as requestSerialize };
        export { deserialize_vectorstore_v1_UpsertDocumentsRequest as requestDeserialize };
        export { serialize_vectorstore_v1_UpsertDocumentsResponse as responseSerialize };
        export { deserialize_vectorstore_v1_UpsertDocumentsResponse as responseDeserialize };
    }
    namespace getDocument {
        let path_5: string;
        export { path_5 as path };
        let requestStream_5: boolean;
        export { requestStream_5 as requestStream };
        let responseStream_5: boolean;
        export { responseStream_5 as responseStream };
        let requestType_5: typeof vector_store_pb.GetDocumentRequest;
        export { requestType_5 as requestType };
        let responseType_5: typeof vector_store_pb.GetDocumentResponse;
        export { responseType_5 as responseType };
        export { serialize_vectorstore_v1_GetDocumentRequest as requestSerialize };
        export { deserialize_vectorstore_v1_GetDocumentRequest as requestDeserialize };
        export { serialize_vectorstore_v1_GetDocumentResponse as responseSerialize };
        export { deserialize_vectorstore_v1_GetDocumentResponse as responseDeserialize };
    }
    namespace updateDocument {
        let path_6: string;
        export { path_6 as path };
        let requestStream_6: boolean;
        export { requestStream_6 as requestStream };
        let responseStream_6: boolean;
        export { responseStream_6 as responseStream };
        let requestType_6: typeof vector_store_pb.UpdateDocumentRequest;
        export { requestType_6 as requestType };
        let responseType_6: typeof vector_store_pb.UpdateDocumentResponse;
        export { responseType_6 as responseType };
        export { serialize_vectorstore_v1_UpdateDocumentRequest as requestSerialize };
        export { deserialize_vectorstore_v1_UpdateDocumentRequest as requestDeserialize };
        export { serialize_vectorstore_v1_UpdateDocumentResponse as responseSerialize };
        export { deserialize_vectorstore_v1_UpdateDocumentResponse as responseDeserialize };
    }
    namespace deleteDocument {
        let path_7: string;
        export { path_7 as path };
        let requestStream_7: boolean;
        export { requestStream_7 as requestStream };
        let responseStream_7: boolean;
        export { responseStream_7 as responseStream };
        let requestType_7: typeof vector_store_pb.DeleteDocumentRequest;
        export { requestType_7 as requestType };
        let responseType_7: typeof vector_store_pb.DeleteDocumentResponse;
        export { responseType_7 as responseType };
        export { serialize_vectorstore_v1_DeleteDocumentRequest as requestSerialize };
        export { deserialize_vectorstore_v1_DeleteDocumentRequest as requestDeserialize };
        export { serialize_vectorstore_v1_DeleteDocumentResponse as responseSerialize };
        export { deserialize_vectorstore_v1_DeleteDocumentResponse as responseDeserialize };
    }
    namespace similaritySearch {
        let path_8: string;
        export { path_8 as path };
        let requestStream_8: boolean;
        export { requestStream_8 as requestStream };
        let responseStream_8: boolean;
        export { responseStream_8 as responseStream };
        let requestType_8: typeof vector_store_pb.SimilaritySearchRequest;
        export { requestType_8 as requestType };
        let responseType_8: typeof vector_store_pb.SimilaritySearchResponse;
        export { responseType_8 as responseType };
        export { serialize_vectorstore_v1_SimilaritySearchRequest as requestSerialize };
        export { deserialize_vectorstore_v1_SimilaritySearchRequest as requestDeserialize };
        export { serialize_vectorstore_v1_SimilaritySearchResponse as responseSerialize };
        export { deserialize_vectorstore_v1_SimilaritySearchResponse as responseDeserialize };
    }
    namespace hybridSearch {
        let path_9: string;
        export { path_9 as path };
        let requestStream_9: boolean;
        export { requestStream_9 as requestStream };
        let responseStream_9: boolean;
        export { responseStream_9 as responseStream };
        let requestType_9: typeof vector_store_pb.HybridSearchRequest;
        export { requestType_9 as requestType };
        let responseType_9: typeof vector_store_pb.HybridSearchResponse;
        export { responseType_9 as responseType };
        export { serialize_vectorstore_v1_HybridSearchRequest as requestSerialize };
        export { deserialize_vectorstore_v1_HybridSearchRequest as requestDeserialize };
        export { serialize_vectorstore_v1_HybridSearchResponse as responseSerialize };
        export { deserialize_vectorstore_v1_HybridSearchResponse as responseDeserialize };
    }
    namespace batchUpsert {
        let path_10: string;
        export { path_10 as path };
        let requestStream_10: boolean;
        export { requestStream_10 as requestStream };
        let responseStream_10: boolean;
        export { responseStream_10 as responseStream };
        let requestType_10: typeof vector_store_pb.BatchUpsertRequest;
        export { requestType_10 as requestType };
        let responseType_10: typeof vector_store_pb.BatchUpsertResponse;
        export { responseType_10 as responseType };
        export { serialize_vectorstore_v1_BatchUpsertRequest as requestSerialize };
        export { deserialize_vectorstore_v1_BatchUpsertRequest as requestDeserialize };
        export { serialize_vectorstore_v1_BatchUpsertResponse as responseSerialize };
        export { deserialize_vectorstore_v1_BatchUpsertResponse as responseDeserialize };
    }
    namespace batchDelete {
        let path_11: string;
        export { path_11 as path };
        let requestStream_11: boolean;
        export { requestStream_11 as requestStream };
        let responseStream_11: boolean;
        export { responseStream_11 as responseStream };
        let requestType_11: typeof vector_store_pb.BatchDeleteRequest;
        export { requestType_11 as requestType };
        let responseType_11: typeof vector_store_pb.BatchDeleteResponse;
        export { responseType_11 as responseType };
        export { serialize_vectorstore_v1_BatchDeleteRequest as requestSerialize };
        export { deserialize_vectorstore_v1_BatchDeleteRequest as requestDeserialize };
        export { serialize_vectorstore_v1_BatchDeleteResponse as responseSerialize };
        export { deserialize_vectorstore_v1_BatchDeleteResponse as responseDeserialize };
    }
    namespace healthCheck {
        let path_12: string;
        export { path_12 as path };
        let requestStream_12: boolean;
        export { requestStream_12 as requestStream };
        let responseStream_12: boolean;
        export { responseStream_12 as responseStream };
        let requestType_12: any;
        export { requestType_12 as requestType };
        let responseType_12: typeof vector_store_pb.HealthCheckResponse;
        export { responseType_12 as responseType };
        export { serialize_google_protobuf_Empty as requestSerialize };
        export { deserialize_google_protobuf_Empty as requestDeserialize };
        export { serialize_vectorstore_v1_HealthCheckResponse as responseSerialize };
        export { deserialize_vectorstore_v1_HealthCheckResponse as responseDeserialize };
    }
    namespace getStats {
        let path_13: string;
        export { path_13 as path };
        let requestStream_13: boolean;
        export { requestStream_13 as requestStream };
        let responseStream_13: boolean;
        export { responseStream_13 as responseStream };
        let requestType_13: typeof vector_store_pb.GetStatsRequest;
        export { requestType_13 as requestType };
        let responseType_13: typeof vector_store_pb.GetStatsResponse;
        export { responseType_13 as responseType };
        export { serialize_vectorstore_v1_GetStatsRequest as requestSerialize };
        export { deserialize_vectorstore_v1_GetStatsRequest as requestDeserialize };
        export { serialize_vectorstore_v1_GetStatsResponse as responseSerialize };
        export { deserialize_vectorstore_v1_GetStatsResponse as responseDeserialize };
    }
}
export const VectorStoreServiceClient: grpc.ServiceClientConstructor;
import vector_store_pb = require("./vector_store_pb.js");
declare function serialize_vectorstore_v1_CreateCollectionRequest(arg: any): Buffer<ArrayBuffer>;
declare function deserialize_vectorstore_v1_CreateCollectionRequest(buffer_arg: any): vector_store_pb.CreateCollectionRequest;
declare function serialize_vectorstore_v1_CreateCollectionResponse(arg: any): Buffer<ArrayBuffer>;
declare function deserialize_vectorstore_v1_CreateCollectionResponse(buffer_arg: any): vector_store_pb.CreateCollectionResponse;
declare function serialize_vectorstore_v1_DeleteCollectionRequest(arg: any): Buffer<ArrayBuffer>;
declare function deserialize_vectorstore_v1_DeleteCollectionRequest(buffer_arg: any): vector_store_pb.DeleteCollectionRequest;
declare function serialize_vectorstore_v1_DeleteCollectionResponse(arg: any): Buffer<ArrayBuffer>;
declare function deserialize_vectorstore_v1_DeleteCollectionResponse(buffer_arg: any): vector_store_pb.DeleteCollectionResponse;
declare function serialize_google_protobuf_Empty(arg: any): Buffer<any>;
declare function deserialize_google_protobuf_Empty(buffer_arg: any): any;
declare function serialize_vectorstore_v1_ListCollectionsResponse(arg: any): Buffer<ArrayBuffer>;
declare function deserialize_vectorstore_v1_ListCollectionsResponse(buffer_arg: any): vector_store_pb.ListCollectionsResponse;
declare function serialize_vectorstore_v1_CollectionExistsRequest(arg: any): Buffer<ArrayBuffer>;
declare function deserialize_vectorstore_v1_CollectionExistsRequest(buffer_arg: any): vector_store_pb.CollectionExistsRequest;
declare function serialize_vectorstore_v1_CollectionExistsResponse(arg: any): Buffer<ArrayBuffer>;
declare function deserialize_vectorstore_v1_CollectionExistsResponse(buffer_arg: any): vector_store_pb.CollectionExistsResponse;
declare function serialize_vectorstore_v1_UpsertDocumentsRequest(arg: any): Buffer<ArrayBuffer>;
declare function deserialize_vectorstore_v1_UpsertDocumentsRequest(buffer_arg: any): vector_store_pb.UpsertDocumentsRequest;
declare function serialize_vectorstore_v1_UpsertDocumentsResponse(arg: any): Buffer<ArrayBuffer>;
declare function deserialize_vectorstore_v1_UpsertDocumentsResponse(buffer_arg: any): vector_store_pb.UpsertDocumentsResponse;
declare function serialize_vectorstore_v1_GetDocumentRequest(arg: any): Buffer<ArrayBuffer>;
declare function deserialize_vectorstore_v1_GetDocumentRequest(buffer_arg: any): vector_store_pb.GetDocumentRequest;
declare function serialize_vectorstore_v1_GetDocumentResponse(arg: any): Buffer<ArrayBuffer>;
declare function deserialize_vectorstore_v1_GetDocumentResponse(buffer_arg: any): vector_store_pb.GetDocumentResponse;
declare function serialize_vectorstore_v1_UpdateDocumentRequest(arg: any): Buffer<ArrayBuffer>;
declare function deserialize_vectorstore_v1_UpdateDocumentRequest(buffer_arg: any): vector_store_pb.UpdateDocumentRequest;
declare function serialize_vectorstore_v1_UpdateDocumentResponse(arg: any): Buffer<ArrayBuffer>;
declare function deserialize_vectorstore_v1_UpdateDocumentResponse(buffer_arg: any): vector_store_pb.UpdateDocumentResponse;
declare function serialize_vectorstore_v1_DeleteDocumentRequest(arg: any): Buffer<ArrayBuffer>;
declare function deserialize_vectorstore_v1_DeleteDocumentRequest(buffer_arg: any): vector_store_pb.DeleteDocumentRequest;
declare function serialize_vectorstore_v1_DeleteDocumentResponse(arg: any): Buffer<ArrayBuffer>;
declare function deserialize_vectorstore_v1_DeleteDocumentResponse(buffer_arg: any): vector_store_pb.DeleteDocumentResponse;
declare function serialize_vectorstore_v1_SimilaritySearchRequest(arg: any): Buffer<ArrayBuffer>;
declare function deserialize_vectorstore_v1_SimilaritySearchRequest(buffer_arg: any): vector_store_pb.SimilaritySearchRequest;
declare function serialize_vectorstore_v1_SimilaritySearchResponse(arg: any): Buffer<ArrayBuffer>;
declare function deserialize_vectorstore_v1_SimilaritySearchResponse(buffer_arg: any): vector_store_pb.SimilaritySearchResponse;
declare function serialize_vectorstore_v1_HybridSearchRequest(arg: any): Buffer<ArrayBuffer>;
declare function deserialize_vectorstore_v1_HybridSearchRequest(buffer_arg: any): vector_store_pb.HybridSearchRequest;
declare function serialize_vectorstore_v1_HybridSearchResponse(arg: any): Buffer<ArrayBuffer>;
declare function deserialize_vectorstore_v1_HybridSearchResponse(buffer_arg: any): vector_store_pb.HybridSearchResponse;
declare function serialize_vectorstore_v1_BatchUpsertRequest(arg: any): Buffer<ArrayBuffer>;
declare function deserialize_vectorstore_v1_BatchUpsertRequest(buffer_arg: any): vector_store_pb.BatchUpsertRequest;
declare function serialize_vectorstore_v1_BatchUpsertResponse(arg: any): Buffer<ArrayBuffer>;
declare function deserialize_vectorstore_v1_BatchUpsertResponse(buffer_arg: any): vector_store_pb.BatchUpsertResponse;
declare function serialize_vectorstore_v1_BatchDeleteRequest(arg: any): Buffer<ArrayBuffer>;
declare function deserialize_vectorstore_v1_BatchDeleteRequest(buffer_arg: any): vector_store_pb.BatchDeleteRequest;
declare function serialize_vectorstore_v1_BatchDeleteResponse(arg: any): Buffer<ArrayBuffer>;
declare function deserialize_vectorstore_v1_BatchDeleteResponse(buffer_arg: any): vector_store_pb.BatchDeleteResponse;
declare function serialize_vectorstore_v1_HealthCheckResponse(arg: any): Buffer<ArrayBuffer>;
declare function deserialize_vectorstore_v1_HealthCheckResponse(buffer_arg: any): vector_store_pb.HealthCheckResponse;
declare function serialize_vectorstore_v1_GetStatsRequest(arg: any): Buffer<ArrayBuffer>;
declare function deserialize_vectorstore_v1_GetStatsRequest(buffer_arg: any): vector_store_pb.GetStatsRequest;
declare function serialize_vectorstore_v1_GetStatsResponse(arg: any): Buffer<ArrayBuffer>;
declare function deserialize_vectorstore_v1_GetStatsResponse(buffer_arg: any): vector_store_pb.GetStatsResponse;
import grpc = require("@grpc/grpc-js");
export {};
//# sourceMappingURL=vector_store_grpc_pb.d.ts.map