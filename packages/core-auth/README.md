# @the-new-fuse/core-auth

Comprehensive authentication and authorization system for The New Fuse. Provides JWT-based authentication, OAuth integration (Google, GitHub), and session management with NestJS.

## Overview

The core-auth package is a production-ready authentication module built with NestJS, providing complete authentication flows including registration, login, password reset, email verification, and OAuth integration. It integrates seamlessly with The New Fuse ecosystem and Prisma database.

## Features

- **JWT Authentication**: Secure token-based authentication with access and refresh tokens
- **OAuth Strategies**: Google and GitHub OAuth 2.0 integration
- **User Registration**: Complete registration flow with email validation
- **Login System**: Secure login with bcrypt password hashing
- **Password Reset**: Token-based password reset functionality
- **Email Verification**: Email verification with secure tokens
- **Refresh Tokens**: Long-lived refresh tokens for extended sessions
- **Guards**: Pre-built authentication guards for NestJS
- **Strategies**: Passport.js strategies for JWT and OAuth
- **Type Safety**: Full TypeScript support with comprehensive types
- **Prisma Integration**: Works seamlessly with @the-new-fuse/database

## Installation

```bash
npm install @the-new-fuse/core-auth
# or
pnpm add @the-new-fuse/core-auth
```

## Quick Start

### 1. Import the Module

```typescript
import { Module } from '@nestjs/common';
import { AuthModule } from '@the-new-fuse/core-auth';

@Module({
  imports: [
    AuthModule,
    // ... other modules
  ],
})
export class AppModule {}
```

### 2. Environment Variables

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_REFRESH_EXPIRATION=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback
```

### 3. Use the Service

```typescript
import { Injectable } from '@nestjs/common';
import { AuthService } from '@the-new-fuse/core-auth';

@Injectable()
export class UserService {
  constructor(private readonly authService: AuthService) {}

  async registerUser(email: string, password: string, name?: string) {
    return await this.authService.register({
      email,
      password,
      name,
    });
  }

  async loginUser(email: string, password: string) {
    return await this.authService.login({
      email,
      password,
    });
  }
}
```

### 4. Protect Routes with Guards

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@the-new-fuse/core-auth';

@Controller('protected')
export class ProtectedController {
  @Get()
  @UseGuards(JwtAuthGuard)
  getProtectedData() {
    return { message: 'This is protected data' };
  }
}
```

## API Reference

### AuthService

#### register(registerDto: RegisterDto): Promise<AuthResponse>

Register a new user with email and password.

```typescript
const result = await authService.register({
  email: 'user@example.com',
  password: 'SecurePass123!',
  name: 'John Doe',
});

// Returns: AuthResponse
{
  access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  user: {
    id: 'user-uuid',
    email: 'user@example.com',
    name: 'John Doe',
    emailVerified: null
  }
}
```

#### login(loginDto: LoginDto): Promise<AuthResponse>

Authenticate user with email and password.

```typescript
const result = await authService.login({
  email: 'user@example.com',
  password: 'SecurePass123!',
});

// Returns: AuthResponse (same structure as register)
```

#### refreshTokens(refreshToken: string): Promise<AuthResponse>

Refresh access token using refresh token.

```typescript
const result = await authService.refreshTokens(refreshToken);

// Returns: New access_token and refresh_token
```

#### requestPasswordReset(email: string): Promise<void>

Request password reset email for user.

```typescript
await authService.requestPasswordReset('user@example.com');

// Sends password reset email with token
// In production, integrate with email service
```

#### resetPassword(token: string, newPassword: string): Promise<void>

Reset password using reset token.

```typescript
await authService.resetPassword(
  'reset-token-from-email',
  'NewSecurePass123!'
);
```

#### sendVerificationEmail(email: string): Promise<void>

Send email verification link to user.

```typescript
await authService.sendVerificationEmail('user@example.com');

// Sends verification email with token
```

#### verifyEmail(token: string): Promise<void>

Verify user email with verification token.

```typescript
await authService.verifyEmail('verification-token-from-email');
```

#### validateUser(userId: string): Promise<User | null>

Validate and retrieve user by ID.

```typescript
const user = await authService.validateUser('user-uuid');
```

## Authentication Strategies

### JWT Strategy

Token-based authentication for API requests.

```typescript
import { JwtStrategy } from '@the-new-fuse/core-auth';

// Automatically validates JWT tokens
// Extracts user payload from token
// Attaches user to request object
```

### Google OAuth Strategy

```typescript
import { GoogleStrategy } from '@the-new-fuse/core-auth';

// Handles Google OAuth 2.0 flow
// Redirects to Google login
// Handles callback with user profile
```

### GitHub OAuth Strategy

```typescript
import { GithubStrategy } from '@the-new-fuse/core-auth';

// Handles GitHub OAuth 2.0 flow
// Redirects to GitHub login
// Handles callback with user profile
```

## Guards

### JwtAuthGuard

Protects routes requiring authentication.

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@the-new-fuse/core-auth';

@Controller('users')
@UseGuards(JwtAuthGuard) // Applies to all routes in controller
export class UsersController {
  @Get('profile')
  getProfile(@Request() req) {
    return req.user; // User from JWT payload
  }
}
```

## Types and Interfaces

### LoginDto

```typescript
interface LoginDto {
  email: string;
  password: string;
}
```

### RegisterDto

```typescript
interface RegisterDto {
  email: string;
  password: string;
  name?: string;
}
```

### AuthResponse

```typescript
interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    name?: string;
    emailVerified: boolean | Date | null;
  };
}
```

### RefreshTokenDto

```typescript
interface RefreshTokenDto {
  refreshToken: string;
}
```

### JwtPayload

```typescript
interface JwtPayload {
  sub: string; // User ID
  email: string;
  iat?: number; // Issued at
  exp?: number; // Expiration
}
```

## Usage Examples

### Complete Registration Flow

```typescript
import { AuthService } from '@the-new-fuse/core-auth';

@Injectable()
export class OnboardingService {
  constructor(private authService: AuthService) {}

  async onboardNewUser(userData: RegisterDto) {
    // 1. Register user
    const authResponse = await this.authService.register(userData);

    // 2. Send verification email
    await this.authService.sendVerificationEmail(userData.email);

    // 3. Return tokens
    return authResponse;
  }
}
```

### Password Reset Flow

```typescript
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    await this.authService.requestPasswordReset(email);
    return { message: 'Password reset email sent' };
  }

  @Post('reset-password')
  async resetPassword(
    @Body('token') token: string,
    @Body('password') password: string
  ) {
    await this.authService.resetPassword(token, password);
    return { message: 'Password reset successful' };
  }
}
```

### Email Verification Flow

```typescript
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('resend-verification')
  async resendVerification(@Body('email') email: string) {
    await this.authService.sendVerificationEmail(email);
    return { message: 'Verification email sent' };
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    await this.authService.verifyEmail(token);
    return { message: 'Email verified successfully' };
  }
}
```

### OAuth Integration

```typescript
@Controller('auth')
export class AuthController {
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleCallback(@Req() req) {
    // Google redirects here with user info
    return req.user;
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  githubLogin() {
    // Initiates GitHub OAuth flow
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  githubCallback(@Req() req) {
    // GitHub redirects here with user info
    return req.user;
  }
}
```

### Refresh Token Flow

```typescript
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('refresh')
  async refreshTokens(@Body() dto: RefreshTokenDto) {
    return await this.authService.refreshTokens(dto.refreshToken);
  }
}
```

### Custom Decorators

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

// Usage
@Controller('profile')
export class ProfileController {
  @Get()
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: JwtPayload) {
    return user;
  }
}
```

## Integration with The New Fuse Ecosystem

### Database Integration

```typescript
// Uses @the-new-fuse/database PrismaService
import { PrismaService } from '@the-new-fuse/database';

// AuthService automatically integrates with Prisma
// No additional configuration needed
```

### Error Handling

```typescript
// Uses @tnf/core-error-handling
import { AuthenticationError, TokenExpiredError } from '@tnf/core-error-handling';

// Automatically throws appropriate errors
try {
  await authService.login({ email, password });
} catch (error) {
  if (error instanceof AuthenticationError) {
    // Handle authentication error
  }
}
```

### Logging

```typescript
// Uses Winston logger from @the-new-fuse/core
import { logger } from '@the-new-fuse/core';

// AuthService logs important events:
// - User registration
// - Login attempts
// - Password resets
// - Email verifications
```

## Security Best Practices

### Password Hashing

```typescript
// Uses bcrypt with configurable salt rounds
const saltRounds = 10; // Default

// Passwords are automatically hashed before storage
// Never stored in plain text
```

### Token Security

```typescript
// Access tokens: Short-lived (15 minutes)
// Refresh tokens: Long-lived (7 days)
// Both use strong secrets (256-bit recommended)

// Rotate refresh tokens on each use
// Invalidate tokens on password change
```

### Rate Limiting

```typescript
// Recommended: Add rate limiting to auth endpoints
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10, // 10 requests per minute
    }),
  ],
})
export class AuthModule {}
```

### CORS Configuration

```typescript
// Configure CORS for OAuth callbacks
import { NestFactory } from '@nestjs/core';

const app = await NestFactory.create(AppModule);
app.enableCors({
  origin: ['http://localhost:3000', 'https://yourdomain.com'],
  credentials: true,
});
```

## Configuration

### JWT Configuration

```typescript
// config/jwt.config.ts
export const jwtConfig = {
  secret: process.env.JWT_SECRET,
  signOptions: {
    expiresIn: process.env.JWT_EXPIRATION || '15m',
  },
};

export const jwtRefreshConfig = {
  secret: process.env.JWT_REFRESH_SECRET,
  signOptions: {
    expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
};
```

### OAuth Configuration

```typescript
// Google OAuth
export const googleConfig = {
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
  scope: ['email', 'profile'],
};

// GitHub OAuth
export const githubConfig = {
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.GITHUB_CALLBACK_URL,
  scope: ['user:email'],
};
```

## Testing

### Unit Tests

```typescript
import { Test } from '@nestjs/testing';
import { AuthService } from '@the-new-fuse/core-auth';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AuthService, PrismaService, JwtService],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('should register a new user', async () => {
    const result = await authService.register({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result).toHaveProperty('access_token');
    expect(result).toHaveProperty('refresh_token');
    expect(result.user.email).toBe('test@example.com');
  });
});
```

### Integration Tests

```typescript
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Setup test app
  });

  it('/auth/register (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('access_token');
      });
  });
});
```

## Troubleshooting

### Common Issues

**JWT_SECRET not set**
```bash
Error: JWT_SECRET is required
Solution: Set JWT_SECRET in .env file
```

**Token expired**
```typescript
// Increase token expiration time
JWT_EXPIRATION=30m
```

**OAuth callback fails**
```bash
# Ensure callback URLs match exactly
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
# Must match Google Console configuration
```

**Password reset token invalid**
```typescript
// Tokens expire after 1 hour
// Request new reset token if expired
```

## Architecture

```
packages/core-auth/
├── src/
│   ├── auth.module.ts           # Main auth module
│   ├── auth.service.ts          # Auth service with business logic
│   ├── auth.controller.ts       # Auth endpoints
│   ├── jwt-auth.guard.ts        # JWT authentication guard
│   ├── jwt.strategy.ts          # JWT Passport strategy
│   ├── strategies/
│   │   ├── google.strategy.ts   # Google OAuth strategy
│   │   ├── github.strategy.ts   # GitHub OAuth strategy
│   │   └── jwt.strategy.ts      # JWT strategy
│   ├── __tests__/               # Unit tests
│   └── index.ts                 # Exports
└── README.md
```

## Dependencies

This package depends on:
- `@nestjs/common` - NestJS core
- `@nestjs/jwt` - JWT utilities
- `@nestjs/passport` - Passport integration
- `passport` - Authentication middleware
- `passport-jwt` - JWT strategy
- `passport-google-oauth20` - Google OAuth
- `passport-github2` - GitHub OAuth
- `bcrypt` - Password hashing
- `@the-new-fuse/database` - Prisma integration

## License

MIT

## Contributing

Contributions are welcome! Please follow our contributing guidelines.

## Support

For issues and questions:
- Open an issue on GitHub
- Check the documentation
- Contact the maintainers

## Related Packages

- `@the-new-fuse/database` - Prisma database client
- `@tnf/core-error-handling` - Error handling utilities
- `@the-new-fuse/core` - Core functionality
- `@the-new-fuse/api` - REST API implementation
