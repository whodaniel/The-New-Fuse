/**
 * Code Execution Session Service
 * 
 * This service manages collaborative code execution sessions.
 */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { v4 as uuidv4 } from 'uuid';

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
@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  
  constructor(private readonly prisma: PrismaService) {}
  
  /**
   * Create a new code execution session
   * @param params Session creation parameters
   * @returns Created session
   */
  async createSession(params: CreateSessionParams): Promise<any> {
    this.logger.log(`Creating session: ${params.name}`);
    
    try {
      // Create initial files if not provided
      const files = params.files || [
        {
          id: uuidv4(),
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
          id: uuidv4(),
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
    } catch (error) {
      this.logger.error(`Error creating session: ${error.message}`, error.stack);
      throw new Error(`Failed to create session: ${error.message}`);
    }
  }
  
  /**
   * Get a code execution session by ID
   * @param sessionId Session ID
   * @returns Session
   */
  async getSession(sessionId: string): Promise<any> {
    this.logger.log(`Getting session: ${sessionId}`);
    
    try {
      const session = await this.prisma.codeExecutionSession.findUnique({
        where: { id: sessionId },
      });
      
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }
      
      return session;
    } catch (error) {
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
  async updateSession(sessionId: string, data: any): Promise<any> {
    this.logger.log(`Updating session: ${sessionId}`);
    
    try {
      const session = await this.prisma.codeExecutionSession.update({
        where: { id: sessionId },
        data,
      });
      
      this.logger.log(`Session updated: ${sessionId}`);
      
      return session;
    } catch (error) {
      this.logger.error(`Error updating session: ${error.message}`, error.stack);
      throw new Error(`Failed to update session: ${error.message}`);
    }
  }
  
  /**
   * Delete a code execution session
   * @param sessionId Session ID
   * @returns Deleted session
   */
  async deleteSession(sessionId: string): Promise<any> {
    this.logger.log(`Deleting session: ${sessionId}`);
    
    try {
      const session = await this.prisma.codeExecutionSession.delete({
        where: { id: sessionId },
      });
      
      this.logger.log(`Session deleted: ${sessionId}`);
      
      return session;
    } catch (error) {
      this.logger.error(`Error deleting session: ${error.message}`, error.stack);
      throw new Error(`Failed to delete session: ${error.message}`);
    }
  }
  
  /**
   * Get sessions for a user
   * @param userId User ID
   * @returns Sessions
   */
  async getUserSessions(userId: string): Promise<any[]> {
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
    } catch (error) {
      this.logger.error(`Error getting user sessions: ${error.message}`, error.stack);
      throw new Error(`Failed to get user sessions: ${error.message}`);
    }
  }
  
  /**
   * Get public sessions
   * @returns Public sessions
   */
  async getPublicSessions(): Promise<any[]> {
    this.logger.log('Getting public sessions');
    
    try {
      const sessions = await this.prisma.codeExecutionSession.findMany({
        where: { isPublic: true },
        orderBy: { updatedAt: 'desc' },
      });
      
      return sessions;
    } catch (error) {
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
  async addFile(sessionId: string, file: SessionFile): Promise<any> {
    this.logger.log(`Adding file to session ${sessionId}: ${file.name}`);
    
    try {
      // Get current session
      const session = await this.getSession(sessionId);
      
      // Add file to files array
      const files = [...session.files, {
        ...file,
        id: file.id || uuidv4(),
        lastModified: file.lastModified || new Date().toISOString(),
      }];
      
      // Update session
      return this.updateSession(sessionId, { 
        files,
        storageUsage: session.storageUsage + file.content.length,
      });
    } catch (error) {
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
  async updateFile(sessionId: string, fileId: string, content: string): Promise<any> {
    this.logger.log(`Updating file ${fileId} in session ${sessionId}`);
    
    try {
      // Get current session
      const session = await this.getSession(sessionId);
      
      // Find file in files array
      const fileIndex = session.files.findIndex((f: any) => f.id === fileId);
      
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
    } catch (error) {
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
  async deleteFile(sessionId: string, fileId: string): Promise<any> {
    this.logger.log(`Deleting file ${fileId} from session ${sessionId}`);
    
    try {
      // Get current session
      const session = await this.getSession(sessionId);
      
      // Find file in files array
      const fileIndex = session.files.findIndex((f: any) => f.id === fileId);
      
      if (fileIndex === -1) {
        throw new Error(`File not found: ${fileId}`);
      }
      
      // Calculate storage difference
      const fileSize = session.files[fileIndex].content.length;
      
      // Remove file
      const files = session.files.filter((f: any) => f.id !== fileId);
      
      // Update session
      return this.updateSession(sessionId, { 
        files,
        storageUsage: session.storageUsage - fileSize,
      });
    } catch (error) {
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
  async addCollaborator(sessionId: string, userId: string): Promise<any> {
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
    } catch (error) {
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
  async removeCollaborator(sessionId: string, userId: string): Promise<any> {
    this.logger.log(`Removing collaborator ${userId} from session ${sessionId}`);
    
    try {
      // Get current session
      const session = await this.getSession(sessionId);
      
      // Remove user from collaborators
      const collaborators = session.collaborators.filter((id: string) => id !== userId);
      
      // Update session
      return this.updateSession(sessionId, { collaborators });
    } catch (error) {
      this.logger.error(`Error removing collaborator from session: ${error.message}`, error.stack);
      throw new Error(`Failed to remove collaborator from session: ${error.message}`);
    }
  }
  
  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<void> {
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
    } catch (error) {
      this.logger.error(`Error cleaning up expired sessions: ${error.message}`, error.stack);
    }
  }
}
