/**
 * Pydantic Agent Protocol Types
 *
 * Comprehensive type definitions for Pydantic-based agent communication,
 * data validation, and serialization within The New Fuse AI Agent framework.
 */
export interface PydanticModel {
    [key: string]: any;
}
export interface PydanticSchema {
    title: string;
    type: 'object';
    properties: {
        [key: string]: {
            title: string;
            type: string;
            format?: string;
            description?: string;
            default?: any;
            [key: string]: any;
        };
    };
    required?: string[];
}
export interface PydanticValidationError {
    loc: (string | number)[];
    msg: string;
    type: string;
}
export interface PydanticSerializationRequest {
    modelName: string;
    data: PydanticModel;
}
export interface PydanticSerializationResponse {
    success: boolean;
    serializedData?: PydanticModel;
    errors?: PydanticValidationError[];
}
export interface PydanticDeserializationRequest {
    modelName: string;
    data: PydanticModel;
}
export interface PydanticDeserializationResponse {
    success: boolean;
    deserializedData?: PydanticModel;
    errors?: PydanticValidationError[];
}
export interface PydanticAgentTask {
    taskId: string;
    operation: string;
    inputSchema: PydanticSchema;
    outputSchema: PydanticSchema;
    description?: string;
}
export interface PydanticTaskExecutionRequest {
    taskId: string;
    inputData: PydanticModel;
}
export interface PydanticTaskExecutionResponse {
    success: boolean;
    outputData?: PydanticModel;
    error?: string;
    validationErrors?: PydanticValidationError[];
}
export interface PydanticBridgeConfig {
    modelRegistry: {
        [modelName: string]: PydanticSchema;
    };
    strictValidation: boolean;
    enableSerialization: boolean;
}
//# sourceMappingURL=pydantic-types.d.ts.map