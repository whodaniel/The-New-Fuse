import { z } from 'zod';
import { Logger } from '@nestjs/common';
import { CodeExecutionService } from '../../../packages/core/src/services/code-execution/code-execution.service.js';
export declare const executeCodeSchema: z.ZodObject<{
    code: z.ZodString;
    language: z.ZodEnum<any>;
    timeout: z.ZodOptional<z.ZodNumber>;
    memoryLimit: z.ZodOptional<z.ZodNumber>;
    allowedModules: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    context: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    sessionId: z.ZodOptional<z.ZodString>;
    persistEnvironment: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    [x: string]: any;
    code?: unknown;
    language?: unknown;
    timeout?: unknown;
    memoryLimit?: unknown;
    allowedModules?: unknown;
    context?: unknown;
    sessionId?: unknown;
    persistEnvironment?: unknown;
}, {
    [x: string]: any;
    code?: unknown;
    language?: unknown;
    timeout?: unknown;
    memoryLimit?: unknown;
    allowedModules?: unknown;
    context?: unknown;
    sessionId?: unknown;
    persistEnvironment?: unknown;
}>;
export declare const getPricingSchema: z.ZodObject<{
    tier: z.ZodOptional<z.ZodEnum<["basic", "standard", "premium"]>>;
}, "strip", z.ZodTypeAny, {
    tier?: "basic" | "standard" | "premium";
}, {
    tier?: "basic" | "standard" | "premium";
}>;
export declare const getUsageSchema: z.ZodObject<{
    clientId: z.ZodString;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    startDate?: string;
    endDate?: string;
    clientId?: string;
}, {
    startDate?: string;
    endDate?: string;
    clientId?: string;
}>;
export declare const createSessionSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    collaborators: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    isPublic: z.ZodOptional<z.ZodBoolean>;
    files: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        content: z.ZodString;
        language: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name?: string;
        content?: string;
        language?: string;
    }, {
        name?: string;
        content?: string;
        language?: string;
    }>, "many">>;
    environment: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    expiresAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    description?: string;
    expiresAt?: string;
    files?: {
        name?: string;
        content?: string;
        language?: string;
    }[];
    environment?: Record<string, any>;
    collaborators?: string[];
    isPublic?: boolean;
}, {
    name?: string;
    description?: string;
    expiresAt?: string;
    files?: {
        name?: string;
        content?: string;
        language?: string;
    }[];
    environment?: Record<string, any>;
    collaborators?: string[];
    isPublic?: boolean;
}>;
export declare const getSessionSchema: z.ZodObject<{
    sessionId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    sessionId?: string;
}, {
    sessionId?: string;
}>;
export declare const updateSessionSchema: z.ZodObject<{
    sessionId: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    isPublic: z.ZodOptional<z.ZodBoolean>;
    environment: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    expiresAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    description?: string;
    sessionId?: string;
    expiresAt?: string;
    environment?: Record<string, any>;
    isPublic?: boolean;
}, {
    name?: string;
    description?: string;
    sessionId?: string;
    expiresAt?: string;
    environment?: Record<string, any>;
    isPublic?: boolean;
}>;
export declare const deleteSessionSchema: z.ZodObject<{
    sessionId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    sessionId?: string;
}, {
    sessionId?: string;
}>;
export declare const getUserSessionsSchema: z.ZodObject<{
    userId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId?: string;
}, {
    userId?: string;
}>;
export declare const addFileToSessionSchema: z.ZodObject<{
    sessionId: z.ZodString;
    name: z.ZodString;
    content: z.ZodString;
    language: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name?: string;
    content?: string;
    language?: string;
    sessionId?: string;
}, {
    name?: string;
    content?: string;
    language?: string;
    sessionId?: string;
}>;
export declare const updateFileInSessionSchema: z.ZodObject<{
    sessionId: z.ZodString;
    fileId: z.ZodString;
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    content?: string;
    sessionId?: string;
    fileId?: string;
}, {
    content?: string;
    sessionId?: string;
    fileId?: string;
}>;
export declare const deleteFileFromSessionSchema: z.ZodObject<{
    sessionId: z.ZodString;
    fileId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    sessionId?: string;
    fileId?: string;
}, {
    sessionId?: string;
    fileId?: string;
}>;
export declare const addCollaboratorToSessionSchema: z.ZodObject<{
    sessionId: z.ZodString;
    userId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId?: string;
    sessionId?: string;
}, {
    userId?: string;
    sessionId?: string;
}>;
export declare const removeCollaboratorFromSessionSchema: z.ZodObject<{
    sessionId: z.ZodString;
    userId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId?: string;
    sessionId?: string;
}, {
    userId?: string;
    sessionId?: string;
}>;
/**
 * Register code execution tools with the MCP server
 */
export declare function registerCodeExecutionTools(mcpServer: any, codeExecutionService: CodeExecutionService, logger: Logger): void;
//# sourceMappingURL=code-execution.tools.d.ts.map