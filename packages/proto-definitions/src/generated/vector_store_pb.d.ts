// package: vectorstore.v1
// file: vector_store.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";

export class CreateCollectionRequest extends jspb.Message { 
    getName(): string;
    setName(value: string): CreateCollectionRequest;
    getDimension(): number;
    setDimension(value: number): CreateCollectionRequest;
    getMetric(): string;
    setMetric(value: string): CreateCollectionRequest;

    getConfigMap(): jspb.Map<string, string>;
    clearConfigMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateCollectionRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateCollectionRequest): CreateCollectionRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateCollectionRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateCollectionRequest;
    static deserializeBinaryFromReader(message: CreateCollectionRequest, reader: jspb.BinaryReader): CreateCollectionRequest;
}

export namespace CreateCollectionRequest {
    export type AsObject = {
        name: string,
        dimension: number,
        metric: string,

        configMap: Array<[string, string]>,
    }
}

export class CreateCollectionResponse extends jspb.Message { 
    getSuccess(): boolean;
    setSuccess(value: boolean): CreateCollectionResponse;
    getMessage(): string;
    setMessage(value: string): CreateCollectionResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateCollectionResponse.AsObject;
    static toObject(includeInstance: boolean, msg: CreateCollectionResponse): CreateCollectionResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateCollectionResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateCollectionResponse;
    static deserializeBinaryFromReader(message: CreateCollectionResponse, reader: jspb.BinaryReader): CreateCollectionResponse;
}

export namespace CreateCollectionResponse {
    export type AsObject = {
        success: boolean,
        message: string,
    }
}

export class DeleteCollectionRequest extends jspb.Message { 
    getName(): string;
    setName(value: string): DeleteCollectionRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteCollectionRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteCollectionRequest): DeleteCollectionRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteCollectionRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteCollectionRequest;
    static deserializeBinaryFromReader(message: DeleteCollectionRequest, reader: jspb.BinaryReader): DeleteCollectionRequest;
}

export namespace DeleteCollectionRequest {
    export type AsObject = {
        name: string,
    }
}

export class DeleteCollectionResponse extends jspb.Message { 
    getSuccess(): boolean;
    setSuccess(value: boolean): DeleteCollectionResponse;
    getMessage(): string;
    setMessage(value: string): DeleteCollectionResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteCollectionResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteCollectionResponse): DeleteCollectionResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteCollectionResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteCollectionResponse;
    static deserializeBinaryFromReader(message: DeleteCollectionResponse, reader: jspb.BinaryReader): DeleteCollectionResponse;
}

export namespace DeleteCollectionResponse {
    export type AsObject = {
        success: boolean,
        message: string,
    }
}

export class ListCollectionsResponse extends jspb.Message { 
    clearCollectionsList(): void;
    getCollectionsList(): Array<string>;
    setCollectionsList(value: Array<string>): ListCollectionsResponse;
    addCollections(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ListCollectionsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ListCollectionsResponse): ListCollectionsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ListCollectionsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ListCollectionsResponse;
    static deserializeBinaryFromReader(message: ListCollectionsResponse, reader: jspb.BinaryReader): ListCollectionsResponse;
}

export namespace ListCollectionsResponse {
    export type AsObject = {
        collectionsList: Array<string>,
    }
}

export class CollectionExistsRequest extends jspb.Message { 
    getName(): string;
    setName(value: string): CollectionExistsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CollectionExistsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CollectionExistsRequest): CollectionExistsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CollectionExistsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CollectionExistsRequest;
    static deserializeBinaryFromReader(message: CollectionExistsRequest, reader: jspb.BinaryReader): CollectionExistsRequest;
}

export namespace CollectionExistsRequest {
    export type AsObject = {
        name: string,
    }
}

export class CollectionExistsResponse extends jspb.Message { 
    getExists(): boolean;
    setExists(value: boolean): CollectionExistsResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CollectionExistsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: CollectionExistsResponse): CollectionExistsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CollectionExistsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CollectionExistsResponse;
    static deserializeBinaryFromReader(message: CollectionExistsResponse, reader: jspb.BinaryReader): CollectionExistsResponse;
}

export namespace CollectionExistsResponse {
    export type AsObject = {
        exists: boolean,
    }
}

export class VectorDocument extends jspb.Message { 
    getId(): string;
    setId(value: string): VectorDocument;
    getContent(): string;
    setContent(value: string): VectorDocument;

    hasMetadata(): boolean;
    clearMetadata(): void;
    getMetadata(): google_protobuf_struct_pb.Struct | undefined;
    setMetadata(value?: google_protobuf_struct_pb.Struct): VectorDocument;
    clearEmbeddingList(): void;
    getEmbeddingList(): Array<number>;
    setEmbeddingList(value: Array<number>): VectorDocument;
    addEmbedding(value: number, index?: number): number;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): VectorDocument.AsObject;
    static toObject(includeInstance: boolean, msg: VectorDocument): VectorDocument.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: VectorDocument, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): VectorDocument;
    static deserializeBinaryFromReader(message: VectorDocument, reader: jspb.BinaryReader): VectorDocument;
}

export namespace VectorDocument {
    export type AsObject = {
        id: string,
        content: string,
        metadata?: google_protobuf_struct_pb.Struct.AsObject,
        embeddingList: Array<number>,
    }
}

export class UpsertDocumentsRequest extends jspb.Message { 
    getCollection(): string;
    setCollection(value: string): UpsertDocumentsRequest;
    clearDocumentsList(): void;
    getDocumentsList(): Array<VectorDocument>;
    setDocumentsList(value: Array<VectorDocument>): UpsertDocumentsRequest;
    addDocuments(value?: VectorDocument, index?: number): VectorDocument;
    getGenerateEmbeddings(): boolean;
    setGenerateEmbeddings(value: boolean): UpsertDocumentsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpsertDocumentsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UpsertDocumentsRequest): UpsertDocumentsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpsertDocumentsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpsertDocumentsRequest;
    static deserializeBinaryFromReader(message: UpsertDocumentsRequest, reader: jspb.BinaryReader): UpsertDocumentsRequest;
}

export namespace UpsertDocumentsRequest {
    export type AsObject = {
        collection: string,
        documentsList: Array<VectorDocument.AsObject>,
        generateEmbeddings: boolean,
    }
}

export class UpsertDocumentsResponse extends jspb.Message { 
    getSuccess(): boolean;
    setSuccess(value: boolean): UpsertDocumentsResponse;
    getMessage(): string;
    setMessage(value: string): UpsertDocumentsResponse;
    getDocumentsProcessed(): number;
    setDocumentsProcessed(value: number): UpsertDocumentsResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpsertDocumentsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: UpsertDocumentsResponse): UpsertDocumentsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpsertDocumentsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpsertDocumentsResponse;
    static deserializeBinaryFromReader(message: UpsertDocumentsResponse, reader: jspb.BinaryReader): UpsertDocumentsResponse;
}

export namespace UpsertDocumentsResponse {
    export type AsObject = {
        success: boolean,
        message: string,
        documentsProcessed: number,
    }
}

export class GetDocumentRequest extends jspb.Message { 
    getCollection(): string;
    setCollection(value: string): GetDocumentRequest;
    getId(): string;
    setId(value: string): GetDocumentRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetDocumentRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetDocumentRequest): GetDocumentRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetDocumentRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetDocumentRequest;
    static deserializeBinaryFromReader(message: GetDocumentRequest, reader: jspb.BinaryReader): GetDocumentRequest;
}

export namespace GetDocumentRequest {
    export type AsObject = {
        collection: string,
        id: string,
    }
}

export class GetDocumentResponse extends jspb.Message { 

    hasDocument(): boolean;
    clearDocument(): void;
    getDocument(): VectorDocument | undefined;
    setDocument(value?: VectorDocument): GetDocumentResponse;
    getFound(): boolean;
    setFound(value: boolean): GetDocumentResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetDocumentResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetDocumentResponse): GetDocumentResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetDocumentResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetDocumentResponse;
    static deserializeBinaryFromReader(message: GetDocumentResponse, reader: jspb.BinaryReader): GetDocumentResponse;
}

export namespace GetDocumentResponse {
    export type AsObject = {
        document?: VectorDocument.AsObject,
        found: boolean,
    }
}

export class UpdateDocumentRequest extends jspb.Message { 
    getCollection(): string;
    setCollection(value: string): UpdateDocumentRequest;
    getId(): string;
    setId(value: string): UpdateDocumentRequest;

    hasDocument(): boolean;
    clearDocument(): void;
    getDocument(): VectorDocument | undefined;
    setDocument(value?: VectorDocument): UpdateDocumentRequest;
    getGenerateEmbeddings(): boolean;
    setGenerateEmbeddings(value: boolean): UpdateDocumentRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateDocumentRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateDocumentRequest): UpdateDocumentRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateDocumentRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateDocumentRequest;
    static deserializeBinaryFromReader(message: UpdateDocumentRequest, reader: jspb.BinaryReader): UpdateDocumentRequest;
}

export namespace UpdateDocumentRequest {
    export type AsObject = {
        collection: string,
        id: string,
        document?: VectorDocument.AsObject,
        generateEmbeddings: boolean,
    }
}

export class UpdateDocumentResponse extends jspb.Message { 
    getSuccess(): boolean;
    setSuccess(value: boolean): UpdateDocumentResponse;
    getMessage(): string;
    setMessage(value: string): UpdateDocumentResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateDocumentResponse.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateDocumentResponse): UpdateDocumentResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateDocumentResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateDocumentResponse;
    static deserializeBinaryFromReader(message: UpdateDocumentResponse, reader: jspb.BinaryReader): UpdateDocumentResponse;
}

export namespace UpdateDocumentResponse {
    export type AsObject = {
        success: boolean,
        message: string,
    }
}

export class DeleteDocumentRequest extends jspb.Message { 
    getCollection(): string;
    setCollection(value: string): DeleteDocumentRequest;
    getId(): string;
    setId(value: string): DeleteDocumentRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteDocumentRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteDocumentRequest): DeleteDocumentRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteDocumentRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteDocumentRequest;
    static deserializeBinaryFromReader(message: DeleteDocumentRequest, reader: jspb.BinaryReader): DeleteDocumentRequest;
}

export namespace DeleteDocumentRequest {
    export type AsObject = {
        collection: string,
        id: string,
    }
}

export class DeleteDocumentResponse extends jspb.Message { 
    getSuccess(): boolean;
    setSuccess(value: boolean): DeleteDocumentResponse;
    getMessage(): string;
    setMessage(value: string): DeleteDocumentResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteDocumentResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteDocumentResponse): DeleteDocumentResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteDocumentResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteDocumentResponse;
    static deserializeBinaryFromReader(message: DeleteDocumentResponse, reader: jspb.BinaryReader): DeleteDocumentResponse;
}

export namespace DeleteDocumentResponse {
    export type AsObject = {
        success: boolean,
        message: string,
    }
}

export class EmbeddingVector extends jspb.Message { 
    clearValuesList(): void;
    getValuesList(): Array<number>;
    setValuesList(value: Array<number>): EmbeddingVector;
    addValues(value: number, index?: number): number;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): EmbeddingVector.AsObject;
    static toObject(includeInstance: boolean, msg: EmbeddingVector): EmbeddingVector.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: EmbeddingVector, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): EmbeddingVector;
    static deserializeBinaryFromReader(message: EmbeddingVector, reader: jspb.BinaryReader): EmbeddingVector;
}

export namespace EmbeddingVector {
    export type AsObject = {
        valuesList: Array<number>,
    }
}

export class SimilaritySearchRequest extends jspb.Message { 
    getCollection(): string;
    setCollection(value: string): SimilaritySearchRequest;

    hasEmbedding(): boolean;
    clearEmbedding(): void;
    getEmbedding(): EmbeddingVector | undefined;
    setEmbedding(value?: EmbeddingVector): SimilaritySearchRequest;

    hasText(): boolean;
    clearText(): void;
    getText(): string;
    setText(value: string): SimilaritySearchRequest;
    getLimit(): number;
    setLimit(value: number): SimilaritySearchRequest;
    getThreshold(): number;
    setThreshold(value: number): SimilaritySearchRequest;

    hasMetadataFilter(): boolean;
    clearMetadataFilter(): void;
    getMetadataFilter(): google_protobuf_struct_pb.Struct | undefined;
    setMetadataFilter(value?: google_protobuf_struct_pb.Struct): SimilaritySearchRequest;

    getQueryCase(): SimilaritySearchRequest.QueryCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SimilaritySearchRequest.AsObject;
    static toObject(includeInstance: boolean, msg: SimilaritySearchRequest): SimilaritySearchRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SimilaritySearchRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SimilaritySearchRequest;
    static deserializeBinaryFromReader(message: SimilaritySearchRequest, reader: jspb.BinaryReader): SimilaritySearchRequest;
}

export namespace SimilaritySearchRequest {
    export type AsObject = {
        collection: string,
        embedding?: EmbeddingVector.AsObject,
        text: string,
        limit: number,
        threshold: number,
        metadataFilter?: google_protobuf_struct_pb.Struct.AsObject,
    }

    export enum QueryCase {
        QUERY_NOT_SET = 0,
        EMBEDDING = 2,
        TEXT = 3,
    }

}

export class SimilaritySearchResponse extends jspb.Message { 
    clearResultsList(): void;
    getResultsList(): Array<SearchResult>;
    setResultsList(value: Array<SearchResult>): SimilaritySearchResponse;
    addResults(value?: SearchResult, index?: number): SearchResult;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SimilaritySearchResponse.AsObject;
    static toObject(includeInstance: boolean, msg: SimilaritySearchResponse): SimilaritySearchResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SimilaritySearchResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SimilaritySearchResponse;
    static deserializeBinaryFromReader(message: SimilaritySearchResponse, reader: jspb.BinaryReader): SimilaritySearchResponse;
}

export namespace SimilaritySearchResponse {
    export type AsObject = {
        resultsList: Array<SearchResult.AsObject>,
    }
}

export class HybridSearchRequest extends jspb.Message { 
    getCollection(): string;
    setCollection(value: string): HybridSearchRequest;

    hasEmbedding(): boolean;
    clearEmbedding(): void;
    getEmbedding(): EmbeddingVector | undefined;
    setEmbedding(value?: EmbeddingVector): HybridSearchRequest;

    hasText(): boolean;
    clearText(): void;
    getText(): string;
    setText(value: string): HybridSearchRequest;
    getLimit(): number;
    setLimit(value: number): HybridSearchRequest;
    getThreshold(): number;
    setThreshold(value: number): HybridSearchRequest;

    hasMetadataFilter(): boolean;
    clearMetadataFilter(): void;
    getMetadataFilter(): google_protobuf_struct_pb.Struct | undefined;
    setMetadataFilter(value?: google_protobuf_struct_pb.Struct): HybridSearchRequest;
    getAlpha(): number;
    setAlpha(value: number): HybridSearchRequest;

    getQueryCase(): HybridSearchRequest.QueryCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): HybridSearchRequest.AsObject;
    static toObject(includeInstance: boolean, msg: HybridSearchRequest): HybridSearchRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: HybridSearchRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): HybridSearchRequest;
    static deserializeBinaryFromReader(message: HybridSearchRequest, reader: jspb.BinaryReader): HybridSearchRequest;
}

export namespace HybridSearchRequest {
    export type AsObject = {
        collection: string,
        embedding?: EmbeddingVector.AsObject,
        text: string,
        limit: number,
        threshold: number,
        metadataFilter?: google_protobuf_struct_pb.Struct.AsObject,
        alpha: number,
    }

    export enum QueryCase {
        QUERY_NOT_SET = 0,
        EMBEDDING = 2,
        TEXT = 3,
    }

}

export class HybridSearchResponse extends jspb.Message { 
    clearResultsList(): void;
    getResultsList(): Array<SearchResult>;
    setResultsList(value: Array<SearchResult>): HybridSearchResponse;
    addResults(value?: SearchResult, index?: number): SearchResult;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): HybridSearchResponse.AsObject;
    static toObject(includeInstance: boolean, msg: HybridSearchResponse): HybridSearchResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: HybridSearchResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): HybridSearchResponse;
    static deserializeBinaryFromReader(message: HybridSearchResponse, reader: jspb.BinaryReader): HybridSearchResponse;
}

export namespace HybridSearchResponse {
    export type AsObject = {
        resultsList: Array<SearchResult.AsObject>,
    }
}

export class SearchResult extends jspb.Message { 
    getId(): string;
    setId(value: string): SearchResult;
    getContent(): string;
    setContent(value: string): SearchResult;

    hasMetadata(): boolean;
    clearMetadata(): void;
    getMetadata(): google_protobuf_struct_pb.Struct | undefined;
    setMetadata(value?: google_protobuf_struct_pb.Struct): SearchResult;
    getScore(): number;
    setScore(value: number): SearchResult;
    getDistance(): number;
    setDistance(value: number): SearchResult;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SearchResult.AsObject;
    static toObject(includeInstance: boolean, msg: SearchResult): SearchResult.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SearchResult, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SearchResult;
    static deserializeBinaryFromReader(message: SearchResult, reader: jspb.BinaryReader): SearchResult;
}

export namespace SearchResult {
    export type AsObject = {
        id: string,
        content: string,
        metadata?: google_protobuf_struct_pb.Struct.AsObject,
        score: number,
        distance: number,
    }
}

export class BatchUpsertRequest extends jspb.Message { 
    getCollection(): string;
    setCollection(value: string): BatchUpsertRequest;
    clearDocumentsList(): void;
    getDocumentsList(): Array<VectorDocument>;
    setDocumentsList(value: Array<VectorDocument>): BatchUpsertRequest;
    addDocuments(value?: VectorDocument, index?: number): VectorDocument;
    getGenerateEmbeddings(): boolean;
    setGenerateEmbeddings(value: boolean): BatchUpsertRequest;
    getBatchSize(): number;
    setBatchSize(value: number): BatchUpsertRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BatchUpsertRequest.AsObject;
    static toObject(includeInstance: boolean, msg: BatchUpsertRequest): BatchUpsertRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BatchUpsertRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BatchUpsertRequest;
    static deserializeBinaryFromReader(message: BatchUpsertRequest, reader: jspb.BinaryReader): BatchUpsertRequest;
}

export namespace BatchUpsertRequest {
    export type AsObject = {
        collection: string,
        documentsList: Array<VectorDocument.AsObject>,
        generateEmbeddings: boolean,
        batchSize: number,
    }
}

export class BatchUpsertResponse extends jspb.Message { 
    getSuccess(): boolean;
    setSuccess(value: boolean): BatchUpsertResponse;
    getMessage(): string;
    setMessage(value: string): BatchUpsertResponse;
    getDocumentsProcessed(): number;
    setDocumentsProcessed(value: number): BatchUpsertResponse;
    getBatchesProcessed(): number;
    setBatchesProcessed(value: number): BatchUpsertResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BatchUpsertResponse.AsObject;
    static toObject(includeInstance: boolean, msg: BatchUpsertResponse): BatchUpsertResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BatchUpsertResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BatchUpsertResponse;
    static deserializeBinaryFromReader(message: BatchUpsertResponse, reader: jspb.BinaryReader): BatchUpsertResponse;
}

export namespace BatchUpsertResponse {
    export type AsObject = {
        success: boolean,
        message: string,
        documentsProcessed: number,
        batchesProcessed: number,
    }
}

export class BatchDeleteRequest extends jspb.Message { 
    getCollection(): string;
    setCollection(value: string): BatchDeleteRequest;
    clearIdsList(): void;
    getIdsList(): Array<string>;
    setIdsList(value: Array<string>): BatchDeleteRequest;
    addIds(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BatchDeleteRequest.AsObject;
    static toObject(includeInstance: boolean, msg: BatchDeleteRequest): BatchDeleteRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BatchDeleteRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BatchDeleteRequest;
    static deserializeBinaryFromReader(message: BatchDeleteRequest, reader: jspb.BinaryReader): BatchDeleteRequest;
}

export namespace BatchDeleteRequest {
    export type AsObject = {
        collection: string,
        idsList: Array<string>,
    }
}

export class BatchDeleteResponse extends jspb.Message { 
    getSuccess(): boolean;
    setSuccess(value: boolean): BatchDeleteResponse;
    getMessage(): string;
    setMessage(value: string): BatchDeleteResponse;
    getDocumentsDeleted(): number;
    setDocumentsDeleted(value: number): BatchDeleteResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): BatchDeleteResponse.AsObject;
    static toObject(includeInstance: boolean, msg: BatchDeleteResponse): BatchDeleteResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: BatchDeleteResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): BatchDeleteResponse;
    static deserializeBinaryFromReader(message: BatchDeleteResponse, reader: jspb.BinaryReader): BatchDeleteResponse;
}

export namespace BatchDeleteResponse {
    export type AsObject = {
        success: boolean,
        message: string,
        documentsDeleted: number,
    }
}

export class HealthCheckResponse extends jspb.Message { 
    getHealthy(): boolean;
    setHealthy(value: boolean): HealthCheckResponse;
    getStatus(): string;
    setStatus(value: string): HealthCheckResponse;

    getDetailsMap(): jspb.Map<string, string>;
    clearDetailsMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): HealthCheckResponse.AsObject;
    static toObject(includeInstance: boolean, msg: HealthCheckResponse): HealthCheckResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: HealthCheckResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): HealthCheckResponse;
    static deserializeBinaryFromReader(message: HealthCheckResponse, reader: jspb.BinaryReader): HealthCheckResponse;
}

export namespace HealthCheckResponse {
    export type AsObject = {
        healthy: boolean,
        status: string,

        detailsMap: Array<[string, string]>,
    }
}

export class GetStatsRequest extends jspb.Message { 
    getCollection(): string;
    setCollection(value: string): GetStatsRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetStatsRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetStatsRequest): GetStatsRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetStatsRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetStatsRequest;
    static deserializeBinaryFromReader(message: GetStatsRequest, reader: jspb.BinaryReader): GetStatsRequest;
}

export namespace GetStatsRequest {
    export type AsObject = {
        collection: string,
    }
}

export class GetStatsResponse extends jspb.Message { 

    hasStats(): boolean;
    clearStats(): void;
    getStats(): google_protobuf_struct_pb.Struct | undefined;
    setStats(value?: google_protobuf_struct_pb.Struct): GetStatsResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetStatsResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetStatsResponse): GetStatsResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetStatsResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetStatsResponse;
    static deserializeBinaryFromReader(message: GetStatsResponse, reader: jspb.BinaryReader): GetStatsResponse;
}

export namespace GetStatsResponse {
    export type AsObject = {
        stats?: google_protobuf_struct_pb.Struct.AsObject,
    }
}

export class Error extends jspb.Message { 
    getCode(): string;
    setCode(value: string): Error;
    getMessage(): string;
    setMessage(value: string): Error;

    getDetailsMap(): jspb.Map<string, string>;
    clearDetailsMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Error.AsObject;
    static toObject(includeInstance: boolean, msg: Error): Error.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Error, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Error;
    static deserializeBinaryFromReader(message: Error, reader: jspb.BinaryReader): Error;
}

export namespace Error {
    export type AsObject = {
        code: string,
        message: string,

        detailsMap: Array<[string, string]>,
    }
}
