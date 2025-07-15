/**
 * Agent Authentication Guard
 * Protects routes that require agent-specific authentication
 * Handles both JWT tokens and agent-specific API keys
 */

import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AgentAuthGuard implements CanActivate {
  private readonly logger = new Logger(AgentAuthGuard.name);

  constructor(private readonly jwtService: JwtService) {}

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
    // In a real implementation, this would validate against a database
    // For now, we'll implement basic validation logic
    
    if (!apiKey || apiKey.length < 32) {
      throw new UnauthorizedException('Invalid agent API key format');
    }

    // TODO: Implement actual API key validation against database
    // This should check if the API key exists and is active
    
    // Mock validation for development
    if (apiKey.startsWith('agent_') && apiKey.length >= 32) {
      // Extract agent info from API key (in real implementation, query database)
      const agentId = apiKey.split('_')[1] || 'unknown';
      
      request.agent = {
        id: agentId,
        agencyId: 'default', // Would come from database
        capabilities: ['read', 'write'], // Would come from database
        permissions: ['agent:communicate'], // Would come from database
        apiKey: apiKey,
      };

      this.logger.debug(`Agent authenticated via API key: ${agentId}`);
      return true;
    }

    throw new UnauthorizedException('Invalid agent API key');
  }
}