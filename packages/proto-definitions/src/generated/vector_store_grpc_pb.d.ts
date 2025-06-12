// package: vectorstore.v1
// file: vector_store.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as vector_store_pb from "./vector_store_pb";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";

interface IVectorStoreServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    createCollection: IVectorStoreServiceService_ICreateCollection;
    deleteCollection: IVectorStoreServiceService_IDeleteCollection;
    listCollections: IVectorStoreServiceService_IListCollections;
    collectionExists: IVectorStoreServiceService_ICollectionExists;
    upsertDocuments: IVectorStoreServiceService_IUpsertDocuments;
    getDocument: IVectorStoreServiceService_IGetDocument;
    updateDocument: IVectorStoreServiceService_IUpdateDocument;
    deleteDocument: IVectorStoreServiceService_IDeleteDocument;
    similaritySearch: IVectorStoreServiceService_ISimilaritySearch;
    hybridSearch: IVectorStoreServiceService_IHybridSearch;
    batchUpsert: IVectorStoreServiceService_IBatchUpsert;
    batchDelete: IVectorStoreServiceService_IBatchDelete;
    healthCheck: IVectorStoreServiceService_IHealthCheck;
    getStats: IVectorStoreServiceService_IGetStats;
}

interface IVectorStoreServiceService_ICreateCollection extends grpc.MethodDefinition<vector_store_pb.CreateCollectionRequest, vector_store_pb.CreateCollectionResponse> {
    path: "/vectorstore.v1.VectorStoreService/CreateCollection";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<vector_store_pb.CreateCollectionRequest>;
    requestDeserialize: grpc.deserialize<vector_store_pb.CreateCollectionRequest>;
    responseSerialize: grpc.serialize<vector_store_pb.CreateCollectionResponse>;
    responseDeserialize: grpc.deserialize<vector_store_pb.CreateCollectionResponse>;
}
interface IVectorStoreServiceService_IDeleteCollection extends grpc.MethodDefinition<vector_store_pb.DeleteCollectionRequest, vector_store_pb.DeleteCollectionResponse> {
    path: "/vectorstore.v1.VectorStoreService/DeleteCollection";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<vector_store_pb.DeleteCollectionRequest>;
    requestDeserialize: grpc.deserialize<vector_store_pb.DeleteCollectionRequest>;
    responseSerialize: grpc.serialize<vector_store_pb.DeleteCollectionResponse>;
    responseDeserialize: grpc.deserialize<vector_store_pb.DeleteCollectionResponse>;
}
interface IVectorStoreServiceService_IListCollections extends grpc.MethodDefinition<google_protobuf_empty_pb.Empty, vector_store_pb.ListCollectionsResponse> {
    path: "/vectorstore.v1.VectorStoreService/ListCollections";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<google_protobuf_empty_pb.Empty>;
    requestDeserialize: grpc.deserialize<google_protobuf_empty_pb.Empty>;
    responseSerialize: grpc.serialize<vector_store_pb.ListCollectionsResponse>;
    responseDeserialize: grpc.deserialize<vector_store_pb.ListCollectionsResponse>;
}
interface IVectorStoreServiceService_ICollectionExists extends grpc.MethodDefinition<vector_store_pb.CollectionExistsRequest, vector_store_pb.CollectionExistsResponse> {
    path: "/vectorstore.v1.VectorStoreService/CollectionExists";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<vector_store_pb.CollectionExistsRequest>;
    requestDeserialize: grpc.deserialize<vector_store_pb.CollectionExistsRequest>;
    responseSerialize: grpc.serialize<vector_store_pb.CollectionExistsResponse>;
    responseDeserialize: grpc.deserialize<vector_store_pb.CollectionExistsResponse>;
}
interface IVectorStoreServiceService_IUpsertDocuments extends grpc.MethodDefinition<vector_store_pb.UpsertDocumentsRequest, vector_store_pb.UpsertDocumentsResponse> {
    path: "/vectorstore.v1.VectorStoreService/UpsertDocuments";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<vector_store_pb.UpsertDocumentsRequest>;
    requestDeserialize: grpc.deserialize<vector_store_pb.UpsertDocumentsRequest>;
    responseSerialize: grpc.serialize<vector_store_pb.UpsertDocumentsResponse>;
    responseDeserialize: grpc.deserialize<vector_store_pb.UpsertDocumentsResponse>;
}
interface IVectorStoreServiceService_IGetDocument extends grpc.MethodDefinition<vector_store_pb.GetDocumentRequest, vector_store_pb.GetDocumentResponse> {
    path: "/vectorstore.v1.VectorStoreService/GetDocument";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<vector_store_pb.GetDocumentRequest>;
    requestDeserialize: grpc.deserialize<vector_store_pb.GetDocumentRequest>;
    responseSerialize: grpc.serialize<vector_store_pb.GetDocumentResponse>;
    responseDeserialize: grpc.deserialize<vector_store_pb.GetDocumentResponse>;
}
interface IVectorStoreServiceService_IUpdateDocument extends grpc.MethodDefinition<vector_store_pb.UpdateDocumentRequest, vector_store_pb.UpdateDocumentResponse> {
    path: "/vectorstore.v1.VectorStoreService/UpdateDocument";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<vector_store_pb.UpdateDocumentRequest>;
    requestDeserialize: grpc.deserialize<vector_store_pb.UpdateDocumentRequest>;
    responseSerialize: grpc.serialize<vector_store_pb.UpdateDocumentResponse>;
    responseDeserialize: grpc.deserialize<vector_store_pb.UpdateDocumentResponse>;
}
interface IVectorStoreServiceService_IDeleteDocument extends grpc.MethodDefinition<vector_store_pb.DeleteDocumentRequest, vector_store_pb.DeleteDocumentResponse> {
    path: "/vectorstore.v1.VectorStoreService/DeleteDocument";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<vector_store_pb.DeleteDocumentRequest>;
    requestDeserialize: grpc.deserialize<vector_store_pb.DeleteDocumentRequest>;
    responseSerialize: grpc.serialize<vector_store_pb.DeleteDocumentResponse>;
    responseDeserialize: grpc.deserialize<vector_store_pb.DeleteDocumentResponse>;
}
interface IVectorStoreServiceService_ISimilaritySearch extends grpc.MethodDefinition<vector_store_pb.SimilaritySearchRequest, vector_store_pb.SimilaritySearchResponse> {
    path: "/vectorstore.v1.VectorStoreService/SimilaritySearch";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<vector_store_pb.SimilaritySearchRequest>;
    requestDeserialize: grpc.deserialize<vector_store_pb.SimilaritySearchRequest>;
    responseSerialize: grpc.serialize<vector_store_pb.SimilaritySearchResponse>;
    responseDeserialize: grpc.deserialize<vector_store_pb.SimilaritySearchResponse>;
}
interface IVectorStoreServiceService_IHybridSearch extends grpc.MethodDefinition<vector_store_pb.HybridSearchRequest, vector_store_pb.HybridSearchResponse> {
    path: "/vectorstore.v1.VectorStoreService/HybridSearch";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<vector_store_pb.HybridSearchRequest>;
    requestDeserialize: grpc.deserialize<vector_store_pb.HybridSearchRequest>;
    responseSerialize: grpc.serialize<vector_store_pb.HybridSearchResponse>;
    responseDeserialize: grpc.deserialize<vector_store_pb.HybridSearchResponse>;
}
interface IVectorStoreServiceService_IBatchUpsert extends grpc.MethodDefinition<vector_store_pb.BatchUpsertRequest, vector_store_pb.BatchUpsertResponse> {
    path: "/vectorstore.v1.VectorStoreService/BatchUpsert";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<vector_store_pb.BatchUpsertRequest>;
    requestDeserialize: grpc.deserialize<vector_store_pb.BatchUpsertRequest>;
    responseSerialize: grpc.serialize<vector_store_pb.BatchUpsertResponse>;
    responseDeserialize: grpc.deserialize<vector_store_pb.BatchUpsertResponse>;
}
interface IVectorStoreServiceService_IBatchDelete extends grpc.MethodDefinition<vector_store_pb.BatchDeleteRequest, vector_store_pb.BatchDeleteResponse> {
    path: "/vectorstore.v1.VectorStoreService/BatchDelete";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<vector_store_pb.BatchDeleteRequest>;
    requestDeserialize: grpc.deserialize<vector_store_pb.BatchDeleteRequest>;
    responseSerialize: grpc.serialize<vector_store_pb.BatchDeleteResponse>;
    responseDeserialize: grpc.deserialize<vector_store_pb.BatchDeleteResponse>;
}
interface IVectorStoreServiceService_IHealthCheck extends grpc.MethodDefinition<google_protobuf_empty_pb.Empty, vector_store_pb.HealthCheckResponse> {
    path: "/vectorstore.v1.VectorStoreService/HealthCheck";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<google_protobuf_empty_pb.Empty>;
    requestDeserialize: grpc.deserialize<google_protobuf_empty_pb.Empty>;
    responseSerialize: grpc.serialize<vector_store_pb.HealthCheckResponse>;
    responseDeserialize: grpc.deserialize<vector_store_pb.HealthCheckResponse>;
}
interface IVectorStoreServiceService_IGetStats extends grpc.MethodDefinition<vector_store_pb.GetStatsRequest, vector_store_pb.GetStatsResponse> {
    path: "/vectorstore.v1.VectorStoreService/GetStats";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<vector_store_pb.GetStatsRequest>;
    requestDeserialize: grpc.deserialize<vector_store_pb.GetStatsRequest>;
    responseSerialize: grpc.serialize<vector_store_pb.GetStatsResponse>;
    responseDeserialize: grpc.deserialize<vector_store_pb.GetStatsResponse>;
}

export const VectorStoreServiceService: IVectorStoreServiceService;

export interface IVectorStoreServiceServer extends grpc.UntypedServiceImplementation {
    createCollection: grpc.handleUnaryCall<vector_store_pb.CreateCollectionRequest, vector_store_pb.CreateCollectionResponse>;
    deleteCollection: grpc.handleUnaryCall<vector_store_pb.DeleteCollectionRequest, vector_store_pb.DeleteCollectionResponse>;
    listCollections: grpc.handleUnaryCall<google_protobuf_empty_pb.Empty, vector_store_pb.ListCollectionsResponse>;
    collectionExists: grpc.handleUnaryCall<vector_store_pb.CollectionExistsRequest, vector_store_pb.CollectionExistsResponse>;
    upsertDocuments: grpc.handleUnaryCall<vector_store_pb.UpsertDocumentsRequest, vector_store_pb.UpsertDocumentsResponse>;
    getDocument: grpc.handleUnaryCall<vector_store_pb.GetDocumentRequest, vector_store_pb.GetDocumentResponse>;
    updateDocument: grpc.handleUnaryCall<vector_store_pb.UpdateDocumentRequest, vector_store_pb.UpdateDocumentResponse>;
    deleteDocument: grpc.handleUnaryCall<vector_store_pb.DeleteDocumentRequest, vector_store_pb.DeleteDocumentResponse>;
    similaritySearch: grpc.handleUnaryCall<vector_store_pb.SimilaritySearchRequest, vector_store_pb.SimilaritySearchResponse>;
    hybridSearch: grpc.handleUnaryCall<vector_store_pb.HybridSearchRequest, vector_store_pb.HybridSearchResponse>;
    batchUpsert: grpc.handleUnaryCall<vector_store_pb.BatchUpsertRequest, vector_store_pb.BatchUpsertResponse>;
    batchDelete: grpc.handleUnaryCall<vector_store_pb.BatchDeleteRequest, vector_store_pb.BatchDeleteResponse>;
    healthCheck: grpc.handleUnaryCall<google_protobuf_empty_pb.Empty, vector_store_pb.HealthCheckResponse>;
    getStats: grpc.handleUnaryCall<vector_store_pb.GetStatsRequest, vector_store_pb.GetStatsResponse>;
}

export interface IVectorStoreServiceClient {
    createCollection(request: vector_store_pb.CreateCollectionRequest, callback: (error: grpc.ServiceError | null, response: vector_store_pb.CreateCollectionResponse) => void): grpc.ClientUnaryCall;
    createCollection(request: vector_store_pb.CreateCollectionRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: vector_store_pb.CreateCollectionResponse) => void): grpc.ClientUnaryCall;
    createCollection(request: vector_store_pb.CreateCollectionRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: vector_store_pb.CreateCollectionResponse) => void): grpc.ClientUnaryCall;
    deleteCollection(request: vector_store_pb.DeleteCollectionRequest, callback: (error: grpc.ServiceError | null, response: vector_store_pb.DeleteCollectionResponse) => void): grpc.ClientUnaryCall;
    deleteCollection(request: vector_store_pb.DeleteCollectionRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: vector_store_pb.DeleteCollectionResponse) => void): grpc.ClientUnaryCall;
    deleteCollection(request: vector_store_pb.DeleteCollectionRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: vector_store_pb.DeleteCollectionResponse) => void): grpc.ClientUnaryCall;
    listCollections(request: google_protobuf_empty_pb.Empty, callback: (error: grpc.ServiceError | null, response: vector_store_pb.ListCollectionsResponse) => void): grpc.ClientUnaryCall;
    listCollections(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: vector_store_pb.ListCollectionsResponse) => void): grpc.ClientUnaryCall;
    listCollections(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: vector_store_pb.ListCollectionsResponse) => void): grpc.ClientUnaryCall;
    collectionExists(request: vector_store_pb.CollectionExistsRequest, callback: (error: grpc.ServiceError | null, response: vector_store_pb.CollectionExistsResponse) => void): grpc.ClientUnaryCall;
    collectionExists(request: vector_store_pb.CollectionExistsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: vector_store_pb.CollectionExistsResponse) => void): grpc.ClientUnaryCall;
    collectionExists(request: vector_store_pb.CollectionExistsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: vector_store_pb.CollectionExistsResponse) => void): grpc.ClientUnaryCall;
    upsertDocuments(request: vector_store_pb.UpsertDocumentsRequest, callback: (error: grpc.ServiceError | null, response: vector_store_pb.UpsertDocumentsResponse) => void): grpc.ClientUnaryCall;
    upsertDocuments(request: vector_store_pb.UpsertDocumentsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: vector_store_pb.UpsertDocumentsResponse) => void): grpc.ClientUnaryCall;
    upsertDocuments(request: vector_store_pb.UpsertDocumentsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: vector_store_pb.UpsertDocumentsResponse) => void): grpc.ClientUnaryCall;
    getDocument(request: vector_store_pb.GetDocumentRequest, callback: (error: grpc.ServiceError | null, response: vector_store_pb.GetDocumentResponse) => void): grpc.ClientUnaryCall;
    getDocument(request: vector_store_pb.GetDocumentRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: vector_store_pb.GetDocumentResponse) => void): grpc.ClientUnaryCall;
    getDocument(request: vector_store_pb.GetDocumentRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: vector_store_pb.GetDocumentResponse) => void): grpc.ClientUnaryCall;
    updateDocument(request: vector_store_pb.UpdateDocumentRequest, callback: (error: grpc.ServiceError | null, response: vector_store_pb.UpdateDocumentResponse) => void): grpc.ClientUnaryCall;
    updateDocument(request: vector_store_pb.UpdateDocumentRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: vector_store_pb.UpdateDocumentResponse) => void): grpc.ClientUnaryCall;
    updateDocument(request: vector_store_pb.UpdateDocumentRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: vector_store_pb.UpdateDocumentResponse) => void): grpc.ClientUnaryCall;
    deleteDocument(request: vector_store_pb.DeleteDocumentRequest, callback: (error: grpc.ServiceError | null, response: vector_store_pb.DeleteDocumentResponse) => void): grpc.ClientUnaryCall;
    deleteDocument(request: vector_store_pb.DeleteDocumentRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: vector_store_pb.DeleteDocumentResponse) => void): grpc.ClientUnaryCall;
    deleteDocument(request: vector_store_pb.DeleteDocumentRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: vector_store_pb.DeleteDocumentResponse) => void): grpc.ClientUnaryCall;
    similaritySearch(request: vector_store_pb.SimilaritySearchRequest, callback: (error: grpc.ServiceError | null, response: vector_store_pb.SimilaritySearchResponse) => void): grpc.ClientUnaryCall;
    similaritySearch(request: vector_store_pb.SimilaritySearchRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: vector_store_pb.SimilaritySearchResponse) => void): grpc.ClientUnaryCall;
    similaritySearch(request: vector_store_pb.SimilaritySearchRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: vector_store_pb.SimilaritySearchResponse) => void): grpc.ClientUnaryCall;
    hybridSearch(request: vector_store_pb.HybridSearchRequest, callback: (error: grpc.ServiceError | null, response: vector_store_pb.HybridSearchResponse) => void): grpc.ClientUnaryCall;
    hybridSearch(request: vector_store_pb.HybridSearchRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: vector_store_pb.HybridSearchResponse) => void): grpc.ClientUnaryCall;
    hybridSearch(request: vector_store_pb.HybridSearchRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: vector_store_pb.HybridSearchResponse) => void): grpc.ClientUnaryCall;
    batchUpsert(request: vector_store_pb.BatchUpsertRequest, callback: (error: grpc.ServiceError | null, response: vector_store_pb.BatchUpsertResponse) => void): grpc.ClientUnaryCall;
    batchUpsert(request: vector_store_pb.BatchUpsertRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: vector_store_pb.BatchUpsertResponse) => void): grpc.ClientUnaryCall;
    batchUpsert(request: vector_store_pb.BatchUpsertRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: vector_store_pb.BatchUpsertResponse) => void): grpc.ClientUnaryCall;
    batchDelete(request: vector_store_pb.BatchDeleteRequest, callback: (error: grpc.ServiceError | null, response: vector_store_pb.BatchDeleteResponse) => void): grpc.ClientUnaryCall;
    batchDelete(request: vector_store_pb.BatchDeleteRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: vector_store_pb.BatchDeleteResponse) => void): grpc.ClientUnaryCall;
    batchDelete(request: vector_store_pb.BatchDeleteRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: vector_store_pb.BatchDeleteResponse) => void): grpc.ClientUnaryCall;
    healthCheck(request: google_protobuf_empty_pb.Empty, callback: (error: grpc.ServiceError | null, response: vector_store_pb.HealthCheckResponse) => void): grpc.ClientUnaryCall;
    healthCheck(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: vector_store_pb.HealthCheckResponse) => void): grpc.ClientUnaryCall;
    healthCheck(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: vector_store_pb.HealthCheckResponse) => void): grpc.ClientUnaryCall;
    getStats(request: vector_store_pb.GetStatsRequest, callback: (error: grpc.ServiceError | null, response: vector_store_pb.GetStatsResponse) => void): grpc.ClientUnaryCall;
    getStats(request: vector_store_pb.GetStatsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: vector_store_pb.GetStatsResponse) => void): grpc.ClientUnaryCall;
    getStats(request: vector_store_pb.GetStatsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: vector_store_pb.GetStatsResponse) => void): grpc.ClientUnaryCall;
}

export class VectorStoreServiceClient extends grpc.Client implements IVectorStoreServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public createCollection(request: vector_store_pb.CreateCollectionRequest, callback: (error: grpc.ServiceError | null, response: vector_store_pb.CreateCollectionResponse) => void): grpc.ClientUnaryCall;
    public createCollection(request: vector_store_pb.CreateCollectionRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: vector_store_pb.CreateCollectionResponse) => void): grpc.ClientUnaryCall;
    public createCollection(request: vector_store_pb.CreateCollectionRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: vector_store_pb.CreateCollectionResponse) => void): grpc.ClientUnaryCall;
    public deleteCollection(request: vector_store_pb.DeleteCollectionRequest, callback: (error: grpc.ServiceError | null, response: vector_store_pb.DeleteCollectionResponse) => void): grpc.ClientUnaryCall;
    public deleteCollection(request: vector_store_pb.DeleteCollectionRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: vector_store_pb.DeleteCollectionResponse) => void): grpc.ClientUnaryCall;
    public deleteCollection(request: vector_store_pb.DeleteCollectionRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: vector_store_pb.DeleteCollectionResponse) => void): grpc.ClientUnaryCall;
    public listCollections(request: google_protobuf_empty_pb.Empty, callback: (error: grpc.ServiceError | null, response: vector_store_pb.ListCollectionsResponse) => void): grpc.ClientUnaryCall;
    public listCollections(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: vector_store_pb.ListCollectionsResponse) => void): grpc.ClientUnaryCall;
    public listCollections(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: vector_store_pb.ListCollectionsResponse) => void): grpc.ClientUnaryCall;
    public collectionExists(request: vector_store_pb.CollectionExistsRequest, callback: (error: grpc.ServiceError | null, response: vector_store_pb.CollectionExistsResponse) => void): grpc.ClientUnaryCall;
    public collectionExists(request: vector_store_pb.CollectionExistsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: vector_store_pb.CollectionExistsResponse) => void): grpc.ClientUnaryCall;
    public collectionExists(request: vector_store_pb.CollectionExistsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: vector_store_pb.CollectionExistsResponse) => void): grpc.ClientUnaryCall;
    public upsertDocuments(request: vector_store_pb.UpsertDocumentsRequest, callback: (error: grpc.ServiceError | null, response: vector_store_pb.UpsertDocumentsResponse) => void): grpc.ClientUnaryCall;
    public upsertDocuments(request: vector_store_pb.UpsertDocumentsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: vector_store_pb.UpsertDocumentsResponse) => void): grpc.ClientUnaryCall;
    public upsertDocuments(request: vector_store_pb.UpsertDocumentsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: vector_store_pb.UpsertDocumentsResponse) => void): grpc.ClientUnaryCall;
    public getDocument(request: vector_store_pb.GetDocumentRequest, callback: (error: grpc.ServiceError | null, response: vector_store_pb.GetDocumentResponse) => void): grpc.ClientUnaryCall;
    public getDocument(request: vector_store_pb.GetDocumentRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: vector_store_pb.GetDocumentResponse) => void): grpc.ClientUnaryCall;
    public getDocument(request: vector_store_pb.GetDocumentRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: vector_store_pb.GetDocumentResponse) => void): grpc.ClientUnaryCall;
    public updateDocument(request: vector_store_pb.UpdateDocumentRequest, callback: (error: grpc.ServiceError | null, response: vector_store_pb.UpdateDocumentResponse) => void): grpc.ClientUnaryCall;
    public updateDocument(request: vector_store_pb.UpdateDocumentRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: vector_store_pb.UpdateDocumentResponse) => void): grpc.ClientUnaryCall;
    public updateDocument(request: vector_store_pb.UpdateDocumentRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: vector_store_pb.UpdateDocumentResponse) => void): grpc.ClientUnaryCall;
    public deleteDocument(request: vector_store_pb.DeleteDocumentRequest, callback: (error: grpc.ServiceError | null, response: vector_store_pb.DeleteDocumentResponse) => void): grpc.ClientUnaryCall;
    public deleteDocument(request: vector_store_pb.DeleteDocumentRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: vector_store_pb.DeleteDocumentResponse) => void): grpc.ClientUnaryCall;
    public deleteDocument(request: vector_store_pb.DeleteDocumentRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: vector_store_pb.DeleteDocumentResponse) => void): grpc.ClientUnaryCall;
    public similaritySearch(request: vector_store_pb.SimilaritySearchRequest, callback: (error: grpc.ServiceError | null, response: vector_store_pb.SimilaritySearchResponse) => void): grpc.ClientUnaryCall;
    public similaritySearch(request: vector_store_pb.SimilaritySearchRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: vector_store_pb.SimilaritySearchResponse) => void): grpc.ClientUnaryCall;
    public similaritySearch(request: vector_store_pb.SimilaritySearchRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: vector_store_pb.SimilaritySearchResponse) => void): grpc.ClientUnaryCall;
    public hybridSearch(request: vector_store_pb.HybridSearchRequest, callback: (error: grpc.ServiceError | null, response: vector_store_pb.HybridSearchResponse) => void): grpc.ClientUnaryCall;
    public hybridSearch(request: vector_store_pb.HybridSearchRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: vector_store_pb.HybridSearchResponse) => void): grpc.ClientUnaryCall;
    public hybridSearch(request: vector_store_pb.HybridSearchRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: vector_store_pb.HybridSearchResponse) => void): grpc.ClientUnaryCall;
    public batchUpsert(request: vector_store_pb.BatchUpsertRequest, callback: (error: grpc.ServiceError | null, response: vector_store_pb.BatchUpsertResponse) => void): grpc.ClientUnaryCall;
    public batchUpsert(request: vector_store_pb.BatchUpsertRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: vector_store_pb.BatchUpsertResponse) => void): grpc.ClientUnaryCall;
    public batchUpsert(request: vector_store_pb.BatchUpsertRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: vector_store_pb.BatchUpsertResponse) => void): grpc.ClientUnaryCall;
    public batchDelete(request: vector_store_pb.BatchDeleteRequest, callback: (error: grpc.ServiceError | null, response: vector_store_pb.BatchDeleteResponse) => void): grpc.ClientUnaryCall;
    public batchDelete(request: vector_store_pb.BatchDeleteRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: vector_store_pb.BatchDeleteResponse) => void): grpc.ClientUnaryCall;
    public batchDelete(request: vector_store_pb.BatchDeleteRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: vector_store_pb.BatchDeleteResponse) => void): grpc.ClientUnaryCall;
    public healthCheck(request: google_protobuf_empty_pb.Empty, callback: (error: grpc.ServiceError | null, response: vector_store_pb.HealthCheckResponse) => void): grpc.ClientUnaryCall;
    public healthCheck(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: vector_store_pb.HealthCheckResponse) => void): grpc.ClientUnaryCall;
    public healthCheck(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: vector_store_pb.HealthCheckResponse) => void): grpc.ClientUnaryCall;
    public getStats(request: vector_store_pb.GetStatsRequest, callback: (error: grpc.ServiceError | null, response: vector_store_pb.GetStatsResponse) => void): grpc.ClientUnaryCall;
    public getStats(request: vector_store_pb.GetStatsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: vector_store_pb.GetStatsResponse) => void): grpc.ClientUnaryCall;
    public getStats(request: vector_store_pb.GetStatsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: vector_store_pb.GetStatsResponse) => void): grpc.ClientUnaryCall;
}
