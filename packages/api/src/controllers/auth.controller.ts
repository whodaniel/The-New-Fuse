/**
 * Authentication Controller
 * Handles user authentication endpoints including login, register, logout, and token refresh
 */
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { drizzleUserRepository } from '@the-new-fuse/database';
import * as bcrypt from 'bcrypt';
import { CurrentUser } from '../modules/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../modules/guards/jwt-auth.guard.js';

/**
 * Login request DTO
 */
export class LoginDto {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Register request DTO
 */
export class RegisterDto {
  email: string;
  password: string;
  name?: string;
  username?: string;
}

/**
 * Refresh token request DTO
 */
export class RefreshTokenDto {
  refreshToken: string;
}

/**
 * Auth response DTO
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn: string;
  user: {
    id: string;
    email: string;
    username?: string;
    name?: string;
    roles: string[];
  };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  /**
   * Login endpoint
   * Authenticates user and returns JWT tokens
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    this.logger.debug(`Login attempt for email: ${loginDto.email}`);

    try {
      // Find user by email
      const user = await drizzleUserRepository.findByEmail(loginDto.email);

      if (!user) {
        this.logger.warn(`Login failed: User not found for email: ${loginDto.email}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if user is active
      if (!user.isActive) {
        this.logger.warn(`Login failed: User account is inactive: ${loginDto.email}`);
        throw new UnauthorizedException('Account is inactive');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(loginDto.password, user.hashedPassword);

      if (!isPasswordValid) {
        this.logger.warn(`Login failed: Invalid password for email: ${loginDto.email}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      // Update last login
      await drizzleUserRepository.updateLastLogin(user.id);

      // Generate tokens
      const tokens = await this.generateTokens(user);

      this.logger.debug(`Login successful for user: ${user.id}`);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenType: 'Bearer',
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '24h'),
        user: {
          id: user.id,
          email: user.email,
          username: user.username || undefined,
          name: user.name || undefined,
          roles: user.roles || ['USER'],
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Login error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new UnauthorizedException('Authentication failed');
    }
  }

  /**
   * Register endpoint
   * Creates a new user account
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  @ApiResponse({ status: 400, description: 'Invalid data or email already exists' })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    this.logger.debug(`Registration attempt for email: ${registerDto.email}`);

    try {
      // Check if user already exists
      const existingUser = await drizzleUserRepository.findByEmail(registerDto.email);

      if (existingUser) {
        throw new BadRequestException('Email already registered');
      }

      // Check username if provided
      if (registerDto.username) {
        const existingUsername = await drizzleUserRepository.findByUsername(registerDto.username);
        if (existingUsername) {
          throw new BadRequestException('Username already taken');
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      // Create user
      const user = await drizzleUserRepository.create({
        email: registerDto.email,
        hashedPassword,
      } as any);

      // Generate tokens
      const tokens = await this.generateTokens(user);

      this.logger.debug(`Registration successful for user: ${user.id}`);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenType: 'Bearer',
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '24h'),
        user: {
          id: user.id,
          email: user.email,
          username: user.username || undefined,
          name: user.name || undefined,
          roles: user.roles || ['USER'],
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Registration error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw new BadRequestException('Registration failed');
    }
  }

  /**
   * Logout endpoint
   * Invalidates the user's refresh token
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@CurrentUser() user: any): Promise<{ message: string }> {
    this.logger.debug(`Logout for user: ${user.id}`);

    try {
      // Clear refresh token
      await drizzleUserRepository.updateRefreshToken(user.id, null);

      // Delete all sessions
      await drizzleUserRepository.deleteAllSessions(user.id);

      return { message: 'Logged out successfully' };
    } catch (error) {
      this.logger.error(
        `Logout error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return { message: 'Logged out successfully' };
    }
  }

  /**
   * Refresh token endpoint
   * Generates new access token using refresh token
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthResponse> {
    this.logger.debug('Token refresh attempt');

    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshTokenDto.refreshToken, {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ||
          this.configService.get<string>('JWT_SECRET'),
      });

      // Find user
      const user = await drizzleUserRepository.findById(payload.sub);

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenType: 'Bearer',
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '24h'),
        user: {
          id: user.id,
          email: user.email,
          username: user.username || undefined,
          name: user.name || undefined,
          roles: user.roles || ['USER'],
        },
      };
    } catch (error) {
      this.logger.error(
        `Token refresh error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Get current user endpoint
   * Returns the authenticated user's profile
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'User profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(@CurrentUser() user: any): Promise<any> {
    const fullUser = await drizzleUserRepository.findById(user.id);

    if (!fullUser) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: fullUser.id,
      email: fullUser.email,
      username: fullUser.username,
      name: fullUser.name,
      roles: fullUser.roles || ['USER'],
      emailVerified: fullUser.emailVerified,
      lastLogin: fullUser.lastLogin,
      createdAt: fullUser.createdAt,
    };
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(user: any): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      roles: user.roles || ['USER'],
    };

    const accessToken = this.jwtService.sign(
      payload as any,
      {
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '24h'),
      } as any
    );

    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' } as any,
      {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ||
          this.configService.get<string>('JWT_SECRET'),
        expiresIn: '30d',
      } as any
    );

    // Store refresh token
    await drizzleUserRepository.updateRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken };
  }
}
