/**
 * Agent Authentication Guard
 * Protects routes that require agent-specific authentication
 * Handles both JWT tokens and agent-specific API keys
 */

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '@the-new-fuse/database';

@Injectable()
export class AgentAuthGuard implements CanActivate {
  private readonly logger = new Logger(AgentAuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly db: DatabaseService
  ) {}

  /**
   * Determines if the current request is authorized for agent access
   * @param context Execution context
   * @returns Promise<boolean> indicating if request is authorized
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    try {
      // Try to authenticate with JWT token first
      const token = this.extractTokenFromHeader(request);
      if (token) {
        return await this.validateJwtToken(token, request);
      }

      // Try to authenticate with agent API key
      const apiKey = this.extractApiKeyFromHeader(request);
      if (apiKey) {
        return await this.validateAgentApiKey(apiKey, request);
      }

      // No valid authentication method found
      this.logger.debug('No valid authentication credentials found');
      throw new UnauthorizedException('Agent authentication required');
    } catch (error) {
      this.logger.debug(`Agent authentication failed: ${(error as Error).message}`);
      throw new UnauthorizedException(`Agent authentication failed: ${(error as Error).message}`);
    }
  }

  /**
   * Extract JWT token from Authorization header
   * @param request HTTP request object
   * @returns string | null
   */
  private extractTokenFromHeader(request: any): string | null {
    const authorization = request.headers.authorization;
    if (!authorization) return null;

    const [type, token] = authorization.split(' ');
    return type === 'Bearer' ? token : null;
  }

  /**
   * Extract API key from X-Agent-API-Key header
   * @param request HTTP request object
   * @returns string | null
   */
  private extractApiKeyFromHeader(request: any): string | null {
    return request.headers['x-agent-api-key'] || request.headers['x-api-key'] || null;
  }

  /**
   * Validate JWT token and extract agent information
   * @param token JWT token
   * @param request HTTP request object
   * @returns Promise<boolean>
   */
  private async validateJwtToken(token: string, request: any): Promise<boolean> {
    try {
      const payload = await this.jwtService.verifyAsync(token);

      // Ensure this is an agent token
      if (!payload.agentId || payload.type !== 'agent') {
        throw new UnauthorizedException('Invalid agent token');
      }

      // Attach agent information to request
      request.agent = {
        id: payload.agentId,
        agencyId: payload.agencyId,
        capabilities: payload.capabilities || [],
        permissions: payload.permissions || [],
      };

      this.logger.debug(`Agent authenticated via JWT: ${payload.agentId}`);
      return true;
    } catch (_error) {
      throw new UnauthorizedException('Invalid or expired agent token');
    }
  }

  /**
   * Validate agent API key
   * @param apiKey Agent API key
   * @param request HTTP request object
   * @returns Promise<boolean>
   */
  private async validateAgentApiKey(apiKey: string, request: any): Promise<boolean> {
    if (!apiKey || apiKey.length < 32) {
      throw new UnauthorizedException('Invalid agent API key format');
    }

    try {
      // Check if the API key exists in agent registrations
      const registration = await this.db.agents.findRegistrationByToken(apiKey);

      if (!registration) {
        this.logger.warn(`Invalid API key attempt: ${apiKey.substring(0, 8)}...`);
        throw new UnauthorizedException('Invalid agent API key');
      }

      // Fetch the associated agent to ensure it exists and get details
      const agent = await this.db.agents.findByIdSystem(registration.agentId);

      if (!agent) {
        this.logger.error(`Orphaned registration found for agentId: ${registration.agentId}`);
        throw new UnauthorizedException('Agent not found');
      }

      // Check if agent is active (optional, but recommended based on task description)
      // We allow 'ACTIVE' and potentially other non-disabled statuses.
      // For now, if the agent exists and has a registration, we consider it valid.
      // Removed checks for SUSPENDED/ARCHIVED as they are not valid AgentStatus values.
      if (agent.status === 'INACTIVE' || agent.status === 'TERMINATED') {
        throw new UnauthorizedException('Agent is not active');
      }

      request.agent = {
        id: agent.id,
        agencyId: agent.userId, // Using userId as agencyId for now
        capabilities: (agent.capabilities as string[]) || [],
        permissions: ['agent:communicate'], // Default permission, could be expanded later
        apiKey: apiKey,
      };

      this.logger.debug(`Agent authenticated via API key: ${agent.id}`);
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Database error during API key validation: ${(error as Error).message}`);
      throw new UnauthorizedException('Authentication service unavailable');
    }
  }
}
