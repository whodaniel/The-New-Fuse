import { z } from 'zod';
import { Logger } from '@nestjs/common';
import { CodeExecutionService } from '../../../packages/core/src/services/code-execution/code-execution.service';
export declare const executeCodeSchema: z.ZodObject<{
    code: z.ZodString;
    language: z.ZodEnum<{
        [x: string]: any;
    }>;
    timeout: z.ZodOptional<z.ZodNumber>;
    memoryLimit: z.ZodOptional<z.ZodNumber>;
    allowedModules: z.ZodOptional<z.ZodArray<z.ZodString>>;
    context: z.ZodOptional<z.ZodRecord<z.ZodAny, z.core.SomeType>>;
    sessionId: z.ZodOptional<z.ZodString>;
    persistEnvironment: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const getPricingSchema: z.ZodObject<{
    tier: z.ZodOptional<z.ZodEnum<{
        basic: "basic";
        standard: "standard";
        premium: "premium";
    }>>;
}, z.core.$strip>;
export declare const getUsageSchema: z.ZodObject<{
    clientId: z.ZodString;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const createSessionSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    collaborators: z.ZodOptional<z.ZodArray<z.ZodString>>;
    isPublic: z.ZodOptional<z.ZodBoolean>;
    files: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        content: z.ZodString;
        language: z.ZodString;
    }, z.core.$strip>>>;
    environment: z.ZodOptional<z.ZodRecord<z.ZodAny, z.core.SomeType>>;
    expiresAt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const getSessionSchema: z.ZodObject<{
    sessionId: z.ZodString;
}, z.core.$strip>;
export declare const updateSessionSchema: z.ZodObject<{
    sessionId: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    isPublic: z.ZodOptional<z.ZodBoolean>;
    environment: z.ZodOptional<z.ZodRecord<z.ZodAny, z.core.SomeType>>;
    expiresAt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const deleteSessionSchema: z.ZodObject<{
    sessionId: z.ZodString;
}, z.core.$strip>;
export declare const getUserSessionsSchema: z.ZodObject<{
    userId: z.ZodString;
}, z.core.$strip>;
export declare const addFileToSessionSchema: z.ZodObject<{
    sessionId: z.ZodString;
    name: z.ZodString;
    content: z.ZodString;
    language: z.ZodString;
}, z.core.$strip>;
export declare const updateFileInSessionSchema: z.ZodObject<{
    sessionId: z.ZodString;
    fileId: z.ZodString;
    content: z.ZodString;
}, z.core.$strip>;
export declare const deleteFileFromSessionSchema: z.ZodObject<{
    sessionId: z.ZodString;
    fileId: z.ZodString;
}, z.core.$strip>;
export declare const addCollaboratorToSessionSchema: z.ZodObject<{
    sessionId: z.ZodString;
    userId: z.ZodString;
}, z.core.$strip>;
export declare const removeCollaboratorFromSessionSchema: z.ZodObject<{
    sessionId: z.ZodString;
    userId: z.ZodString;
}, z.core.$strip>;
/**
 * Register code execution tools with the MCP server
 */
export declare function registerCodeExecutionTools(mcpServer: any, codeExecutionService: CodeExecutionService, logger: Logger): void;
//# sourceMappingURL=code-execution.tools.d.ts.map