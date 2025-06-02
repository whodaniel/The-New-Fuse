"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
/**
 * Code Execution Session Service
 *
 * This service manages collaborative code execution sessions.
 */
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
/**
 * Code Execution Session Service
 */
let SessionService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var SessionService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SessionService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        logger = new common_1.Logger(SessionService.name);
        constructor(prisma) {
            this.prisma = prisma;
        }
        /**
         * Create a new code execution session
         * @param params Session creation parameters
         * @returns Created session
         */
        async createSession(params) {
            this.logger.log(`Creating session: ${params.name}`);
            try {
                // Create initial files if not provided
                const files = params.files || [
                    {
                        id: (0, uuid_1.v4)(),
                        name: 'main.js',
                        content: '// Write your code here\n\nconsole.log("Hello, world!");\n',
                        language: 'javascript',
                        lastModified: new Date().toISOString(),
                    },
                ];
                // Create environment configuration if not provided
                const environment = params.environment || {
                    runtime: 'node',
                    version: '16',
                    modules: [],
                };
                // Create session in database
                const session = await this.prisma.codeExecutionSession.create({
                    data: {
                        id: (0, uuid_1.v4)(),
                        name: params.name,
                        description: params.description || '',
                        ownerId: params.ownerId,
                        collaborators: params.collaborators || [],
                        isPublic: params.isPublic || false,
                        files,
                        environment,
                        expiresAt: params.expiresAt,
                    },
                });
                this.logger.log(`Session created: ${session.id}`);
                return session;
            }
            catch (error) {
                this.logger.error(`Error creating session: ${error.message}`, error.stack);
                throw new Error(`Failed to create session: ${error.message}`);
            }
        }
        /**
         * Get a code execution session by ID
         * @param sessionId Session ID
         * @returns Session
         */
        async getSession(sessionId) {
            this.logger.log(`Getting session: ${sessionId}`);
            try {
                const session = await this.prisma.codeExecutionSession.findUnique({
                    where: { id: sessionId },
                });
                if (!session) {
                    throw new Error(`Session not found: ${sessionId}`);
                }
                return session;
            }
            catch (error) {
                this.logger.error(`Error getting session: ${error.message}`, error.stack);
                throw new Error(`Failed to get session: ${error.message}`);
            }
        }
        /**
         * Update a code execution session
         * @param sessionId Session ID
         * @param data Update data
         * @returns Updated session
         */
        async updateSession(sessionId, data) {
            this.logger.log(`Updating session: ${sessionId}`);
            try {
                const session = await this.prisma.codeExecutionSession.update({
                    where: { id: sessionId },
                    data,
                });
                this.logger.log(`Session updated: ${sessionId}`);
                return session;
            }
            catch (error) {
                this.logger.error(`Error updating session: ${error.message}`, error.stack);
                throw new Error(`Failed to update session: ${error.message}`);
            }
        }
        /**
         * Delete a code execution session
         * @param sessionId Session ID
         * @returns Deleted session
         */
        async deleteSession(sessionId) {
            this.logger.log(`Deleting session: ${sessionId}`);
            try {
                const session = await this.prisma.codeExecutionSession.delete({
                    where: { id: sessionId },
                });
                this.logger.log(`Session deleted: ${sessionId}`);
                return session;
            }
            catch (error) {
                this.logger.error(`Error deleting session: ${error.message}`, error.stack);
                throw new Error(`Failed to delete session: ${error.message}`);
            }
        }
        /**
         * Get sessions for a user
         * @param userId User ID
         * @returns Sessions
         */
        async getUserSessions(userId) {
            this.logger.log(`Getting sessions for user: ${userId}`);
            try {
                // Get sessions where user is owner or collaborator
                const sessions = await this.prisma.codeExecutionSession.findMany({
                    where: {
                        OR: [
                            { ownerId: userId },
                            { collaborators: { has: userId } },
                        ],
                    },
                    orderBy: { updatedAt: 'desc' },
                });
                return sessions;
            }
            catch (error) {
                this.logger.error(`Error getting user sessions: ${error.message}`, error.stack);
                throw new Error(`Failed to get user sessions: ${error.message}`);
            }
        }
        /**
         * Get public sessions
         * @returns Public sessions
         */
        async getPublicSessions() {
            this.logger.log('Getting public sessions');
            try {
                const sessions = await this.prisma.codeExecutionSession.findMany({
                    where: { isPublic: true },
                    orderBy: { updatedAt: 'desc' },
                });
                return sessions;
            }
            catch (error) {
                this.logger.error(`Error getting public sessions: ${error.message}`, error.stack);
                throw new Error(`Failed to get public sessions: ${error.message}`);
            }
        }
        /**
         * Add a file to a session
         * @param sessionId Session ID
         * @param file File to add
         * @returns Updated session
         */
        async addFile(sessionId, file) {
            this.logger.log(`Adding file to session ${sessionId}: ${file.name}`);
            try {
                // Get current session
                const session = await this.getSession(sessionId);
                // Add file to files array
                const files = [...session.files, {
                        ...file,
                        id: file.id || (0, uuid_1.v4)(),
                        lastModified: file.lastModified || new Date().toISOString(),
                    }];
                // Update session
                return this.updateSession(sessionId, {
                    files,
                    storageUsage: session.storageUsage + file.content.length,
                });
            }
            catch (error) {
                this.logger.error(`Error adding file to session: ${error.message}`, error.stack);
                throw new Error(`Failed to add file to session: ${error.message}`);
            }
        }
        /**
         * Update a file in a session
         * @param sessionId Session ID
         * @param fileId File ID
         * @param content New file content
         * @returns Updated session
         */
        async updateFile(sessionId, fileId, content) {
            this.logger.log(`Updating file ${fileId} in session ${sessionId}`);
            try {
                // Get current session
                const session = await this.getSession(sessionId);
                // Find file in files array
                const fileIndex = session.files.findIndex((f) => f.id === fileId);
                if (fileIndex === -1) {
                    throw new Error(`File not found: ${fileId}`);
                }
                // Calculate storage difference
                const oldSize = session.files[fileIndex].content.length;
                const newSize = content.length;
                const sizeDiff = newSize - oldSize;
                // Update file
                const files = [...session.files];
                files[fileIndex] = {
                    ...files[fileIndex],
                    content,
                    lastModified: new Date().toISOString(),
                };
                // Update session
                return this.updateSession(sessionId, {
                    files,
                    storageUsage: session.storageUsage + sizeDiff,
                });
            }
            catch (error) {
                this.logger.error(`Error updating file in session: ${error.message}`, error.stack);
                throw new Error(`Failed to update file in session: ${error.message}`);
            }
        }
        /**
         * Delete a file from a session
         * @param sessionId Session ID
         * @param fileId File ID
         * @returns Updated session
         */
        async deleteFile(sessionId, fileId) {
            this.logger.log(`Deleting file ${fileId} from session ${sessionId}`);
            try {
                // Get current session
                const session = await this.getSession(sessionId);
                // Find file in files array
                const fileIndex = session.files.findIndex((f) => f.id === fileId);
                if (fileIndex === -1) {
                    throw new Error(`File not found: ${fileId}`);
                }
                // Calculate storage difference
                const fileSize = session.files[fileIndex].content.length;
                // Remove file
                const files = session.files.filter((f) => f.id !== fileId);
                // Update session
                return this.updateSession(sessionId, {
                    files,
                    storageUsage: session.storageUsage - fileSize,
                });
            }
            catch (error) {
                this.logger.error(`Error deleting file from session: ${error.message}`, error.stack);
                throw new Error(`Failed to delete file from session: ${error.message}`);
            }
        }
        /**
         * Add a collaborator to a session
         * @param sessionId Session ID
         * @param userId User ID
         * @returns Updated session
         */
        async addCollaborator(sessionId, userId) {
            this.logger.log(`Adding collaborator ${userId} to session ${sessionId}`);
            try {
                // Get current session
                const session = await this.getSession(sessionId);
                // Check if user is already a collaborator
                if (session.collaborators.includes(userId)) {
                    return session;
                }
                // Add user to collaborators
                const collaborators = [...session.collaborators, userId];
                // Update session
                return this.updateSession(sessionId, { collaborators });
            }
            catch (error) {
                this.logger.error(`Error adding collaborator to session: ${error.message}`, error.stack);
                throw new Error(`Failed to add collaborator to session: ${error.message}`);
            }
        }
        /**
         * Remove a collaborator from a session
         * @param sessionId Session ID
         * @param userId User ID
         * @returns Updated session
         */
        async removeCollaborator(sessionId, userId) {
            this.logger.log(`Removing collaborator ${userId} from session ${sessionId}`);
            try {
                // Get current session
                const session = await this.getSession(sessionId);
                // Remove user from collaborators
                const collaborators = session.collaborators.filter((id) => id !== userId);
                // Update session
                return this.updateSession(sessionId, { collaborators });
            }
            catch (error) {
                this.logger.error(`Error removing collaborator from session: ${error.message}`, error.stack);
                throw new Error(`Failed to remove collaborator from session: ${error.message}`);
            }
        }
        /**
         * Clean up expired sessions
         */
        async cleanupExpiredSessions() {
            this.logger.log('Cleaning up expired sessions');
            try {
                const result = await this.prisma.codeExecutionSession.deleteMany({
                    where: {
                        expiresAt: {
                            lt: new Date(),
                        },
                    },
                });
                this.logger.log(`Deleted ${result.count} expired sessions`);
            }
            catch (error) {
                this.logger.error(`Error cleaning up expired sessions: ${error.message}`, error.stack);
            }
        }
    };
    return SessionService = _classThis;
})();
exports.SessionService = SessionService;
//# sourceMappingURL=session.service.js.map