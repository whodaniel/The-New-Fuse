// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var vector_store_pb = require('./vector_store_pb.js');
var google_protobuf_struct_pb = require('google-protobuf/google/protobuf/struct_pb.js');
var google_protobuf_empty_pb = require('google-protobuf/google/protobuf/empty_pb.js');

function serialize_google_protobuf_Empty(arg) {
  if (!(arg instanceof google_protobuf_empty_pb.Empty)) {
    throw new Error('Expected argument of type google.protobuf.Empty');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_google_protobuf_Empty(buffer_arg) {
  return google_protobuf_empty_pb.Empty.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_vectorstore_v1_BatchDeleteRequest(arg) {
  if (!(arg instanceof vector_store_pb.BatchDeleteRequest)) {
    throw new Error('Expected argument of type vectorstore.v1.BatchDeleteRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_vectorstore_v1_BatchDeleteRequest(buffer_arg) {
  return vector_store_pb.BatchDeleteRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_vectorstore_v1_BatchDeleteResponse(arg) {
  if (!(arg instanceof vector_store_pb.BatchDeleteResponse)) {
    throw new Error('Expected argument of type vectorstore.v1.BatchDeleteResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_vectorstore_v1_BatchDeleteResponse(buffer_arg) {
  return vector_store_pb.BatchDeleteResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_vectorstore_v1_BatchUpsertRequest(arg) {
  if (!(arg instanceof vector_store_pb.BatchUpsertRequest)) {
    throw new Error('Expected argument of type vectorstore.v1.BatchUpsertRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_vectorstore_v1_BatchUpsertRequest(buffer_arg) {
  return vector_store_pb.BatchUpsertRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_vectorstore_v1_BatchUpsertResponse(arg) {
  if (!(arg instanceof vector_store_pb.BatchUpsertResponse)) {
    throw new Error('Expected argument of type vectorstore.v1.BatchUpsertResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_vectorstore_v1_BatchUpsertResponse(buffer_arg) {
  return vector_store_pb.BatchUpsertResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_vectorstore_v1_CollectionExistsRequest(arg) {
  if (!(arg instanceof vector_store_pb.CollectionExistsRequest)) {
    throw new Error('Expected argument of type vectorstore.v1.CollectionExistsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_vectorstore_v1_CollectionExistsRequest(buffer_arg) {
  return vector_store_pb.CollectionExistsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_vectorstore_v1_CollectionExistsResponse(arg) {
  if (!(arg instanceof vector_store_pb.CollectionExistsResponse)) {
    throw new Error('Expected argument of type vectorstore.v1.CollectionExistsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_vectorstore_v1_CollectionExistsResponse(buffer_arg) {
  return vector_store_pb.CollectionExistsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_vectorstore_v1_CreateCollectionRequest(arg) {
  if (!(arg instanceof vector_store_pb.CreateCollectionRequest)) {
    throw new Error('Expected argument of type vectorstore.v1.CreateCollectionRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_vectorstore_v1_CreateCollectionRequest(buffer_arg) {
  return vector_store_pb.CreateCollectionRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_vectorstore_v1_CreateCollectionResponse(arg) {
  if (!(arg instanceof vector_store_pb.CreateCollectionResponse)) {
    throw new Error('Expected argument of type vectorstore.v1.CreateCollectionResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_vectorstore_v1_CreateCollectionResponse(buffer_arg) {
  return vector_store_pb.CreateCollectionResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_vectorstore_v1_DeleteCollectionRequest(arg) {
  if (!(arg instanceof vector_store_pb.DeleteCollectionRequest)) {
    throw new Error('Expected argument of type vectorstore.v1.DeleteCollectionRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_vectorstore_v1_DeleteCollectionRequest(buffer_arg) {
  return vector_store_pb.DeleteCollectionRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_vectorstore_v1_DeleteCollectionResponse(arg) {
  if (!(arg instanceof vector_store_pb.DeleteCollectionResponse)) {
    throw new Error('Expected argument of type vectorstore.v1.DeleteCollectionResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_vectorstore_v1_DeleteCollectionResponse(buffer_arg) {
  return vector_store_pb.DeleteCollectionResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_vectorstore_v1_DeleteDocumentRequest(arg) {
  if (!(arg instanceof vector_store_pb.DeleteDocumentRequest)) {
    throw new Error('Expected argument of type vectorstore.v1.DeleteDocumentRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_vectorstore_v1_DeleteDocumentRequest(buffer_arg) {
  return vector_store_pb.DeleteDocumentRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_vectorstore_v1_DeleteDocumentResponse(arg) {
  if (!(arg instanceof vector_store_pb.DeleteDocumentResponse)) {
    throw new Error('Expected argument of type vectorstore.v1.DeleteDocumentResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_vectorstore_v1_DeleteDocumentResponse(buffer_arg) {
  return vector_store_pb.DeleteDocumentResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_vectorstore_v1_GetDocumentRequest(arg) {
  if (!(arg instanceof vector_store_pb.GetDocumentRequest)) {
    throw new Error('Expected argument of type vectorstore.v1.GetDocumentRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_vectorstore_v1_GetDocumentRequest(buffer_arg) {
  return vector_store_pb.GetDocumentRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_vectorstore_v1_GetDocumentResponse(arg) {
  if (!(arg instanceof vector_store_pb.GetDocumentResponse)) {
    throw new Error('Expected argument of type vectorstore.v1.GetDocumentResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_vectorstore_v1_GetDocumentResponse(buffer_arg) {
  return vector_store_pb.GetDocumentResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_vectorstore_v1_GetStatsRequest(arg) {
  if (!(arg instanceof vector_store_pb.GetStatsRequest)) {
    throw new Error('Expected argument of type vectorstore.v1.GetStatsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_vectorstore_v1_GetStatsRequest(buffer_arg) {
  return vector_store_pb.GetStatsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_vectorstore_v1_GetStatsResponse(arg) {
  if (!(arg instanceof vector_store_pb.GetStatsResponse)) {
    throw new Error('Expected argument of type vectorstore.v1.GetStatsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_vectorstore_v1_GetStatsResponse(buffer_arg) {
  return vector_store_pb.GetStatsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_vectorstore_v1_HealthCheckResponse(arg) {
  if (!(arg instanceof vector_store_pb.HealthCheckResponse)) {
    throw new Error('Expected argument of type vectorstore.v1.HealthCheckResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_vectorstore_v1_HealthCheckResponse(buffer_arg) {
  return vector_store_pb.HealthCheckResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_vectorstore_v1_HybridSearchRequest(arg) {
  if (!(arg instanceof vector_store_pb.HybridSearchRequest)) {
    throw new Error('Expected argument of type vectorstore.v1.HybridSearchRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_vectorstore_v1_HybridSearchRequest(buffer_arg) {
  return vector_store_pb.HybridSearchRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_vectorstore_v1_HybridSearchResponse(arg) {
  if (!(arg instanceof vector_store_pb.HybridSearchResponse)) {
    throw new Error('Expected argument of type vectorstore.v1.HybridSearchResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_vectorstore_v1_HybridSearchResponse(buffer_arg) {
  return vector_store_pb.HybridSearchResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_vectorstore_v1_ListCollectionsResponse(arg) {
  if (!(arg instanceof vector_store_pb.ListCollectionsResponse)) {
    throw new Error('Expected argument of type vectorstore.v1.ListCollectionsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_vectorstore_v1_ListCollectionsResponse(buffer_arg) {
  return vector_store_pb.ListCollectionsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_vectorstore_v1_SimilaritySearchRequest(arg) {
  if (!(arg instanceof vector_store_pb.SimilaritySearchRequest)) {
    throw new Error('Expected argument of type vectorstore.v1.SimilaritySearchRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_vectorstore_v1_SimilaritySearchRequest(buffer_arg) {
  return vector_store_pb.SimilaritySearchRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_vectorstore_v1_SimilaritySearchResponse(arg) {
  if (!(arg instanceof vector_store_pb.SimilaritySearchResponse)) {
    throw new Error('Expected argument of type vectorstore.v1.SimilaritySearchResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_vectorstore_v1_SimilaritySearchResponse(buffer_arg) {
  return vector_store_pb.SimilaritySearchResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_vectorstore_v1_UpdateDocumentRequest(arg) {
  if (!(arg instanceof vector_store_pb.UpdateDocumentRequest)) {
    throw new Error('Expected argument of type vectorstore.v1.UpdateDocumentRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_vectorstore_v1_UpdateDocumentRequest(buffer_arg) {
  return vector_store_pb.UpdateDocumentRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_vectorstore_v1_UpdateDocumentResponse(arg) {
  if (!(arg instanceof vector_store_pb.UpdateDocumentResponse)) {
    throw new Error('Expected argument of type vectorstore.v1.UpdateDocumentResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_vectorstore_v1_UpdateDocumentResponse(buffer_arg) {
  return vector_store_pb.UpdateDocumentResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_vectorstore_v1_UpsertDocumentsRequest(arg) {
  if (!(arg instanceof vector_store_pb.UpsertDocumentsRequest)) {
    throw new Error('Expected argument of type vectorstore.v1.UpsertDocumentsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_vectorstore_v1_UpsertDocumentsRequest(buffer_arg) {
  return vector_store_pb.UpsertDocumentsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_vectorstore_v1_UpsertDocumentsResponse(arg) {
  if (!(arg instanceof vector_store_pb.UpsertDocumentsResponse)) {
    throw new Error('Expected argument of type vectorstore.v1.UpsertDocumentsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_vectorstore_v1_UpsertDocumentsResponse(buffer_arg) {
  return vector_store_pb.UpsertDocumentsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


// Vector Store Service Definition
var VectorStoreServiceService = exports.VectorStoreServiceService = {
  // Collection Management
createCollection: {
    path: '/vectorstore.v1.VectorStoreService/CreateCollection',
    requestStream: false,
    responseStream: false,
    requestType: vector_store_pb.CreateCollectionRequest,
    responseType: vector_store_pb.CreateCollectionResponse,
    requestSerialize: serialize_vectorstore_v1_CreateCollectionRequest,
    requestDeserialize: deserialize_vectorstore_v1_CreateCollectionRequest,
    responseSerialize: serialize_vectorstore_v1_CreateCollectionResponse,
    responseDeserialize: deserialize_vectorstore_v1_CreateCollectionResponse,
  },
  deleteCollection: {
    path: '/vectorstore.v1.VectorStoreService/DeleteCollection',
    requestStream: false,
    responseStream: false,
    requestType: vector_store_pb.DeleteCollectionRequest,
    responseType: vector_store_pb.DeleteCollectionResponse,
    requestSerialize: serialize_vectorstore_v1_DeleteCollectionRequest,
    requestDeserialize: deserialize_vectorstore_v1_DeleteCollectionRequest,
    responseSerialize: serialize_vectorstore_v1_DeleteCollectionResponse,
    responseDeserialize: deserialize_vectorstore_v1_DeleteCollectionResponse,
  },
  listCollections: {
    path: '/vectorstore.v1.VectorStoreService/ListCollections',
    requestStream: false,
    responseStream: false,
    requestType: google_protobuf_empty_pb.Empty,
    responseType: vector_store_pb.ListCollectionsResponse,
    requestSerialize: serialize_google_protobuf_Empty,
    requestDeserialize: deserialize_google_protobuf_Empty,
    responseSerialize: serialize_vectorstore_v1_ListCollectionsResponse,
    responseDeserialize: deserialize_vectorstore_v1_ListCollectionsResponse,
  },
  collectionExists: {
    path: '/vectorstore.v1.VectorStoreService/CollectionExists',
    requestStream: false,
    responseStream: false,
    requestType: vector_store_pb.CollectionExistsRequest,
    responseType: vector_store_pb.CollectionExistsResponse,
    requestSerialize: serialize_vectorstore_v1_CollectionExistsRequest,
    requestDeserialize: deserialize_vectorstore_v1_CollectionExistsRequest,
    responseSerialize: serialize_vectorstore_v1_CollectionExistsResponse,
    responseDeserialize: deserialize_vectorstore_v1_CollectionExistsResponse,
  },
  // Document Operations
upsertDocuments: {
    path: '/vectorstore.v1.VectorStoreService/UpsertDocuments',
    requestStream: false,
    responseStream: false,
    requestType: vector_store_pb.UpsertDocumentsRequest,
    responseType: vector_store_pb.UpsertDocumentsResponse,
    requestSerialize: serialize_vectorstore_v1_UpsertDocumentsRequest,
    requestDeserialize: deserialize_vectorstore_v1_UpsertDocumentsRequest,
    responseSerialize: serialize_vectorstore_v1_UpsertDocumentsResponse,
    responseDeserialize: deserialize_vectorstore_v1_UpsertDocumentsResponse,
  },
  getDocument: {
    path: '/vectorstore.v1.VectorStoreService/GetDocument',
    requestStream: false,
    responseStream: false,
    requestType: vector_store_pb.GetDocumentRequest,
    responseType: vector_store_pb.GetDocumentResponse,
    requestSerialize: serialize_vectorstore_v1_GetDocumentRequest,
    requestDeserialize: deserialize_vectorstore_v1_GetDocumentRequest,
    responseSerialize: serialize_vectorstore_v1_GetDocumentResponse,
    responseDeserialize: deserialize_vectorstore_v1_GetDocumentResponse,
  },
  updateDocument: {
    path: '/vectorstore.v1.VectorStoreService/UpdateDocument',
    requestStream: false,
    responseStream: false,
    requestType: vector_store_pb.UpdateDocumentRequest,
    responseType: vector_store_pb.UpdateDocumentResponse,
    requestSerialize: serialize_vectorstore_v1_UpdateDocumentRequest,
    requestDeserialize: deserialize_vectorstore_v1_UpdateDocumentRequest,
    responseSerialize: serialize_vectorstore_v1_UpdateDocumentResponse,
    responseDeserialize: deserialize_vectorstore_v1_UpdateDocumentResponse,
  },
  deleteDocument: {
    path: '/vectorstore.v1.VectorStoreService/DeleteDocument',
    requestStream: false,
    responseStream: false,
    requestType: vector_store_pb.DeleteDocumentRequest,
    responseType: vector_store_pb.DeleteDocumentResponse,
    requestSerialize: serialize_vectorstore_v1_DeleteDocumentRequest,
    requestDeserialize: deserialize_vectorstore_v1_DeleteDocumentRequest,
    responseSerialize: serialize_vectorstore_v1_DeleteDocumentResponse,
    responseDeserialize: deserialize_vectorstore_v1_DeleteDocumentResponse,
  },
  // Search Operations
similaritySearch: {
    path: '/vectorstore.v1.VectorStoreService/SimilaritySearch',
    requestStream: false,
    responseStream: false,
    requestType: vector_store_pb.SimilaritySearchRequest,
    responseType: vector_store_pb.SimilaritySearchResponse,
    requestSerialize: serialize_vectorstore_v1_SimilaritySearchRequest,
    requestDeserialize: deserialize_vectorstore_v1_SimilaritySearchRequest,
    responseSerialize: serialize_vectorstore_v1_SimilaritySearchResponse,
    responseDeserialize: deserialize_vectorstore_v1_SimilaritySearchResponse,
  },
  hybridSearch: {
    path: '/vectorstore.v1.VectorStoreService/HybridSearch',
    requestStream: false,
    responseStream: false,
    requestType: vector_store_pb.HybridSearchRequest,
    responseType: vector_store_pb.HybridSearchResponse,
    requestSerialize: serialize_vectorstore_v1_HybridSearchRequest,
    requestDeserialize: deserialize_vectorstore_v1_HybridSearchRequest,
    responseSerialize: serialize_vectorstore_v1_HybridSearchResponse,
    responseDeserialize: deserialize_vectorstore_v1_HybridSearchResponse,
  },
  // Batch Operations
batchUpsert: {
    path: '/vectorstore.v1.VectorStoreService/BatchUpsert',
    requestStream: false,
    responseStream: false,
    requestType: vector_store_pb.BatchUpsertRequest,
    responseType: vector_store_pb.BatchUpsertResponse,
    requestSerialize: serialize_vectorstore_v1_BatchUpsertRequest,
    requestDeserialize: deserialize_vectorstore_v1_BatchUpsertRequest,
    responseSerialize: serialize_vectorstore_v1_BatchUpsertResponse,
    responseDeserialize: deserialize_vectorstore_v1_BatchUpsertResponse,
  },
  batchDelete: {
    path: '/vectorstore.v1.VectorStoreService/BatchDelete',
    requestStream: false,
    responseStream: false,
    requestType: vector_store_pb.BatchDeleteRequest,
    responseType: vector_store_pb.BatchDeleteResponse,
    requestSerialize: serialize_vectorstore_v1_BatchDeleteRequest,
    requestDeserialize: deserialize_vectorstore_v1_BatchDeleteRequest,
    responseSerialize: serialize_vectorstore_v1_BatchDeleteResponse,
    responseDeserialize: deserialize_vectorstore_v1_BatchDeleteResponse,
  },
  // Health & Stats
healthCheck: {
    path: '/vectorstore.v1.VectorStoreService/HealthCheck',
    requestStream: false,
    responseStream: false,
    requestType: google_protobuf_empty_pb.Empty,
    responseType: vector_store_pb.HealthCheckResponse,
    requestSerialize: serialize_google_protobuf_Empty,
    requestDeserialize: deserialize_google_protobuf_Empty,
    responseSerialize: serialize_vectorstore_v1_HealthCheckResponse,
    responseDeserialize: deserialize_vectorstore_v1_HealthCheckResponse,
  },
  getStats: {
    path: '/vectorstore.v1.VectorStoreService/GetStats',
    requestStream: false,
    responseStream: false,
    requestType: vector_store_pb.GetStatsRequest,
    responseType: vector_store_pb.GetStatsResponse,
    requestSerialize: serialize_vectorstore_v1_GetStatsRequest,
    requestDeserialize: deserialize_vectorstore_v1_GetStatsRequest,
    responseSerialize: serialize_vectorstore_v1_GetStatsResponse,
    responseDeserialize: deserialize_vectorstore_v1_GetStatsResponse,
  },
};

exports.VectorStoreServiceClient = grpc.makeGenericClientConstructor(VectorStoreServiceService, 'VectorStoreService');
