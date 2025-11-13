import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModulesContainer, Reflector } from '@nestjs/core';
import { RedisCacheService } from '../../cache/src/redis-cache.service';
export interface ApiDocumentation {
    info: {
        title: string;
        version: string;
        description: string;
        generatedAt: string;
        generatedBy: string;
    };
    servers: ApiServer[];
    endpoints: ApiEndpoint[];
    schemas: ApiSchema[];
    authentication: AuthenticationInfo;
    examples: ApiExample[];
    changelog: ChangelogEntry[];
}
export interface ApiServer {
    url: string;
    description: string;
    environment: 'development' | 'staging' | 'production';
}
export interface ApiEndpoint {
    id: string;
    path: string;
    method: string;
    summary: string;
    description: string;
    tags: string[];
    parameters: ApiParameter[];
    requestBody?: ApiRequestBody;
    responses: ApiResponse[];
    security: SecurityRequirement[];
    examples: EndpointExample[];
    deprecated: boolean;
    operationId: string;
    controller: string;
    handler: string;
    since: string;
}
export interface ApiParameter {
    name: string;
    in: 'path' | 'query' | 'header' | 'cookie';
    description: string;
    required: boolean;
    schema: TypeSchema;
    example?: any;
    deprecated?: boolean;
}
export interface ApiRequestBody {
    description: string;
    required: boolean;
    content: {
        [mediaType: string]: {
            schema: TypeSchema;
            example?: any;
            examples?: {
                [key: string]: any;
            };
        };
    };
}
export interface ApiResponse {
    statusCode: number;
    description: string;
    headers?: {
        [name: string]: ApiHeader;
    };
    content?: {
        [mediaType: string]: {
            schema: TypeSchema;
            example?: any;
            examples?: {
                [key: string]: any;
            };
        };
    };
}
export interface ApiHeader {
    description: string;
    schema: TypeSchema;
    example?: any;
}
export interface TypeSchema {
    type: string;
    format?: string;
    description?: string;
    properties?: {
        [name: string]: TypeSchema;
    };
    items?: TypeSchema;
    required?: string[];
    enum?: any[];
    example?: any;
    nullable?: boolean;
    readOnly?: boolean;
    writeOnly?: boolean;
    minimum?: number;
    maximum?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    $ref?: string;
}
export interface ApiSchema {
    name: string;
    type: 'object' | 'enum' | 'union' | 'interface';
    description: string;
    properties: {
        [name: string]: SchemaProperty;
    };
    required: string[];
    examples: any[];
    inheritance?: {
        extends?: string[];
        implements?: string[];
    };
    generics?: string[];
    deprecated?: boolean;
}
export interface SchemaProperty {
    name: string;
    type: string;
    description: string;
    required: boolean;
    nullable: boolean;
    readOnly: boolean;
    writeOnly: boolean;
    format?: string;
    enum?: any[];
    minimum?: number;
    maximum?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    example?: any;
    deprecated?: boolean;
}
export interface AuthenticationInfo {
    types: AuthenticationType[];
    securitySchemes: {
        [name: string]: SecurityScheme;
    };
}
export interface AuthenticationType {
    name: string;
    type: 'bearer' | 'apiKey' | 'oauth2' | 'basic';
    description: string;
    scheme?: string;
    bearerFormat?: string;
    flows?: OAuthFlows;
}
export interface SecurityScheme {
    type: string;
    description: string;
    name?: string;
    in?: string;
    scheme?: string;
    bearerFormat?: string;
    flows?: OAuthFlows;
}
export interface OAuthFlows {
    implicit?: OAuthFlow;
    password?: OAuthFlow;
    clientCredentials?: OAuthFlow;
    authorizationCode?: OAuthFlow;
}
export interface OAuthFlow {
    authorizationUrl?: string;
    tokenUrl?: string;
    refreshUrl?: string;
    scopes: {
        [scope: string]: string;
    };
}
export interface SecurityRequirement {
    [name: string]: string[];
}
export interface ApiExample {
    name: string;
    description: string;
    category: 'request' | 'response' | 'workflow' | 'integration';
    content: {
        endpoint?: string;
        method?: string;
        request?: any;
        response?: any;
        code?: string;
        language?: string;
    };
    tags: string[];
}
export interface EndpointExample {
    name: string;
    description: string;
    request?: {
        parameters?: {
            [name: string]: any;
        };
        body?: any;
        headers?: {
            [name: string]: string;
        };
    };
    response?: {
        statusCode: number;
        body: any;
        headers?: {
            [name: string]: string;
        };
    };
}
export interface ChangelogEntry {
    version: string;
    date: string;
    changes: ChangelogChange[];
}
export interface ChangelogChange {
    type: 'added' | 'changed' | 'deprecated' | 'removed' | 'fixed' | 'security';
    description: string;
    endpoint?: string;
    breakingChange: boolean;
}
export interface DocGenerationOptions {
    outputPath: string;
    format: ('openapi' | 'markdown' | 'html' | 'json')[];
    includeExamples: boolean;
    includeSchemas: boolean;
    includeChangelog: boolean;
    generatePostmanCollection: boolean;
    generateSDK: boolean;
    validateTypes: boolean;
    customTemplates?: string;
}
export declare class ApiDocGeneratorService implements OnModuleInit {
    private configService;
    private modulesContainer;
    private reflector;
    private cacheService;
    private readonly logger;
    private documentation;
    private controllers;
    private schemas;
    private endpoints;
    private readonly config;
    constructor(configService: ConfigService, modulesContainer: ModulesContainer, reflector: Reflector, cacheService: RedisCacheService);
    onModuleInit(): Promise<void>;
    generateDocumentation(options?: Partial<DocGenerationOptions>): Promise<ApiDocumentation>;
    private isController;
    private extractControllerMetadata;
    private extractMethodMetadata;
    private buildEndpoints;
}
//# sourceMappingURL=api-doc-generator.service.d.ts.map