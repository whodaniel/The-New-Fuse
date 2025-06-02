import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CodeExecutionRequest, CodeExecutionResponse, CodeExecutionTier, CodeExecutionUsageRecord, CodeExecutionPricing } from './types.js';
import { CodeScanner } from './security/code-scanner.js';
import { RateLimiter } from './security/rate-limiter.js';
import { SessionService } from './collaboration/session.service.js';
/**
 * Service for executing code in a secure environment
 */
export declare class CodeExecutionService {
    private readonly configService;
    private readonly prisma;
    private readonly codeScanner;
    private readonly rateLimiter;
    private readonly sessionService;
    private readonly logger;
    private readonly pricingTiers;
    private readonly cloudflareWorkerUrl;
    private readonly apiKey;
    constructor(configService: ConfigService, prisma: PrismaService, codeScanner: CodeScanner, rateLimiter: RateLimiter, sessionService: SessionService);
    /**
     * Execute code in a secure environment
     * @param request Code execution request
     * @returns Code execution response
     */
    executeCode(request: CodeExecutionRequest): Promise<CodeExecutionResponse>;
    /**
     * Determine the pricing tier based on request parameters
     */
    private determineTier;
    /**
     * Validate request against tier limits
     */
    private validateRequest;
    /**
     * Execute code in Cloudflare Worker
     */
    private executeInCloudflareWorker;
    /**
     * Calculate compute units based on execution time and memory usage
     */
    private calculateComputeUnits;
    /**
     * Calculate cost based on execution time, memory usage, and tier
     */
    private calculateCost;
    /**
     * Record usage for billing
     */
    private recordUsage;
    /**
     * Get pricing information for all tiers
     */
    getPricingTiers(): Record<CodeExecutionTier, CodeExecutionPricing>;
    /**
     * Create a collaborative code execution session
     * @param params Session creation parameters
     * @returns Created session
     */
    createSession(params: any): Promise<any>;
    /**
     * Get a collaborative code execution session
     * @param sessionId Session ID
     * @returns Session
     */
    getSession(sessionId: string): Promise<any>;
    /**
     * Update a collaborative code execution session
     * @param sessionId Session ID
     * @param data Update data
     * @returns Updated session
     */
    updateSession(sessionId: string, data: any): Promise<any>;
    /**
     * Delete a collaborative code execution session
     * @param sessionId Session ID
     * @returns Deleted session
     */
    deleteSession(sessionId: string): Promise<any>;
    /**
     * Get collaborative code execution sessions for a user
     * @param userId User ID
     * @returns Sessions
     */
    getUserSessions(userId: string): Promise<any[]>;
    /**
     * Get public collaborative code execution sessions
     * @returns Public sessions
     */
    getPublicSessions(): Promise<any[]>;
    /**
     * Add a file to a collaborative code execution session
     * @param sessionId Session ID
     * @param file File to add
     * @returns Updated session
     */
    addFileToSession(sessionId: string, file: any): Promise<any>;
    /**
     * Update a file in a collaborative code execution session
     * @param sessionId Session ID
     * @param fileId File ID
     * @param content New file content
     * @returns Updated session
     */
    updateFileInSession(sessionId: string, fileId: string, content: string): Promise<any>;
    /**
     * Delete a file from a collaborative code execution session
     * @param sessionId Session ID
     * @param fileId File ID
     * @returns Updated session
     */
    deleteFileFromSession(sessionId: string, fileId: string): Promise<any>;
    /**
     * Add a collaborator to a collaborative code execution session
     * @param sessionId Session ID
     * @param userId User ID
     * @returns Updated session
     */
    addCollaboratorToSession(sessionId: string, userId: string): Promise<any>;
    /**
     * Remove a collaborator from a collaborative code execution session
     * @param sessionId Session ID
     * @param userId User ID
     * @returns Updated session
     */
    removeCollaboratorFromSession(sessionId: string, userId: string): Promise<any>;
    /**
     * Get usage records for a client
     */
    getClientUsage(clientId: string, startDate?: Date, endDate?: Date): Promise<CodeExecutionUsageRecord[]>;
    /**
     * Get usage statistics for a client
     */
    getClientUsageStats(clientId: string, startDate?: Date, endDate?: Date): Promise<any>;
}
