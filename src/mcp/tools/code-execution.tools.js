"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeCollaboratorFromSessionSchema = exports.addCollaboratorToSessionSchema = exports.deleteFileFromSessionSchema = exports.updateFileInSessionSchema = exports.addFileToSessionSchema = exports.getUserSessionsSchema = exports.deleteSessionSchema = exports.updateSessionSchema = exports.getSessionSchema = exports.createSessionSchema = exports.getUsageSchema = exports.getPricingSchema = exports.executeCodeSchema = void 0;
exports.registerCodeExecutionTools = registerCodeExecutionTools;
const zod_1 = require("zod");
const types_1 = require("../../../packages/core/src/services/code-execution/types");
const uuid_1 = require("uuid");
// Schema for code execution parameters
exports.executeCodeSchema = zod_1.z.object({
    code: zod_1.z.string().min(1).describe('The code to execute'),
    language: zod_1.z.enum([
        types_1.CodeExecutionLanguage.JAVASCRIPT,
        types_1.CodeExecutionLanguage.TYPESCRIPT,
        types_1.CodeExecutionLanguage.PYTHON,
        types_1.CodeExecutionLanguage.RUBY,
        types_1.CodeExecutionLanguage.SHELL,
        types_1.CodeExecutionLanguage.HTML,
        types_1.CodeExecutionLanguage.CSS,
    ]).describe('The programming language of the code'),
    timeout: zod_1.z.number().optional().describe('Maximum execution time in milliseconds (default: 5000)'),
    memoryLimit: zod_1.z.number().optional().describe('Maximum memory usage in bytes (default: 50MB)'),
    allowedModules: zod_1.z.array(zod_1.z.string()).optional().describe('List of allowed modules/packages that can be imported'),
    context: zod_1.z.record(zod_1.z.any()).optional().describe('Additional context variables to inject into the execution environment'),
    sessionId: zod_1.z.string().optional().describe('Session ID for collaborative code execution'),
    persistEnvironment: zod_1.z.boolean().optional().describe('Whether to persist the execution environment for future executions'),
});
// Schema for getting pricing information
exports.getPricingSchema = zod_1.z.object({
    tier: zod_1.z.enum(['basic', 'standard', 'premium']).optional().describe('Specific pricing tier to get information for'),
});
// Schema for getting usage information
exports.getUsageSchema = zod_1.z.object({
    clientId: zod_1.z.string().describe('Client ID to get usage for'),
    startDate: zod_1.z.string().optional().describe('Start date for usage period (ISO format)'),
    endDate: zod_1.z.string().optional().describe('End date for usage period (ISO format)'),
});
// Schema for creating a session
exports.createSessionSchema = zod_1.z.object({
    name: zod_1.z.string().describe('Session name'),
    description: zod_1.z.string().optional().describe('Session description'),
    collaborators: zod_1.z.array(zod_1.z.string()).optional().describe('Collaborator IDs'),
    isPublic: zod_1.z.boolean().optional().describe('Whether the session is public'),
    files: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string().describe('File name'),
        content: zod_1.z.string().describe('File content'),
        language: zod_1.z.string().describe('Programming language'),
    })).optional().describe('Initial files'),
    environment: zod_1.z.record(zod_1.z.any()).optional().describe('Environment configuration'),
    expiresAt: zod_1.z.string().optional().describe('Session expiration time (ISO format)'),
});
// Schema for getting a session
exports.getSessionSchema = zod_1.z.object({
    sessionId: zod_1.z.string().describe('Session ID'),
});
// Schema for updating a session
exports.updateSessionSchema = zod_1.z.object({
    sessionId: zod_1.z.string().describe('Session ID'),
    name: zod_1.z.string().optional().describe('Session name'),
    description: zod_1.z.string().optional().describe('Session description'),
    isPublic: zod_1.z.boolean().optional().describe('Whether the session is public'),
    environment: zod_1.z.record(zod_1.z.any()).optional().describe('Environment configuration'),
    expiresAt: zod_1.z.string().optional().describe('Session expiration time (ISO format)'),
});
// Schema for deleting a session
exports.deleteSessionSchema = zod_1.z.object({
    sessionId: zod_1.z.string().describe('Session ID'),
});
// Schema for getting user sessions
exports.getUserSessionsSchema = zod_1.z.object({
    userId: zod_1.z.string().describe('User ID'),
});
// Schema for adding a file to a session
exports.addFileToSessionSchema = zod_1.z.object({
    sessionId: zod_1.z.string().describe('Session ID'),
    name: zod_1.z.string().describe('File name'),
    content: zod_1.z.string().describe('File content'),
    language: zod_1.z.string().describe('Programming language'),
});
// Schema for updating a file in a session
exports.updateFileInSessionSchema = zod_1.z.object({
    sessionId: zod_1.z.string().describe('Session ID'),
    fileId: zod_1.z.string().describe('File ID'),
    content: zod_1.z.string().describe('New file content'),
});
// Schema for deleting a file from a session
exports.deleteFileFromSessionSchema = zod_1.z.object({
    sessionId: zod_1.z.string().describe('Session ID'),
    fileId: zod_1.z.string().describe('File ID'),
});
// Schema for adding a collaborator to a session
exports.addCollaboratorToSessionSchema = zod_1.z.object({
    sessionId: zod_1.z.string().describe('Session ID'),
    userId: zod_1.z.string().describe('User ID'),
});
// Schema for removing a collaborator from a session
exports.removeCollaboratorFromSessionSchema = zod_1.z.object({
    sessionId: zod_1.z.string().describe('Session ID'),
    userId: zod_1.z.string().describe('User ID'),
});
/**
 * Register code execution tools with the MCP server
 */
function registerCodeExecutionTools(mcpServer, codeExecutionService, logger) {
    // Register executeCode tool
    mcpServer.registerTool('executeCode', {
        description: 'Execute code in a secure environment with billing based on resource usage',
        parameters: exports.executeCodeSchema,
        execute: async (params, context) => {
            logger.log(`Agent ${context.agentId} executing code in language: ${params.language}`);
            try {
                // Execute code
                const result = await codeExecutionService.executeCode({
                    ...params,
                    clientId: context.agentId, // Use agent ID as client ID for billing
                    agentId: context.agentId,
                });
                logger.log(`Code execution completed for agent ${context.agentId}: ${result.success ? 'success' : 'failure'}`);
                return result;
            }
            catch (error) {
                logger.error(`Error executing code for agent ${context.agentId}: ${error.message}`, error.stack);
                throw error;
            }
        },
    });
    // Register getPricing tool
    mcpServer.registerTool('getCodeExecutionPricing', {
        description: 'Get pricing information for code execution',
        parameters: exports.getPricingSchema,
        execute: async (params) => {
            logger.log('Getting code execution pricing information');
            try {
                // Get pricing information
                const pricingTiers = codeExecutionService.getPricingTiers();
                // Return specific tier if requested
                if (params.tier) {
                    return {
                        [params.tier]: pricingTiers[params.tier],
                    };
                }
                // Return all tiers
                return pricingTiers;
            }
            catch (error) {
                logger.error(`Error getting pricing information: ${error.message}`, error.stack);
                throw error;
            }
        },
    });
    // Register getUsage tool
    mcpServer.registerTool('getCodeExecutionUsage', {
        description: 'Get usage information for code execution',
        parameters: exports.getUsageSchema,
        execute: async (params, context) => {
            logger.log(`Getting code execution usage for client ${params.clientId}`);
            try {
                // Parse dates if provided
                const startDate = params.startDate ? new Date(params.startDate) : undefined;
                const endDate = params.endDate ? new Date(params.endDate) : undefined;
                // Get usage information
                const usage = await codeExecutionService.getClientUsage(params.clientId, startDate, endDate);
                return {
                    clientId: params.clientId,
                    startDate: params.startDate,
                    endDate: params.endDate,
                    usage,
                };
            }
            catch (error) {
                logger.error(`Error getting usage information: ${error.message}`, error.stack);
                throw error;
            }
        },
    });
    // Register createSession tool
    mcpServer.registerTool('createCodeExecutionSession', {
        description: 'Create a collaborative code execution session',
        parameters: exports.createSessionSchema,
        execute: async (params, context) => {
            logger.log(`Agent ${context.agentId} creating code execution session: ${params.name}`);
            try {
                // Parse expiration date if provided
                const expiresAt = params.expiresAt ? new Date(params.expiresAt) : undefined;
                // Create session
                const session = await codeExecutionService.createSession({
                    ...params,
                    ownerId: context.agentId,
                    expiresAt,
                });
                logger.log(`Session created: ${session.id}`);
                return session;
            }
            catch (error) {
                logger.error(`Error creating session: ${error.message}`, error.stack);
                throw error;
            }
        },
    });
    // Register getSession tool
    mcpServer.registerTool('getCodeExecutionSession', {
        description: 'Get a collaborative code execution session',
        parameters: exports.getSessionSchema,
        execute: async (params, context) => {
            logger.log(`Agent ${context.agentId} getting code execution session: ${params.sessionId}`);
            try {
                // Get session
                const session = await codeExecutionService.getSession(params.sessionId);
                // Check if agent is owner or collaborator
                if (session.ownerId !== context.agentId && !session.collaborators.includes(context.agentId) && !session.isPublic) {
                    throw new Error(`Agent ${context.agentId} is not authorized to access session ${params.sessionId}`);
                }
                return session;
            }
            catch (error) {
                logger.error(`Error getting session: ${error.message}`, error.stack);
                throw error;
            }
        },
    });
    // Register updateSession tool
    mcpServer.registerTool('updateCodeExecutionSession', {
        description: 'Update a collaborative code execution session',
        parameters: exports.updateSessionSchema,
        execute: async (params, context) => {
            logger.log(`Agent ${context.agentId} updating code execution session: ${params.sessionId}`);
            try {
                // Get session
                const session = await codeExecutionService.getSession(params.sessionId);
                // Check if agent is owner
                if (session.ownerId !== context.agentId) {
                    throw new Error(`Agent ${context.agentId} is not authorized to update session ${params.sessionId}`);
                }
                // Parse expiration date if provided
                const expiresAt = params.expiresAt ? new Date(params.expiresAt) : undefined;
                // Update session
                const updatedSession = await codeExecutionService.updateSession(params.sessionId, {
                    ...params,
                    expiresAt,
                    sessionId: undefined, // Remove sessionId from update data
                });
                logger.log(`Session updated: ${updatedSession.id}`);
                return updatedSession;
            }
            catch (error) {
                logger.error(`Error updating session: ${error.message}`, error.stack);
                throw error;
            }
        },
    });
    // Register deleteSession tool
    mcpServer.registerTool('deleteCodeExecutionSession', {
        description: 'Delete a collaborative code execution session',
        parameters: exports.deleteSessionSchema,
        execute: async (params, context) => {
            logger.log(`Agent ${context.agentId} deleting code execution session: ${params.sessionId}`);
            try {
                // Get session
                const session = await codeExecutionService.getSession(params.sessionId);
                // Check if agent is owner
                if (session.ownerId !== context.agentId) {
                    throw new Error(`Agent ${context.agentId} is not authorized to delete session ${params.sessionId}`);
                }
                // Delete session
                const deletedSession = await codeExecutionService.deleteSession(params.sessionId);
                logger.log(`Session deleted: ${deletedSession.id}`);
                return deletedSession;
            }
            catch (error) {
                logger.error(`Error deleting session: ${error.message}`, error.stack);
                throw error;
            }
        },
    });
    // Register getUserSessions tool
    mcpServer.registerTool('getUserCodeExecutionSessions', {
        description: 'Get collaborative code execution sessions for a user',
        parameters: exports.getUserSessionsSchema,
        execute: async (params, context) => {
            logger.log(`Agent ${context.agentId} getting code execution sessions for user: ${params.userId}`);
            try {
                // Check if agent is requesting its own sessions or is authorized to access other user's sessions
                if (params.userId !== context.agentId) {
                    // In a real implementation, we would check if the agent is authorized to access other user's sessions
                    // For now, we'll just allow it
                }
                // Get sessions
                const sessions = await codeExecutionService.getUserSessions(params.userId);
                return sessions;
            }
            catch (error) {
                logger.error(`Error getting user sessions: ${error.message}`, error.stack);
                throw error;
            }
        },
    });
    // Register getPublicSessions tool
    mcpServer.registerTool('getPublicCodeExecutionSessions', {
        description: 'Get public collaborative code execution sessions',
        parameters: zod_1.z.object({}),
        execute: async () => {
            logger.log('Getting public code execution sessions');
            try {
                // Get public sessions
                const sessions = await codeExecutionService.getPublicSessions();
                return sessions;
            }
            catch (error) {
                logger.error(`Error getting public sessions: ${error.message}`, error.stack);
                throw error;
            }
        },
    });
    // Register addFileToSession tool
    mcpServer.registerTool('addFileToCodeExecutionSession', {
        description: 'Add a file to a collaborative code execution session',
        parameters: exports.addFileToSessionSchema,
        execute: async (params, context) => {
            logger.log(`Agent ${context.agentId} adding file to code execution session: ${params.sessionId}`);
            try {
                // Get session
                const session = await codeExecutionService.getSession(params.sessionId);
                // Check if agent is owner or collaborator
                if (session.ownerId !== context.agentId && !session.collaborators.includes(context.agentId)) {
                    throw new Error(`Agent ${context.agentId} is not authorized to add files to session ${params.sessionId}`);
                }
                // Add file
                const updatedSession = await codeExecutionService.addFileToSession(params.sessionId, {
                    id: (0, uuid_1.v4)(),
                    name: params.name,
                    content: params.content,
                    language: params.language,
                    lastModified: new Date().toISOString(),
                });
                logger.log(`File added to session: ${updatedSession.id}`);
                return updatedSession;
            }
            catch (error) {
                logger.error(`Error adding file to session: ${error.message}`, error.stack);
                throw error;
            }
        },
    });
    // Register updateFileInSession tool
    mcpServer.registerTool('updateFileInCodeExecutionSession', {
        description: 'Update a file in a collaborative code execution session',
        parameters: exports.updateFileInSessionSchema,
        execute: async (params, context) => {
            logger.log(`Agent ${context.agentId} updating file in code execution session: ${params.sessionId}`);
            try {
                // Get session
                const session = await codeExecutionService.getSession(params.sessionId);
                // Check if agent is owner or collaborator
                if (session.ownerId !== context.agentId && !session.collaborators.includes(context.agentId)) {
                    throw new Error(`Agent ${context.agentId} is not authorized to update files in session ${params.sessionId}`);
                }
                // Update file
                const updatedSession = await codeExecutionService.updateFileInSession(params.sessionId, params.fileId, params.content);
                logger.log(`File updated in session: ${updatedSession.id}`);
                return updatedSession;
            }
            catch (error) {
                logger.error(`Error updating file in session: ${error.message}`, error.stack);
                throw error;
            }
        },
    });
    // Register deleteFileFromSession tool
    mcpServer.registerTool('deleteFileFromCodeExecutionSession', {
        description: 'Delete a file from a collaborative code execution session',
        parameters: exports.deleteFileFromSessionSchema,
        execute: async (params, context) => {
            logger.log(`Agent ${context.agentId} deleting file from code execution session: ${params.sessionId}`);
            try {
                // Get session
                const session = await codeExecutionService.getSession(params.sessionId);
                // Check if agent is owner or collaborator
                if (session.ownerId !== context.agentId && !session.collaborators.includes(context.agentId)) {
                    throw new Error(`Agent ${context.agentId} is not authorized to delete files from session ${params.sessionId}`);
                }
                // Delete file
                const updatedSession = await codeExecutionService.deleteFileFromSession(params.sessionId, params.fileId);
                logger.log(`File deleted from session: ${updatedSession.id}`);
                return updatedSession;
            }
            catch (error) {
                logger.error(`Error deleting file from session: ${error.message}`, error.stack);
                throw error;
            }
        },
    });
    // Register addCollaboratorToSession tool
    mcpServer.registerTool('addCollaboratorToCodeExecutionSession', {
        description: 'Add a collaborator to a collaborative code execution session',
        parameters: exports.addCollaboratorToSessionSchema,
        execute: async (params, context) => {
            logger.log(`Agent ${context.agentId} adding collaborator to code execution session: ${params.sessionId}`);
            try {
                // Get session
                const session = await codeExecutionService.getSession(params.sessionId);
                // Check if agent is owner
                if (session.ownerId !== context.agentId) {
                    throw new Error(`Agent ${context.agentId} is not authorized to add collaborators to session ${params.sessionId}`);
                }
                // Add collaborator
                const updatedSession = await codeExecutionService.addCollaboratorToSession(params.sessionId, params.userId);
                logger.log(`Collaborator added to session: ${updatedSession.id}`);
                return updatedSession;
            }
            catch (error) {
                logger.error(`Error adding collaborator to session: ${error.message}`, error.stack);
                throw error;
            }
        },
    });
    // Register removeCollaboratorFromSession tool
    mcpServer.registerTool('removeCollaboratorFromCodeExecutionSession', {
        description: 'Remove a collaborator from a collaborative code execution session',
        parameters: exports.removeCollaboratorFromSessionSchema,
        execute: async (params, context) => {
            logger.log(`Agent ${context.agentId} removing collaborator from code execution session: ${params.sessionId}`);
            try {
                // Get session
                const session = await codeExecutionService.getSession(params.sessionId);
                // Check if agent is owner
                if (session.ownerId !== context.agentId) {
                    throw new Error(`Agent ${context.agentId} is not authorized to remove collaborators from session ${params.sessionId}`);
                }
                // Remove collaborator
                const updatedSession = await codeExecutionService.removeCollaboratorFromSession(params.sessionId, params.userId);
                logger.log(`Collaborator removed from session: ${updatedSession.id}`);
                return updatedSession;
            }
            catch (error) {
                logger.error(`Error removing collaborator from session: ${error.message}`, error.stack);
                throw error;
            }
        },
    });
    logger.log('Registered code execution tools with MCP server');
}
//# sourceMappingURL=code-execution.tools.js.map