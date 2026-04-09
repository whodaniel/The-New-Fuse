/**
 * JWT Strategy for NestJS authentication
 */

import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    private authService: AuthService
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment configuration');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /**
   * Validate JWT payload and return user
   * @param payload JWT payload
   * @returns User object that will be attached to request
   */
  async validate(payload: any): Promise<any> {
    try {
      this.logger.debug(`Validating JWT payload for user: ${payload.sub}`);

      // Validate the payload and get user
      const user = await this.authService.validateTokenPayload(payload);

      if (!user) {
        throw new UnauthorizedException('Invalid token payload');
      }

      return {
        id: payload.sub,
        username: payload.username,
        email: payload.email,
        roles: payload.roles || ['USER'],
      };
    } catch (error) {
      this.logger.error(
        `JWT validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw new UnauthorizedException('Invalid token');
    }
  }
}
