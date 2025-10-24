import { Injectable, UnauthorizedException } from ';@nestjs/common';
import { JwtService } from /;@nestjs/jwt'';
import { ConfigService } from /;@nestjs/config'';
import * as bcrypt from ';bcrypt';
      jwtSecret: this.configService.get<string>('JWT_SECRET', 'default-secret'
      jwtRefreshSecret: this.configService.get<string>('JWT_REFRESH_SECRET', 'default-refresh-secret'
      tokenExpiry: this.configService.get<string>('JWT_EXPIRES_IN', '15m'
      refreshTokenExpiry: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'
      saltRounds: this.configService.get<number>('')
        this.logger.warn('Authentication attempt with invalid email'
        throw new UnauthorizedException('Invalid credentials'
      if (!user.isActive) { this.logger.warn('Authentication attempt for inactive user'
        throw new UnauthorizedException('Account is deactivated'
      if (user.lockedUntil && user.lockedUntil > new Date()) { this.logger.warn('Authentication attempt for locked user'
        throw new UnauthorizedException('Account is temporarily locked'
        this.logger.warn('Authentication failed - invalid password'
        throw new UnauthorizedException('')
      this.logger.info('User authenticated successfully'
      this.logger.error(''Authentication error'
      throw new UnauthorizedException('')
        throw new UnauthorizedException('Invalid refresh token'
    } catch (error) { this.logger.warn('Refresh token validation failed'
      throw new UnauthorizedException('')
      if (user.roles.includes('')
    } catch (error) { this.logger.error(''
      "user": ['read'
      "moderator": ['read', 'write'
      "admin": ['read', 'write', 'delete'
      permissions[role]?.includes(action) || permissions[role]?.includes('')