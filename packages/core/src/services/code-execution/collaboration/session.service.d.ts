import { PrismaService } from '../../../../prisma/prisma.service.js';
/**
 * Code execution session file
 */
export interface SessionFile {
    /**
     * File ID
     */
    id: string;
    /**
     * File name
     */
    name: string;
    /**
     * File content
     */
    content: string;
    /**
     * Programming language
     */
    language: string;
    /**
     * Last modified timestamp
     */
    lastModified: string;
}
/**
 * Code execution session creation parameters
 */
export interface CreateSessionParams {
    /**
     * Session name
     */
    name: string;
    /**
     * Session description
     */
    description?: string;
    /**
     * Owner ID
     */
    ownerId: string;
    /**
     * Collaborator IDs
     */
    collaborators?: string[];
    /**
     * Whether the session is public
     */
    isPublic?: boolean;
    /**
     * Initial files
     */
    files?: SessionFile[];
    /**
     * Environment configuration
     */
    environment?: Record<string, any>;
    /**
     * Session expiration time
     */
    expiresAt?: Date;
}
/**
 * Code Execution Session Service
 */
export declare class SessionService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    /**
     * Create a new code execution session
     * @param params Session creation parameters
     * @returns Created session
     */
    createSession(params: CreateSessionParams): Promise<any>;
    /**
     * Get a code execution session by ID
     * @param sessionId Session ID
     * @returns Session
     */
    getSession(sessionId: string): Promise<any>;
    /**
     * Update a code execution session
     * @param sessionId Session ID
     * @param data Update data
     * @returns Updated session
     */
    updateSession(sessionId: string, data: any): Promise<any>;
    /**
     * Delete a code execution session
     * @param sessionId Session ID
     * @returns Deleted session
     */
    deleteSession(sessionId: string): Promise<any>;
    /**
     * Get sessions for a user
     * @param userId User ID
     * @returns Sessions
     */
    getUserSessions(userId: string): Promise<any[]>;
    /**
     * Get public sessions
     * @returns Public sessions
     */
    getPublicSessions(): Promise<any[]>;
    /**
     * Add a file to a session
     * @param sessionId Session ID
     * @param file File to add
     * @returns Updated session
     */
    addFile(sessionId: string, file: SessionFile): Promise<any>;
    /**
     * Update a file in a session
     * @param sessionId Session ID
     * @param fileId File ID
     * @param content New file content
     * @returns Updated session
     */
    updateFile(sessionId: string, fileId: string, content: string): Promise<any>;
    /**
     * Delete a file from a session
     * @param sessionId Session ID
     * @param fileId File ID
     * @returns Updated session
     */
    deleteFile(sessionId: string, fileId: string): Promise<any>;
    /**
     * Add a collaborator to a session
     * @param sessionId Session ID
     * @param userId User ID
     * @returns Updated session
     */
    addCollaborator(sessionId: string, userId: string): Promise<any>;
    /**
     * Remove a collaborator from a session
     * @param sessionId Session ID
     * @param userId User ID
     * @returns Updated session
     */
    removeCollaborator(sessionId: string, userId: string): Promise<any>;
    /**
     * Clean up expired sessions
     */
    cleanupExpiredSessions(): Promise<void>;
}
