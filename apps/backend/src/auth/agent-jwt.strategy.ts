/**
 * Agent JWT Strategy
 * 
 * This strategy handles JWT authentication specifically for AI agents
 * in The New Fuse multi-agent communication system.
 * 
 * Agents use a different authentication flow than regular users,
 * with special claims and validation requirements.
 */

import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AuthService } from './auth.service';

export interface AgentJwtPayload {
  sub: string;           // Agent ID
  agentId: string;       // Agent identifier
  agentType: string;     // Agent type (e.g., 'conversational', 'task-automation')
  capabilities: string[]; // Agent capabilities
  permissions: string[]; // Agent permissions
  iat: number;          // Issued at
  exp: number;          // Expires at
  issuer: string;       // Token issuer (typically 'the-new-fuse')
  audience: string;     // Token audience
}

/**
 * Agent authentication result interface
 */
export interface AuthenticatedAgent {
  id: string;
  type: string;
  capabilities: string[];
  permissions: string[];
  sub: string;
  iat: number;
  exp: number;
}

@Injectable()
export class AgentJwtStrategy extends PassportStrategy(Strategy, 'agent-jwt') {
  private readonly logger = new Logger(AgentJwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_AGENT_SECRET', configService.get<string>('JWT_SECRET')),
      audience: configService.get<string>('JWT_AUDIENCE', 'the-new-fuse'),
      issuer: configService.get<string>('JWT_ISSUER', 'the-new-fuse'),
    });
  }

  /**
   * Validate agent JWT payload
   * @param payload The decoded JWT payload
   * @returns Validated agent information
   */
  async validate(payload: AgentJwtPayload): Promise<AuthenticatedAgent> {
    try {
      this.logger.debug(`Validating agent JWT for agent: ${payload.agentId}`);

      // Validate required fields
      if (!payload.sub || !payload.agentId || !payload.agentType) {
        this.logger.warn('Invalid agent JWT payload: missing required fields');
        throw new UnauthorizedException('Invalid agent token: missing required fields');
      }

      // Validate agent ID matches sub
      if (payload.sub !== payload.agentId) {
        this.logger.warn(`Agent ID mismatch: sub=${payload.sub}, agentId=${payload.agentId}`);
        throw new UnauthorizedException('Invalid agent token: ID mismatch');
      }

      // Validate issuer and audience
      if (payload.issuer && payload.issuer !== this.configService.get<string>('JWT_ISSUER', 'the-new-fuse')) {
        this.logger.warn(`Invalid token issuer: ${payload.issuer}`);
        throw new UnauthorizedException('Invalid agent token: wrong issuer');
      }

      if (payload.audience && payload.audience !== this.configService.get<string>('JWT_AUDIENCE', 'the-new-fuse')) {
        this.logger.warn(`Invalid token audience: ${payload.audience}`);
        throw new UnauthorizedException('Invalid agent token: wrong audience');
      }

      // Validate agent exists and is active (if auth service provides this)
      if (this.authService.validateAgent) {
        const isValidAgent = await this.authService.validateAgent(payload.agentId);
        if (!isValidAgent) {
          this.logger.warn(`Agent validation failed for: ${payload.agentId}`);
          throw new UnauthorizedException('Agent not found or inactive');
        }
      }

      // Return agent information for use in request context
      const agentInfo = {
        id: payload.agentId,
        type: payload.agentType,
        capabilities: payload.capabilities || [],
        permissions: payload.permissions || [],
        sub: payload.sub,
        iat: payload.iat,
        exp: payload.exp,
      };

      this.logger.debug(`Agent authenticated successfully: ${payload.agentId}`);
      return agentInfo;

    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      this.logger.error(`Agent JWT validation error: ${(error as Error).message}`, error.stack);
      throw new UnauthorizedException('Agent authentication failed');
    }
  }

  /**
   * Extract agent token from custom header (alternative to Authorization header)
   * This method can be used if agents use a different header format
   */
  static extractAgentTokenFromHeader(req: Request): string | null {
    const agentHeader = req.headers['x-agent-authorization'];
    if (agentHeader && typeof agentHeader === 'string') {
      const [type, token] = agentHeader.split(' ');
      return type === 'Bearer' ? token : null;
    }
    return null;
  }

  /**
   * Alternative strategy configuration for custom token extraction
   */
  static createWithCustomExtractor() {
    return class extends AgentJwtStrategy {
      constructor(configService: ConfigService, authService: AuthService) {
        super(configService, authService);
        // Override the token extraction to support both standard and custom headers
        this.jwtFromRequest = ExtractJwt.fromExtractors([
          ExtractJwt.fromAuthHeaderAsBearerToken(),
          AgentJwtStrategy.extractAgentTokenFromHeader,
        ]);
      }
    };
  }
}