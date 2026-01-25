import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginDto, RegisterDto } from '../dtos/auth.dto';
import { AuthGuard } from '../guards/auth.guard';
import { AuthService } from '../services/auth.service';

/**
 * Authentication Controller
 *
 * Handles all authentication-related endpoints including login, registration,
 * token refresh, logout, and user profile retrieval. This controller provides
 * secure authentication operations with appropriate guards per endpoint.
 *
 * Guard Strategy:
 * - Login, Register, Refresh: PUBLIC (no authentication required)
 * - Logout, Me: PROTECTED (requires authentication)
 *
 * Rate limiting is applied per endpoint based on security requirements:
 * - Public endpoints: Strict rate limiting to prevent abuse
 * - Protected endpoints: Standard rate limiting
 *
 * @security Mixed - Some endpoints are public, others require authentication
 *
 * @example
 * // Login example
 * POST /auth/login
 * {
 *   "email": "user@example.com",
 *   "password": "password123"
 * }
 *
 * @example
 * // Registration example
 * POST /auth/register
 * {
 *   "email": "newuser@example.com",
 *   "password": "securePassword123",
 *   "firstName": "John",
 *   "lastName": "Doe"
 * }
 *
 * @example
 * // Token refresh example
 * POST /auth/refresh
 * {
 *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  /**
   * Constructor for AuthController
   *
   * @param authService - The authentication service instance for handling business logic
   *
   * @example
   * const controller = new AuthController(authService);
   */
  constructor(private readonly authService: AuthService) {}

  /**
   * Authenticate user and generate JWT tokens
   *
   * Validates user credentials and returns access and refresh tokens on successful
   * authentication. This endpoint is PUBLIC but has strict rate limiting
   * to prevent brute force attacks.
   *
   * @param loginDto - Login credentials containing email and password
   * @param loginDto.email - User's email address (validated format)
   * @param loginDto.password - User's password (minimum 8 characters)
   *
   * @returns Promise containing authentication tokens and user information
   * @returns.accessToken - JWT access token for API authentication (expires in 15 minutes)
   * @returns.refreshToken - JWT refresh token for obtaining new access tokens (expires in 7 days)
   * @returns.user - User object with non-sensitive information
   * @returns.expiresIn - Token expiration time in seconds
   *
   * @throws BadRequestException - When login credentials are invalid
   * @throws UnauthorizedException - When account is locked or suspended
   * @throws TooManyRequestsException - When rate limit is exceeded
   *
   * @security PUBLIC - No authentication required
   * @rateLimiting Strict rate limiting applied
   *
   * @api
   * POST /auth/login
   *
   * @example
   * const response = await authController.login({
   *   email: 'user@example.com',
   *   password: 'password123'
   * });
   *
   * @example
   * // Successful response
   * {
   *   "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   *   "user": {
   *     "id": "123e4567-e89b-12d3-a456-426614174000",
   *     "email": "user@example.com",
   *     "firstName": "John",
   *     "lastName": "Doe",
   *     "role": "user"
   *   },
   *   "expiresIn": 900
   * }
   */
  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * Register a new user account
   *
   * Creates a new user account with the provided credentials and returns
   * authentication tokens for immediate login. User account is created
   * with a default role and email verification may be required.
   *
   * @param registerDto - Registration data containing user information
   * @param registerDto.email - Unique email address for the new account
   * @param registerDto.password - Strong password (min 8 chars, mixed case, numbers, special chars)
   * @param registerDto.firstName - User's first name (2-50 characters)
   * @param registerDto.lastName - User's last name (2-50 characters)
   * @param registerDto.phone - Optional phone number (E.164 format)
   *
   * @returns Promise containing authentication tokens and new user information
   * @returns.accessToken - JWT access token for API authentication
   * @returns.refreshToken - JWT refresh token for token refresh
   * @returns.user - Newly created user object
   * @returns.message - Registration success message
   *
   * @throws BadRequestException - When registration data is invalid or email already exists
   * @throws ConflictException - When email address is already registered
   * @throws TooManyRequestsException - When rate limit is exceeded
   *
   * @security PUBLIC - No authentication required
   * @rateLimiting Moderate rate limiting applied
   *
   * @api
   * POST /auth/register
   *
   * @example
   * const response = await authController.register({
   *   email: 'newuser@example.com',
   *   password: 'SecurePass123!',
   *   firstName: 'Jane',
   *   lastName: 'Smith',
   *   phone: '+1234567890'
   * });
   *
   * @example
   * // Successful response
   * {
   *   "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   *   "user": {
   *     "id": "123e4567-e89b-12d3-a456-426614174001",
   *     "email": "newuser@example.com",
   *     "firstName": "Jane",
   *     "lastName": "Smith",
   *     "role": "user",
   *     "emailVerified": false
   *   },
   *   "message": "Account created successfully"
   * }
   */
  @Post('register')
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * Refresh authentication token
   *
   * Validates the provided refresh token and issues a new access token.
   * This endpoint allows users to obtain new access tokens without
   * re-authenticating with their credentials.
   *
   * @param refreshToken - Valid refresh token string
   *
   * @returns Promise containing new access token and user information
   * @returns.accessToken - New JWT access token
   * @returns.refreshToken - New refresh token (rotation for security)
   * @returns.user - Current user information
   * @returns.expiresIn - New token expiration time in seconds
   *
   * @throws UnauthorizedException - When refresh token is invalid or expired
   * @throws ForbiddenException - When refresh token has been revoked
   * @throws TooManyRequestsException - When rate limit is exceeded
   *
   * @security PUBLIC - No authentication required (refresh token validated)
   * @rateLimiting Standard rate limiting applied
   *
   * @api
   * POST /auth/refresh
   *
   * @example
   * const response = await authController.refresh('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
   *
   * @example
   * // Successful response
   * {
   *   "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   *   "user": {
   *     "id": "123e4567-e89b-12d3-a456-426614174000",
   *     "email": "user@example.com",
   *     "firstName": "John",
   *     "lastName": "Doe",
   *     "role": "user"
   *   },
   *   "expiresIn": 900
   * }
   */
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  /**
   * Logout current user
   *
   * Invalidates the current user's access and refresh tokens, effectively
   * logging them out of the application. This endpoint requires authentication
   * and uses the standard AuthGuard.
   *
   * @returns Promise containing logout confirmation
   * @returns.message - Logout success message
   * @returns.timestamp - Logout timestamp
   *
   * @throws UnauthorizedException - When user is not authenticated
   * @throws InternalServerErrorException - When logout operation fails
   *
   * @api
   * POST /auth/logout
   * @requiresAuth - Bearer token in Authorization header
   *
   * @example
   * const response = await authController.logout();
   *
   * @example
   * // Successful response
   * {
   *   "message": "Successfully logged out",
   *   "timestamp": "2025-11-05T02:17:55.000Z"
   * }
   */
  @Post('logout')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout() {
    return this.authService.logout();
  }

  /**
   * Get current user information
   *
   * Returns the authenticated user's profile information. This endpoint
   * requires a valid access token and is commonly used to check if a user
   * is logged in and to get their current profile data.
   *
   * @returns Promise containing current user information
   * @returns.id - Unique user identifier
   * @returns.email - User's email address
   * @returns.firstName - User's first name
   * @returns.lastName - User's last name
   * @returns.role - User's role in the system
   * @returns.emailVerified - Whether email has been verified
   * @returns.createdAt - Account creation timestamp
   * @returns.lastLogin - Last login timestamp
   *
   * @throws UnauthorizedException - When user is not authenticated
   * @throws NotFoundException - When user account is not found
   *
   * @api
   * GET /auth/me
   * @requiresAuth - Bearer token in Authorization header
   *
   * @example
   * const user = await authController.me();
   *
   * @example
   * // Successful response
   * {
   *   "id": "123e4567-e89b-12d3-a456-426614174000",
   *   "email": "user@example.com",
   *   "firstName": "John",
   *   "lastName": "Doe",
   *   "role": "user",
   *   "emailVerified": true,
   *   "createdAt": "2025-01-01T00:00:00.000Z",
   *   "lastLogin": "2025-11-05T02:17:55.000Z"
   * }
   */
  @Get('me')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'Return current user' })
  async me(@Request() req: any) {
    // User is attached to request by AuthGuard
    return req.user;
  }
}
