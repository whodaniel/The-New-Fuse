import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { v4 as uuidv4 } from 'uuid';
import {
  CodeExecutionRequest,
  CodeExecutionResponse,
  CodeExecutionTier,
  CodeExecutionUsageRecord,
  CodeExecutionPricing,
  CodeExecutionLanguage
} from './types.js';
import { CodeScanner, SecurityIssueSeverity } from './security/code-scanner.js';
import { RateLimiter } from './security/rate-limiter.js';
import { SessionService } from './collaboration/session.service.js';

/**
 * Service for executing code in a secure environment
 */
@Injectable()
export class CodeExecutionService {
  private readonly logger = new Logger(CodeExecutionService.name);
  private readonly pricingTiers: Record<CodeExecutionTier, CodeExecutionPricing>;
  private readonly cloudflareWorkerUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly codeScanner: CodeScanner,
    private readonly rateLimiter: RateLimiter,
    private readonly sessionService: SessionService
  ) {
    // Initialize pricing tiers
    this.pricingTiers = {
      [CodeExecutionTier.BASIC]: {
        costPerSecond: 0.0001,
        costPerMB: 0.00001,
        maxExecutionTime: 10000, // 10 seconds
        maxMemoryLimit: 128 * 1024 * 1024, // 128MB
        allowedModules: ['path', 'util', 'crypto'],
      },
      [CodeExecutionTier.STANDARD]: {
        costPerSecond: 0.0005,
        costPerMB: 0.00005,
        maxExecutionTime: 30000, // 30 seconds
        maxMemoryLimit: 256 * 1024 * 1024, // 256MB
        allowedModules: ['path', 'util', 'crypto', 'fs', 'http', 'https', 'zlib'],
      },
      [CodeExecutionTier.PREMIUM]: {
        costPerSecond: 0.001,
        costPerMB: 0.0001,
        maxExecutionTime: 60000, // 60 seconds
        maxMemoryLimit: 512 * 1024 * 1024, // 512MB
        allowedModules: ['path', 'util', 'crypto', 'fs', 'http', 'https', 'zlib', 'stream', 'child_process'],
      },
      [CodeExecutionTier.ENTERPRISE]: {
        costPerSecond: 0.002,
        costPerMB: 0.0002,
        maxExecutionTime: 300000, // 5 minutes
        maxMemoryLimit: 1024 * 1024 * 1024, // 1GB
        allowedModules: ['*'], // All modules allowed
      },
    };

    // Get configuration from environment
    this.cloudflareWorkerUrl = this.configService.get<string>('CODE_EXECUTION_WORKER_URL', 'https://code-execution.thefuse.workers.dev');
    this.apiKey = this.configService.get<string>('CODE_EXECUTION_API_KEY', '');

    this.logger.log('Code Execution Service initialized');
  }

  /**
   * Execute code in a secure environment
   * @param request Code execution request
   * @returns Code execution response
   */
  async executeCode(request: CodeExecutionRequest): Promise<CodeExecutionResponse> {
    const executionId = uuidv4();
    const startTime = Date.now();
    const agentId = request.agentId || 'unknown';

    try {
      this.logger.log(`Executing code for client ${request.clientId} (ID: ${executionId})`);

      // Check rate limit
      const rateLimitResult = this.rateLimiter.checkRateLimit(request.clientId);
      if (!rateLimitResult.allowed) {
        throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(rateLimitResult.resetMs / 1000)} seconds.`);
      }

      // Scan code for security issues
      const securityScanResult = this.codeScanner.scanCode(request.code, request.language);
      if (!securityScanResult.safe) {
        const criticalIssues = securityScanResult.issues.filter(issue =>
          issue.severity === SecurityIssueSeverity.CRITICAL ||
          issue.severity === SecurityIssueSeverity.HIGH
        );

        const issueDescriptions = criticalIssues.map(issue =>
          `${issue.severity.toUpperCase()}: ${issue.description}${issue.line ? ` at line ${issue.line}` : ''}`
        ).join('; ');

        throw new Error(`Code contains security issues: ${issueDescriptions}`);
      }

      // Determine pricing tier based on request parameters
      const tier = this.determineTier(request);
      const pricing = this.pricingTiers[tier];

      // Validate request against tier limits
      this.validateRequest(request, pricing);

      // Create initial database record for tracking
      await this.prisma.codeExecutionUsage.create({
        data: {
          id: executionId,
          agentId,
          clientId: request.clientId,
          executionId,
          language: request.language,
          code: request.code,
          output: [],
          executionTime: 0,
          memoryUsage: 0,
          computeUnits: 0,
          cost: 0,
          tier,
          environment: request.environment || 'sandbox',
          status: 'PENDING',
        },
      });

      // Update status to running
      await this.prisma.codeExecutionUsage.update({
        where: { executionId },
        data: { status: 'RUNNING' },
      });

      // Check if this is part of a collaborative session
      if (request.sessionId) {
        // Get session
        const session = await this.sessionService.getSession(request.sessionId);

        // Check if user is owner or collaborator
        if (session.ownerId !== request.clientId && !session.collaborators.includes(request.clientId)) {
          throw new Error(`User ${request.clientId} is not authorized to execute code in session ${request.sessionId}`);
        }

        this.logger.log(`Executing code in collaborative session ${request.sessionId}`);

        // If we need to persist the environment, we would set up a persistent container here
        // For now, we'll just execute the code normally
      }

      // Execute code in Cloudflare Worker
      const response = await this.executeInCloudflareWorker(request, executionId);

      // Calculate billing metrics
      const executionTime = Date.now() - startTime;
      const memoryUsage = response.metrics?.memoryUsage || 0;
      const computeUnits = this.calculateComputeUnits(executionTime, memoryUsage);
      const cost = this.calculateCost(executionTime, memoryUsage, tier);

      // Update database record with results
      await this.prisma.codeExecutionUsage.update({
        where: { executionId },
        data: {
          result: response.result || null,
          output: response.output,
          error: response.error || null,
          executionTime,
          memoryUsage,
          computeUnits,
          cost,
          status: response.success ? 'COMPLETED' : 'FAILED',
          completedAt: new Date(),
        },
      });

      this.logger.log(`Code execution completed for client ${request.clientId} (ID: ${executionId})`);

      // Return response with billing metrics
      return {
        ...response,
        metrics: {
          ...response.metrics,
          computeUnits,
          cost,
        },
      };
    } catch (error) {
      this.logger.error(`Error executing code: ${error.message}`, error.stack);

      // Update database record with error
      try {
        await this.prisma.codeExecutionUsage.update({
          where: { executionId },
          data: {
            error: {
              message: error.message,
              stack: error.stack,
              type: error.name,
            },
            executionTime: Date.now() - startTime,
            status: 'FAILED',
            completedAt: new Date(),
          },
        });
      } catch (dbError) {
        this.logger.error(`Failed to update execution record: ${dbError.message}`, dbError.stack);
      }

      // Return error response
      return {
        success: false,
        output: [],
        error: {
          message: error.message,
          stack: error.stack,
          type: error.name,
        },
        metrics: {
          executionTime: Date.now() - startTime,
          memoryUsage: 0,
          computeUnits: 0,
          cost: 0,
        },
      };
    }
  }

  /**
   * Determine the pricing tier based on request parameters
   */
  private determineTier(request: CodeExecutionRequest): CodeExecutionTier {
    const { timeout, memoryLimit, allowedModules } = request;

    // Default to BASIC tier
    let tier = CodeExecutionTier.BASIC;

    // Upgrade to STANDARD if needed
    if (
      (timeout && timeout > this.pricingTiers[CodeExecutionTier.BASIC].maxExecutionTime) ||
      (memoryLimit && memoryLimit > this.pricingTiers[CodeExecutionTier.BASIC].maxMemoryLimit) ||
      (allowedModules && allowedModules.some(module => !this.pricingTiers[CodeExecutionTier.BASIC].allowedModules.includes(module)))
    ) {
      tier = CodeExecutionTier.STANDARD;
    }

    // Upgrade to PREMIUM if needed
    if (
      (timeout && timeout > this.pricingTiers[CodeExecutionTier.STANDARD].maxExecutionTime) ||
      (memoryLimit && memoryLimit > this.pricingTiers[CodeExecutionTier.STANDARD].maxMemoryLimit) ||
      (allowedModules && allowedModules.some(module => !this.pricingTiers[CodeExecutionTier.STANDARD].allowedModules.includes(module)))
    ) {
      tier = CodeExecutionTier.PREMIUM;
    }

    return tier;
  }

  /**
   * Validate request against tier limits
   */
  private validateRequest(request: CodeExecutionRequest, pricing: CodeExecutionPricing): void {
    const { timeout, memoryLimit, allowedModules } = request;

    // Validate timeout
    if (timeout && timeout > pricing.maxExecutionTime) {
      throw new Error(`Execution timeout (${timeout}ms) exceeds maximum allowed (${pricing.maxExecutionTime}ms)`);
    }

    // Validate memory limit
    if (memoryLimit && memoryLimit > pricing.maxMemoryLimit) {
      throw new Error(`Memory limit (${memoryLimit} bytes) exceeds maximum allowed (${pricing.maxMemoryLimit} bytes)`);
    }

    // Validate allowed modules
    if (allowedModules) {
      const disallowedModules = allowedModules.filter(module => !pricing.allowedModules.includes(module));
      if (disallowedModules.length > 0) {
        throw new Error(`Disallowed modules: ${disallowedModules.join(', ')}`);
      }
    }
  }

  /**
   * Execute code in Cloudflare Worker
   */
  private async executeInCloudflareWorker(request: CodeExecutionRequest, executionId: string): Promise<CodeExecutionResponse> {
    try {
      // Set default values
      const timeout = request.timeout || 5000;
      const memoryLimit = request.memoryLimit || 50 * 1024 * 1024;
      const allowedModules = request.allowedModules || [];

      // Make request to Cloudflare Worker
      const response = await fetch(this.cloudflareWorkerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Execution-ID': executionId,
        },
        body: JSON.stringify({
          code: request.code,
          language: request.language,
          timeout,
          memoryLimit,
          allowedModules,
          context: request.context || {},
          clientId: request.clientId,
        }),
      });

      // Check for HTTP errors
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cloudflare Worker returned error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      // Parse response
      const result = await response.json();
      return result as CodeExecutionResponse;
    } catch (error) {
      this.logger.error(`Error executing code in Cloudflare Worker: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Calculate compute units based on execution time and memory usage
   */
  private calculateComputeUnits(executionTime: number, memoryUsage: number): number {
    // Convert execution time to seconds
    const executionTimeSeconds = executionTime / 1000;

    // Convert memory usage to MB
    const memoryUsageMB = memoryUsage / (1024 * 1024);

    // Calculate compute units
    // 1 compute unit = 1 second of execution time + 0.1 units per MB of memory
    return executionTimeSeconds + (memoryUsageMB * 0.1);
  }

  /**
   * Calculate cost based on execution time, memory usage, and tier
   */
  private calculateCost(executionTime: number, memoryUsage: number, tier: CodeExecutionTier): number {
    const pricing = this.pricingTiers[tier];

    // Convert execution time to seconds
    const executionTimeSeconds = executionTime / 1000;

    // Convert memory usage to MB
    const memoryUsageMB = memoryUsage / (1024 * 1024);

    // Calculate cost
    const timeCost = executionTimeSeconds * pricing.costPerSecond;
    const memoryCost = memoryUsageMB * pricing.costPerMB;

    return timeCost + memoryCost;
  }

  /**
   * Record usage for billing
   */
  private async recordUsage(usage: CodeExecutionUsageRecord): Promise<void> {
    try {
      // In a real implementation, this would store the usage record in a database
      this.logger.log(`Recording usage: ${JSON.stringify(usage)}`);

      // TODO: Implement actual storage of usage records
      // For now, just log it
    } catch (error) {
      this.logger.error(`Error recording usage: ${error.message}`, error.stack);
    }
  }

  /**
   * Get pricing information for all tiers
   */
  getPricingTiers(): Record<CodeExecutionTier, CodeExecutionPricing> {
    return this.pricingTiers;
  }

  /**
   * Create a collaborative code execution session
   * @param params Session creation parameters
   * @returns Created session
   */
  async createSession(params: any): Promise<any> {
    this.logger.log(`Creating collaborative session: ${params.name}`);
    return this.sessionService.createSession(params);
  }

  /**
   * Get a collaborative code execution session
   * @param sessionId Session ID
   * @returns Session
   */
  async getSession(sessionId: string): Promise<any> {
    this.logger.log(`Getting collaborative session: ${sessionId}`);
    return this.sessionService.getSession(sessionId);
  }

  /**
   * Update a collaborative code execution session
   * @param sessionId Session ID
   * @param data Update data
   * @returns Updated session
   */
  async updateSession(sessionId: string, data: any): Promise<any> {
    this.logger.log(`Updating collaborative session: ${sessionId}`);
    return this.sessionService.updateSession(sessionId, data);
  }

  /**
   * Delete a collaborative code execution session
   * @param sessionId Session ID
   * @returns Deleted session
   */
  async deleteSession(sessionId: string): Promise<any> {
    this.logger.log(`Deleting collaborative session: ${sessionId}`);
    return this.sessionService.deleteSession(sessionId);
  }

  /**
   * Get collaborative code execution sessions for a user
   * @param userId User ID
   * @returns Sessions
   */
  async getUserSessions(userId: string): Promise<any[]> {
    this.logger.log(`Getting collaborative sessions for user: ${userId}`);
    return this.sessionService.getUserSessions(userId);
  }

  /**
   * Get public collaborative code execution sessions
   * @returns Public sessions
   */
  async getPublicSessions(): Promise<any[]> {
    this.logger.log('Getting public collaborative sessions');
    return this.sessionService.getPublicSessions();
  }

  /**
   * Add a file to a collaborative code execution session
   * @param sessionId Session ID
   * @param file File to add
   * @returns Updated session
   */
  async addFileToSession(sessionId: string, file: any): Promise<any> {
    this.logger.log(`Adding file to collaborative session ${sessionId}: ${file.name}`);
    return this.sessionService.addFile(sessionId, file);
  }

  /**
   * Update a file in a collaborative code execution session
   * @param sessionId Session ID
   * @param fileId File ID
   * @param content New file content
   * @returns Updated session
   */
  async updateFileInSession(sessionId: string, fileId: string, content: string): Promise<any> {
    this.logger.log(`Updating file ${fileId} in collaborative session ${sessionId}`);
    return this.sessionService.updateFile(sessionId, fileId, content);
  }

  /**
   * Delete a file from a collaborative code execution session
   * @param sessionId Session ID
   * @param fileId File ID
   * @returns Updated session
   */
  async deleteFileFromSession(sessionId: string, fileId: string): Promise<any> {
    this.logger.log(`Deleting file ${fileId} from collaborative session ${sessionId}`);
    return this.sessionService.deleteFile(sessionId, fileId);
  }

  /**
   * Add a collaborator to a collaborative code execution session
   * @param sessionId Session ID
   * @param userId User ID
   * @returns Updated session
   */
  async addCollaboratorToSession(sessionId: string, userId: string): Promise<any> {
    this.logger.log(`Adding collaborator ${userId} to collaborative session ${sessionId}`);
    return this.sessionService.addCollaborator(sessionId, userId);
  }

  /**
   * Remove a collaborator from a collaborative code execution session
   * @param sessionId Session ID
   * @param userId User ID
   * @returns Updated session
   */
  async removeCollaboratorFromSession(sessionId: string, userId: string): Promise<any> {
    this.logger.log(`Removing collaborator ${userId} from collaborative session ${sessionId}`);
    return this.sessionService.removeCollaborator(sessionId, userId);
  }

  /**
   * Get usage records for a client
   */
  async getClientUsage(clientId: string, startDate?: Date, endDate?: Date): Promise<CodeExecutionUsageRecord[]> {
    this.logger.log(`Getting usage for client ${clientId}`);

    try {
      // Build query conditions
      const where: any = { clientId };

      if (startDate || endDate) {
        where.createdAt = {};

        if (startDate) {
          where.createdAt.gte = startDate;
        }

        if (endDate) {
          where.createdAt.lte = endDate;
        }
      }

      // Query database for usage records
      const records = await this.prisma.codeExecutionUsage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      // Transform database records to usage records
      return records.map(record => ({
        id: record.id,
        clientId: record.clientId,
        agentId: record.agentId,
        timestamp: record.createdAt.toISOString(),
        metrics: {
          executionTime: record.executionTime,
          memoryUsage: record.memoryUsage,
          computeUnits: record.computeUnits,
          cost: record.cost,
        },
        tier: record.tier as CodeExecutionTier,
        environment: record.environment as 'sandbox' | 'container' | 'serverless',
      }));
    } catch (error) {
      this.logger.error(`Error getting usage records: ${error.message}`, error.stack);
      throw new Error(`Failed to get usage records: ${error.message}`);
    }
  }

  /**
   * Get usage statistics for a client
   */
  async getClientUsageStats(clientId: string, startDate?: Date, endDate?: Date): Promise<any> {
    this.logger.log(`Getting usage statistics for client ${clientId}`);

    try {
      // Build query conditions
      const where: any = { clientId };

      if (startDate || endDate) {
        where.createdAt = {};

        if (startDate) {
          where.createdAt.gte = startDate;
        }

        if (endDate) {
          where.createdAt.lte = endDate;
        }
      }

      // Get aggregate statistics
      const stats = await this.prisma.codeExecutionUsage.aggregate({
        where,
        _count: { id: true },
        _sum: {
          executionTime: true,
          memoryUsage: true,
          computeUnits: true,
          cost: true,
        },
        _avg: {
          executionTime: true,
          memoryUsage: true,
          computeUnits: true,
          cost: true,
        },
        _max: {
          executionTime: true,
          memoryUsage: true,
          computeUnits: true,
          cost: true,
        },
      });

      // Get counts by language
      const languageCounts = await this.prisma.codeExecutionUsage.groupBy({
        by: ['language'],
        where,
        _count: { id: true },
      });

      // Get counts by tier
      const tierCounts = await this.prisma.codeExecutionUsage.groupBy({
        by: ['tier'],
        where,
        _count: { id: true },
        _sum: { cost: true },
      });

      // Get counts by status
      const statusCounts = await this.prisma.codeExecutionUsage.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      });

      return {
        totalExecutions: stats._count.id,
        totalCost: stats._sum.cost,
        totalComputeUnits: stats._sum.computeUnits,
        totalExecutionTime: stats._sum.executionTime,
        totalMemoryUsage: stats._sum.memoryUsage,
        averageExecutionTime: stats._avg.executionTime,
        averageMemoryUsage: stats._avg.memoryUsage,
        averageComputeUnits: stats._avg.computeUnits,
        averageCost: stats._avg.cost,
        maxExecutionTime: stats._max.executionTime,
        maxMemoryUsage: stats._max.memoryUsage,
        maxComputeUnits: stats._max.computeUnits,
        maxCost: stats._max.cost,
        languageCounts,
        tierCounts,
        statusCounts,
      };
    } catch (error) {
      this.logger.error(`Error getting usage statistics: ${error.message}`, error.stack);
      throw new Error(`Failed to get usage statistics: ${error.message}`);
    }
  }
}
