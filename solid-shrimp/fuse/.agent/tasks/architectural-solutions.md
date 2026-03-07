# The New Fuse - Architectural Solutions for Critical Issues

**Date**: 2025-12-29 **Author**: Architect Agent **Status**: Production-Ready
Design

---

## Executive Summary

This document provides production-ready architectural solutions for four
critical issues identified in The New Fuse codebase:

1. **Hardcoded JWT Secrets** (Critical) - 6 files affected
2. **Missing Input Validation** (Critical) - Multiple controllers
3. **N+1 Query Patterns** (High) - chat-rooms.service.ts,
   mass-orchestration.service.ts
4. **Race Conditions in Job Polling** (High) - mass-orchestration.service.ts

Each solution includes architectural diagrams, implementation strategies, file
changes, and testing approaches following NestJS conventions and using Drizzle
ORM and Redis.

---

## Solution 1: Centralized Environment Validation & Secret Management

### Problem Analysis

**Files with hardcoded JWT secrets:**

- `/apps/backend/src/app.module.ts` (line 45)
- `/apps/backend/src/config/passport.ts` (line 27)
- `/apps/backend/src/controllers/authController.ts` (lines 27, 193)
- `/apps/backend/src/utils/token.ts` (line 6)
- `/apps/backend/src/middleware/auth.ts` (line 30)

**Risk**: If `JWT_SECRET` is not set, application falls back to insecure default
values like `'your-secret-key'`, making all JWTs trivially compromisable.

### Architectural Solution

#### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Application Bootstrap                        │
│                                                                   │
│  1. Load .env file                                               │
│  2. ConfigService validates required secrets                     │
│  3. Fail fast if any required secret is missing                 │
│  4. Log successful validation (no secret values)                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ConfigService (Global)                        │
│                                                                   │
│  ├─ validateEnvironment()      ← Called at startup              │
│  ├─ getJwtSecret()             ← Returns validated secret        │
│  ├─ getJwtExpiresIn()          ← Returns JWT expiry             │
│  ├─ getGoogleClientId()        ← Returns Google OAuth ID        │
│  ├─ getGoogleClientSecret()    ← Returns Google OAuth secret    │
│  └─ getFrontendUrl()           ← Returns frontend URL           │
│                                                                   │
│  Throws error on startup if secrets missing                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     All Services/Modules                         │
│                                                                   │
│  AuthService ────┐                                               │
│  JwtStrategy ────┼──> Inject ConfigService                       │
│  AuthController ─┤                                               │
│  PassportConfig ─┘                                               │
│                                                                   │
│  No hardcoded fallbacks allowed                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Implementation Strategy

**Step 1: Create Enhanced ConfigService**

Create `/apps/backend/src/config/app-config.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  private readonly logger = new Logger(AppConfigService.name);

  constructor(private configService: ConfigService) {
    this.validateEnvironment();
  }

  /**
   * Validates all required environment variables on startup
   * Throws error if any required variable is missing
   */
  private validateEnvironment(): void {
    const required = [
      'JWT_SECRET',
      'DATABASE_URL',
      'REDIS_HOST',
      'FRONTEND_URL',
    ];

    const missing: string[] = [];

    for (const key of required) {
      if (!this.configService.get<string>(key)) {
        missing.push(key);
      }
    }

    if (missing.length > 0) {
      const errorMsg = `Missing required environment variables: ${missing.join(', ')}`;
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Validate JWT_SECRET strength
    const jwtSecret = this.getJwtSecret();
    if (jwtSecret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long');
    }

    this.logger.log('Environment validation successful');
  }

  // JWT Configuration
  getJwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET')!;
  }

  getJwtExpiresIn(): string {
    return this.configService.get<string>('JWT_EXPIRES_IN') || '7d';
  }

  // Google OAuth Configuration
  getGoogleClientId(): string {
    const value = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (!value) {
      throw new Error('GOOGLE_CLIENT_ID is required for OAuth');
    }
    return value;
  }

  getGoogleClientSecret(): string {
    const value = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    if (!value) {
      throw new Error('GOOGLE_CLIENT_SECRET is required for OAuth');
    }
    return value;
  }

  getGoogleCallbackUrl(): string {
    return (
      this.configService.get<string>('GOOGLE_CALLBACK_URL') ||
      `${this.getFrontendUrl()}/auth/google/callback`
    );
  }

  // Frontend Configuration
  getFrontendUrl(): string {
    return this.configService.get<string>('FRONTEND_URL')!;
  }

  // Database Configuration
  getDatabaseUrl(): string {
    return this.configService.get<string>('DATABASE_URL')!;
  }

  // Redis Configuration
  getRedisHost(): string {
    return this.configService.get<string>('REDIS_HOST')!;
  }

  getRedisPort(): number {
    return parseInt(this.configService.get<string>('REDIS_PORT') || '6379', 10);
  }

  getRedisPassword(): string | undefined {
    return this.configService.get<string>('REDIS_PASSWORD');
  }
}
```

**Step 2: Register as Global Module**

Update `/apps/backend/src/config/config.module.ts`:

```typescript
import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { AppConfigService } from './app-config.service';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
```

**Step 3: Update AppModule**

Modify `/apps/backend/src/app.module.ts`:

```typescript
import { AppConfigModule } from './config/config.module';
import { AppConfigService } from './config/app-config.service';

@Module({
  imports: [
    AppConfigModule, // First import - validates env on startup
    // ... other imports
    JwtModule.registerAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        secret: config.getJwtSecret(),
        signOptions: { expiresIn: config.getJwtExpiresIn() },
      }),
    }),
    // ... rest of imports
  ],
  // ... rest of module
})
export class AppModule {}
```

**Step 4: Update All Services**

Update `/apps/backend/src/auth/auth.service.ts`:

```typescript
import { AppConfigService } from '../config/app-config.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private config: AppConfigService // Inject config
    // ... other dependencies
  ) {}

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload), // Uses config from module
      user: { id: user.id, email: user.email, name: user.name },
    };
  }
}
```

Update `/apps/backend/src/config/passport.ts`:

```typescript
import { AppConfigService } from './app-config.service';

// Initialize config service
const configService = new AppConfigService(new ConfigService());

passport.use(
  new GoogleStrategy(
    {
      clientID: configService.getGoogleClientId(),
      clientSecret: configService.getGoogleClientSecret(),
      callbackURL: configService.getGoogleCallbackUrl(),
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      // ... rest of implementation
    }
  )
);
```

Update `/apps/backend/src/utils/token.ts`:

```typescript
import { AppConfigService } from '../config/app-config.service';
import { ConfigService } from '@nestjs/config';

const configService = new AppConfigService(new ConfigService());

export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, configService.getJwtSecret(), {
    expiresIn: configService.getJwtExpiresIn(),
  } as SignOptions);
};
```

Update `/apps/backend/src/middleware/auth.ts`:

```typescript
import { AppConfigService } from '../config/app-config.service';

const configService = new AppConfigService(new ConfigService());

export const auth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, configService.getJwtSecret()) as {
      id: string;
    };

    // ... rest of implementation
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};
```

Update `/apps/backend/src/controllers/authController.ts`:

```typescript
import { AppConfigService } from '../config/app-config.service';

const configService = new AppConfigService(new ConfigService());

export const googleAuthCallback = [
  passport.authenticate('google', { session: false }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        throw new Error('No user from Google');
      }

      const token = jwt.sign({ id: user.id }, configService.getJwtSecret(), {
        expiresIn: configService.getJwtExpiresIn(),
      } as SignOptions);

      await drizzleUserRepository.createSession(
        user.id,
        token,
        new Date(Date.now() + 24 * 60 * 60 * 1000)
      );

      res.redirect(
        `${configService.getFrontendUrl()}/auth/callback?token=${token}`
      );
    } catch (error) {
      console.error('Google auth callback error:', error);
      res.redirect(`${configService.getFrontendUrl()}/login?error=auth_failed`);
    }
  },
];

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, configService.getJwtSecret()) as {
      userId: string;
    };

    // ... rest of implementation
  } catch (error) {
    // ... error handling
  }
};
```

**Step 5: Create .env.example**

Create `.env.example` file:

```bash
# Required Environment Variables
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=7d

# Database
DATABASE_URL=postgresql://user:password@localhost:5433/thenewfuse

# Redis
REDIS_HOST=localhost
REDIS_PORT=6380
REDIS_PASSWORD=optional-redis-password
REDIS_DB=0

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback

# Frontend
FRONTEND_URL=http://localhost:3000

# Production: Use strong secrets
# Generate JWT secret: openssl rand -base64 64
```

#### Files to Create/Modify

**New Files:**

- `/apps/backend/src/config/app-config.service.ts`
- `/apps/backend/src/config/config.module.ts`
- `/.env.example`

**Modified Files:**

- `/apps/backend/src/app.module.ts`
- `/apps/backend/src/auth/auth.service.ts`
- `/apps/backend/src/config/passport.ts`
- `/apps/backend/src/controllers/authController.ts`
- `/apps/backend/src/utils/token.ts`
- `/apps/backend/src/middleware/auth.ts`

#### Testing Approach

**Test 1: Missing JWT_SECRET**

```bash
# Remove JWT_SECRET from .env
pnpm run dev

# Expected: Application fails to start with clear error message
# Error: Missing required environment variables: JWT_SECRET
```

**Test 2: Weak JWT_SECRET**

```bash
# Set JWT_SECRET=weak in .env
pnpm run dev

# Expected: Application fails to start
# Error: JWT_SECRET must be at least 32 characters long
```

**Test 3: Valid Configuration**

```bash
# Set all required env vars
pnpm run dev

# Expected:
# [AppConfigService] Environment validation successful
# Application starts successfully
```

**Test 4: JWT Token Generation**

```typescript
// Create test file: apps/backend/src/config/app-config.service.spec.ts

import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppConfigService } from './app-config.service';

describe('AppConfigService', () => {
  let service: AppConfigService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AppConfigService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                JWT_SECRET: 'test-secret-key-minimum-32-characters-long',
                DATABASE_URL: 'postgresql://localhost:5433/test',
                REDIS_HOST: 'localhost',
                FRONTEND_URL: 'http://localhost:3000',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AppConfigService>(AppConfigService);
  });

  it('should validate environment on initialization', () => {
    expect(service).toBeDefined();
  });

  it('should return JWT secret', () => {
    expect(service.getJwtSecret()).toBe(
      'test-secret-key-minimum-32-characters-long'
    );
  });

  it('should throw error for weak JWT secret', () => {
    const weakConfigService = new ConfigService({
      JWT_SECRET: 'weak',
      DATABASE_URL: 'postgresql://localhost:5433/test',
      REDIS_HOST: 'localhost',
      FRONTEND_URL: 'http://localhost:3000',
    } as any);

    expect(() => new AppConfigService(weakConfigService)).toThrow(
      'JWT_SECRET must be at least 32 characters long'
    );
  });
});
```

Run tests:

```bash
pnpm --filter @the-new-fuse/backend run test app-config.service.spec.ts
```

---

## Solution 2: Input Validation with DTOs and Global Validation Pipe

### Problem Analysis

**Controllers without input validation:**

- `/apps/backend/src/controllers/authController.ts` - register, login (no DTO
  validation)
- `/apps/backend/src/controllers/agentController.ts` - createAgent, updateAgent
  (no DTO validation)

**Risk**: SQL injection, XSS attacks, invalid data causing runtime errors.

### Architectural Solution

#### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    HTTP Request (Client)                         │
│                                                                   │
│  POST /auth/register                                             │
│  {                                                               │
│    "email": "user@example.com",                                  │
│    "password": "Password123!",                                   │
│    "name": "John Doe"                                            │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Global ValidationPipe (NestJS)                   │
│                                                                   │
│  1. Parse JSON body                                              │
│  2. Transform to DTO class instance                              │
│  3. Validate using class-validator decorators                    │
│  4. Sanitize input (whitelist, forbidNonWhitelisted)            │
│  5. Transform types (transform: true)                            │
│                                                                   │
│  If validation fails → Return 400 Bad Request                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DTO Validation                            │
│                                                                   │
│  RegisterDto:                                                    │
│    @IsEmail() email                                              │
│    @IsString() @MinLength(8) @Matches(regex) password            │
│    @IsString() @MinLength(2) @MaxLength(100) name                │
│                                                                   │
│  All fields validated against constraints                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Controller Method                           │
│                                                                   │
│  register(@Body() dto: RegisterDto) {                            │
│    // dto is guaranteed to be valid                              │
│    return authService.register(dto);                             │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Error Response Structure                       │
│                                                                   │
│  HTTP 400 Bad Request:                                           │
│  {                                                               │
│    "statusCode": 400,                                            │
│    "message": [                                                  │
│      "email must be a valid email address",                      │
│      "password must be at least 8 characters long"               │
│    ],                                                            │
│    "error": "Bad Request"                                        │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

#### Implementation Strategy

**Step 1: Create Auth DTOs**

Create `/apps/backend/src/auth/dto/auth.dto.ts`:

```typescript
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description:
      'User password (min 8 chars, must contain uppercase, lowercase, number, special char)',
    example: 'Password123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain uppercase, lowercase, number and special character',
  })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @ApiPropertyOptional({
    description: 'User full name',
    example: 'John Doe',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name?: string;
}

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'Password123!',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  access_token: string;

  @ApiProperty({ description: 'User information' })
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}
```

**Step 2: Create Agent DTOs**

Create `/apps/backend/src/modules/agents/dto/agent.dto.ts`:

```typescript
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsObject,
  MinLength,
  MaxLength,
  IsNotEmpty,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum AgentType {
  AUTONOMOUS = 'AUTONOMOUS',
  TASK_SPECIFIC = 'TASK_SPECIFIC',
  CONVERSATIONAL = 'CONVERSATIONAL',
  SPECIALIST = 'SPECIALIST',
}

export enum AgentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  TRAINING = 'TRAINING',
  ERROR = 'ERROR',
}

export class CreateAgentDto {
  @ApiProperty({
    description: 'Agent name',
    example: 'Code Assistant Agent',
    minLength: 3,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty({ message: 'Agent name is required' })
  @MinLength(3, { message: 'Agent name must be at least 3 characters' })
  @MaxLength(255, { message: 'Agent name must not exceed 255 characters' })
  name: string;

  @ApiProperty({
    description: 'Agent type',
    enum: AgentType,
    example: AgentType.TASK_SPECIFIC,
  })
  @IsEnum(AgentType, { message: 'Invalid agent type' })
  @IsNotEmpty({ message: 'Agent type is required' })
  type: AgentType;

  @ApiPropertyOptional({
    description: 'Agent description',
    example: 'An agent specialized in code review and refactoring',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
  description?: string;

  @ApiPropertyOptional({
    description: 'System prompt for the agent',
    example: 'You are a helpful code review assistant...',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10000, {
    message: 'System prompt must not exceed 10000 characters',
  })
  systemPrompt?: string;

  @ApiPropertyOptional({
    description: 'Agent configuration object',
    example: { temperature: 0.7, maxTokens: 2000 },
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Agent capabilities',
    example: ['code_review', 'refactoring', 'bug_detection'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  capabilities?: string[];

  @ApiPropertyOptional({
    description: 'AI provider',
    example: 'anthropic',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  provider?: string;
}

export class UpdateAgentDto {
  @ApiPropertyOptional({ description: 'Agent name' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Agent status', enum: AgentStatus })
  @IsOptional()
  @IsEnum(AgentStatus)
  status?: AgentStatus;

  @ApiPropertyOptional({ description: 'Agent description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'System prompt' })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  systemPrompt?: string;

  @ApiPropertyOptional({ description: 'Agent configuration' })
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Agent capabilities' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  capabilities?: string[];

  @ApiPropertyOptional({ description: 'AI provider' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  provider?: string;
}

export class AgentIdParamDto {
  @ApiProperty({ description: 'Agent UUID' })
  @IsUUID('4', { message: 'Invalid agent ID format' })
  id: string;
}
```

**Step 3: Configure Global ValidationPipe**

Update `/apps/backend/src/main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global ValidationPipe
  app.useGlobalPipes(
    new ValidationPipe({
      // Strip properties that don't have decorators
      whitelist: true,

      // Throw error if non-whitelisted properties are present
      forbidNonWhitelisted: true,

      // Automatically transform payloads to DTO instances
      transform: true,

      // Transform primitive types
      transformOptions: {
        enableImplicitConversion: true,
      },

      // Detailed error messages
      disableErrorMessages: false,

      // Return all errors, not just the first one
      stopAtFirstError: false,
    })
  );

  await app.listen(3001);
}
bootstrap();
```

**Step 4: Refactor AuthController to Use DTOs**

Update `/apps/backend/src/controllers/authController.ts`:

```typescript
import { Request, Response } from 'express';
import passport from 'passport';
import jwt, { SignOptions } from 'jsonwebtoken';
import { drizzleUserRepository } from '@the-new-fuse/database';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/token';
import { RegisterDto, LoginDto } from '../auth/dto/auth.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

// Helper to validate DTOs manually in Express controllers
async function validateDto<T extends object>(
  DtoClass: new () => T,
  data: any,
  res: Response
): Promise<T | null> {
  const dto = plainToInstance(DtoClass, data);
  const errors = await validate(dto);

  if (errors.length > 0) {
    const messages = errors.map((err) =>
      Object.values(err.constraints || {}).join(', ')
    );
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: messages,
    });
    return null;
  }

  return dto;
}

export const register = async (req: Request, res: Response) => {
  try {
    // Validate input
    const dto = await validateDto(RegisterDto, req.body, res);
    if (!dto) return; // Validation failed, response already sent

    const { email, password, name } = dto;

    // Check if user exists
    const existingUser = await drizzleUserRepository.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await drizzleUserRepository.create({
      email,
      name: name || null,
      hashedPassword,
    });

    // Generate token
    const token = generateToken(user.id);

    // Create session
    await drizzleUserRepository.createSession(
      user.id,
      token,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );

    res.status(201).json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, name: user.name },
        token,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    // Validate input
    const dto = await validateDto(LoginDto, req.body, res);
    if (!dto) return;

    const { email, password } = dto;

    // Find user
    const user = await drizzleUserRepository.findByEmail(email);
    if (!user || !user.hashedPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.hashedPassword);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate token
    const token = generateToken(user.id);

    // Create session
    await drizzleUserRepository.createSession(
      user.id,
      token,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );

    res.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, name: user.name },
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
    });
  }
};

// ... rest of controller (logout, getCurrentUser, Google auth)
```

**Step 5: Refactor AgentController to Use DTOs**

Update `/apps/backend/src/controllers/agentController.ts`:

```typescript
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AgentService } from '../services/agentService';
import {
  CreateAgentDto,
  UpdateAgentDto,
  AgentIdParamDto,
} from '../modules/agents/dto/agent.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

interface AuthenticatedRequest extends Request {
  user?: { id: string; email?: string; [key: string]: unknown };
}

async function validateDto<T extends object>(
  DtoClass: new () => T,
  data: any,
  res: Response
): Promise<T | null> {
  const dto = plainToInstance(DtoClass, data);
  const errors = await validate(dto);

  if (errors.length > 0) {
    const messages = errors.map((err) =>
      Object.values(err.constraints || {}).join(', ')
    );
    res.status(StatusCodes.BAD_REQUEST).json({
      error: 'Validation failed',
      details: messages,
    });
    return null;
  }

  return dto;
}

const agentService = new AgentService();

export const agentController = {
  createAgent: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ error: 'Unauthorized' });
      }

      // Validate DTO
      const dto = await validateDto(CreateAgentDto, req.body, res);
      if (!dto) return;

      const agent = await agentService.createAgent(dto, userId);
      res.status(StatusCodes.CREATED).json(agent);
    } catch (error: any) {
      console.error('Error creating agent:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: error.message || 'Unknown error',
      });
    }
  },

  updateAgent: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ error: 'Unauthorized' });
      }

      // Validate param
      const paramDto = await validateDto(AgentIdParamDto, req.params, res);
      if (!paramDto) return;

      // Validate body
      const bodyDto = await validateDto(UpdateAgentDto, req.body, res);
      if (!bodyDto) return;

      const agent = await agentService.updateAgent(
        paramDto.id,
        bodyDto,
        userId
      );
      if (!agent) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json({ error: 'Agent not found' });
      }

      res.json(agent);
    } catch (error: any) {
      console.error('Error updating agent:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: error.message || 'Unknown error',
      });
    }
  },

  // ... rest of controller
};
```

#### Files to Create/Modify

**New Files:**

- `/apps/backend/src/auth/dto/auth.dto.ts`
- `/apps/backend/src/modules/agents/dto/agent.dto.ts`

**Modified Files:**

- `/apps/backend/src/main.ts`
- `/apps/backend/src/controllers/authController.ts`
- `/apps/backend/src/controllers/agentController.ts`

**Dependencies to Add:**

```bash
pnpm --filter @the-new-fuse/backend add class-validator class-transformer
```

#### Testing Approach

**Test 1: Invalid Email**

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid-email", "password": "Password123!", "name": "John"}'

# Expected Response (400):
# {
#   "success": false,
#   "message": "Validation failed",
#   "errors": ["Please provide a valid email address"]
# }
```

**Test 2: Weak Password**

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@test.com", "password": "weak", "name": "John"}'

# Expected Response (400):
# {
#   "success": false,
#   "message": "Validation failed",
#   "errors": [
#     "Password must be at least 8 characters long",
#     "Password must contain uppercase, lowercase, number and special character"
#   ]
# }
```

**Test 3: Valid Registration**

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@test.com", "password": "Password123!", "name": "John Doe"}'

# Expected Response (201):
# {
#   "success": true,
#   "data": {
#     "user": { "id": "...", "email": "user@test.com", "name": "John Doe" },
#     "token": "..."
#   }
# }
```

**Test 4: Extra Fields Rejected**

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@test.com", "password": "Password123!", "malicious": "hack"}'

# Expected Response (400):
# {
#   "error": "Validation failed",
#   "details": ["property malicious should not exist"]
# }
```

**Test 5: Unit Tests**

Create `/apps/backend/src/auth/dto/auth.dto.spec.ts`:

```typescript
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RegisterDto, LoginDto } from './auth.dto';

describe('Auth DTOs', () => {
  describe('RegisterDto', () => {
    it('should validate correct data', async () => {
      const dto = plainToInstance(RegisterDto, {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'John Doe',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject invalid email', async () => {
      const dto = plainToInstance(RegisterDto, {
        email: 'not-an-email',
        password: 'Password123!',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
    });

    it('should reject weak password', async () => {
      const dto = plainToInstance(RegisterDto, {
        email: 'test@example.com',
        password: 'weak',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('password');
    });
  });

  describe('LoginDto', () => {
    it('should validate correct credentials', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'test@example.com',
        password: 'Password123!',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
```

---

## Solution 3: Optimized Query Patterns with Drizzle ORM

### Problem Analysis

**N+1 Query Locations:**

1. **chat-rooms.service.ts (lines 111-134)**
   - `getChatRoom()`: Fetches room, then counts participants, then counts
     messages
   - `getUserChatRooms()`: For each room, fetches participants count and
     messages count separately

2. **mass-orchestration.service.ts (lines 142-145, 254-257)**
   - `runFullMassOptimization()`: Runs Promise.all for multiple agents
     sequentially
   - `getAgentOptimizationHistory()`: Fetches prompt versions and jobs
     separately

### Architectural Solution

#### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    BEFORE: N+1 Query Pattern                     │
│                                                                   │
│  getUserChatRooms(userId)                                        │
│    ↓                                                             │
│  SELECT * FROM chat_rooms WHERE ...  (1 query)                   │
│    ↓                                                             │
│  For each room (N rooms):                                        │
│    SELECT COUNT(*) FROM participants WHERE room_id = ?           │
│    SELECT COUNT(*) FROM messages WHERE room_id = ?               │
│                                                                   │
│  Total: 1 + 2N queries (N+1 problem)                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     AFTER: Optimized Pattern                     │
│                                                                   │
│  getUserChatRooms(userId)                                        │
│    ↓                                                             │
│  SELECT                                                          │
│    cr.*,                                                         │
│    COUNT(DISTINCT p.id) as participant_count,                    │
│    COUNT(DISTINCT m.id) as message_count                         │
│  FROM chat_rooms cr                                              │
│  LEFT JOIN chat_room_participants p ON cr.id = p.room_id         │
│  LEFT JOIN messages m ON cr.id = m.room_id                       │
│  WHERE EXISTS (                                                  │
│    SELECT 1 FROM chat_room_participants                          │
│    WHERE room_id = cr.id AND user_id = ?                         │
│  )                                                               │
│  GROUP BY cr.id                                                  │
│                                                                   │
│  Total: 1 query (regardless of N)                               │
└─────────────────────────────────────────────────────────────────┘
```

#### Implementation Strategy

**Step 1: Add Optimized Repository Methods**

Update `/packages/database/src/drizzle/repositories/chat.repository.ts`:

```typescript
import { and, desc, eq, exists, isNull, sql, count } from 'drizzle-orm';
import { db } from '../client';
import { chatRoomParticipants, chatRooms, messages } from '../schema';

export class DrizzleChatRepository {
  // ... existing methods ...

  /**
   * Find room by ID with counts (optimized - single query)
   */
  async findRoomByIdWithCounts(roomId: string): Promise<{
    room: ChatRoom;
    participantCount: number;
    messageCount: number;
  } | null> {
    const result = await db
      .select({
        room: chatRooms,
        participantCount: sql<number>`COUNT(DISTINCT ${chatRoomParticipants.id})::int`,
        messageCount: sql<number>`COUNT(DISTINCT ${messages.id})::int`,
      })
      .from(chatRooms)
      .leftJoin(
        chatRoomParticipants,
        eq(chatRooms.id, chatRoomParticipants.roomId)
      )
      .leftJoin(
        messages,
        and(eq(chatRooms.id, messages.roomId), eq(messages.isDeleted, false))
      )
      .where(and(eq(chatRooms.id, roomId), isNull(chatRooms.deletedAt)))
      .groupBy(chatRooms.id)
      .limit(1);

    if (!result || result.length === 0) {
      return null;
    }

    return {
      room: result[0].room,
      participantCount: result[0].participantCount,
      messageCount: result[0].messageCount,
    };
  }

  /**
   * Find joined rooms with counts (optimized - single query)
   */
  async findJoinedRoomsWithCounts(userId: string): Promise<
    Array<{
      room: ChatRoom;
      participantCount: number;
      messageCount: number;
    }>
  > {
    const results = await db
      .select({
        room: chatRooms,
        participantCount: sql<number>`COUNT(DISTINCT ${chatRoomParticipants.id})::int`,
        messageCount: sql<number>`COUNT(DISTINCT ${messages.id})::int`,
      })
      .from(chatRooms)
      .leftJoin(
        chatRoomParticipants,
        eq(chatRooms.id, chatRoomParticipants.roomId)
      )
      .leftJoin(
        messages,
        and(eq(chatRooms.id, messages.roomId), eq(messages.isDeleted, false))
      )
      .where(
        and(
          isNull(chatRooms.deletedAt),
          exists(
            db
              .select({ id: chatRoomParticipants.id })
              .from(chatRoomParticipants)
              .where(
                and(
                  eq(chatRoomParticipants.roomId, chatRooms.id),
                  eq(chatRoomParticipants.userId, userId)
                )
              )
          )
        )
      )
      .groupBy(chatRooms.id)
      .orderBy(desc(chatRooms.lastMessageAt));

    return results.map((r) => ({
      room: r.room,
      participantCount: r.participantCount,
      messageCount: r.messageCount,
    }));
  }

  /**
   * Batch fetch participant counts for multiple rooms (optimized)
   */
  async getParticipantCountsByRoomIds(
    roomIds: string[]
  ): Promise<Map<string, number>> {
    if (roomIds.length === 0) return new Map();

    const results = await db
      .select({
        roomId: chatRoomParticipants.roomId,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(chatRoomParticipants)
      .where(sql`${chatRoomParticipants.roomId} = ANY(${roomIds})`)
      .groupBy(chatRoomParticipants.roomId);

    return new Map(results.map((r) => [r.roomId, r.count]));
  }

  /**
   * Batch fetch message counts for multiple rooms (optimized)
   */
  async getMessageCountsByRoomIds(
    roomIds: string[]
  ): Promise<Map<string, number>> {
    if (roomIds.length === 0) return new Map();

    const results = await db
      .select({
        roomId: messages.roomId,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(messages)
      .where(
        and(
          sql`${messages.roomId} = ANY(${roomIds})`,
          eq(messages.isDeleted, false)
        )
      )
      .groupBy(messages.roomId);

    return new Map(results.map((r) => [r.roomId!, r.count]));
  }
}

export const drizzleChatRepository = new DrizzleChatRepository();
```

**Step 2: Update ChatRoomsService to Use Optimized Queries**

Update `/apps/backend/src/modules/chat-rooms/chat-rooms.service.ts`:

```typescript
import { drizzleChatRepository } from '@the-new-fuse/database';

@Injectable()
export class ChatRoomsService {
  // ... existing code ...

  async getChatRoom(
    roomId: string,
    userId: string
  ): Promise<ChatRoomResponseDto> {
    // Check access first
    await this.verifyAccess(roomId, userId);

    // OPTIMIZED: Single query with counts
    const result = await drizzleChatRepository.findRoomByIdWithCounts(roomId);

    if (!result) {
      throw new NotFoundException(`Chat room ${roomId} not found`);
    }

    const response = this.formatChatRoomResponse(result.room);
    response.participantCount = result.participantCount;
    response.messageCount = result.messageCount;

    return response;
  }

  async getUserChatRooms(userId: string): Promise<ChatRoomResponseDto[]> {
    // OPTIMIZED: Single query with counts
    const results =
      await drizzleChatRepository.findJoinedRoomsWithCounts(userId);

    return results.map((result) => {
      const dto = this.formatChatRoomResponse(result.room);
      dto.participantCount = result.participantCount;
      dto.messageCount = result.messageCount;
      return dto;
    });
  }

  // ... rest of service
}
```

**Step 3: Create MASS Optimized Repository**

Create `/packages/database/src/drizzle/repositories/mass.repository.ts`:

```typescript
import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '../client';
import { optimizationJobs, agentPromptVersions } from '../schema';
import type { OptimizationJob, NewOptimizationJob } from '../types';

export class MassRepository {
  /**
   * Batch fetch optimization jobs by IDs (single query)
   */
  async findJobsByIds(jobIds: string[]): Promise<OptimizationJob[]> {
    if (jobIds.length === 0) return [];

    return db
      .select()
      .from(optimizationJobs)
      .where(inArray(optimizationJobs.id, jobIds))
      .orderBy(desc(optimizationJobs.createdAt));
  }

  /**
   * Batch fetch jobs by target IDs (single query)
   */
  async findJobsByTargetIds(targetIds: string[]): Promise<OptimizationJob[]> {
    if (targetIds.length === 0) return [];

    return db
      .select()
      .from(optimizationJobs)
      .where(inArray(optimizationJobs.targetId, targetIds))
      .orderBy(desc(optimizationJobs.createdAt));
  }

  /**
   * Get agent optimization history (optimized - single query for each)
   */
  async getAgentOptimizationHistoryBatch(
    agentIds: string[],
    userId: string
  ): Promise<{
    promptVersions: Map<string, AgentPromptVersion[]>;
    optimizationJobs: Map<string, OptimizationJob[]>;
  }> {
    if (agentIds.length === 0) {
      return {
        promptVersions: new Map(),
        optimizationJobs: new Map(),
      };
    }

    // Fetch all prompt versions in one query
    const promptVersions = await db
      .select()
      .from(agentPromptVersions)
      .where(inArray(agentPromptVersions.agentId, agentIds))
      .orderBy(desc(agentPromptVersions.createdAt));

    // Fetch all optimization jobs in one query
    const jobs = await db
      .select()
      .from(optimizationJobs)
      .where(
        and(
          inArray(optimizationJobs.targetId, agentIds),
          eq(optimizationJobs.userId, userId)
        )
      )
      .orderBy(desc(optimizationJobs.createdAt));

    // Group by agentId
    const promptVersionsMap = new Map<string, AgentPromptVersion[]>();
    const jobsMap = new Map<string, OptimizationJob[]>();

    for (const pv of promptVersions) {
      if (!promptVersionsMap.has(pv.agentId)) {
        promptVersionsMap.set(pv.agentId, []);
      }
      promptVersionsMap.get(pv.agentId)!.push(pv);
    }

    for (const job of jobs) {
      if (!jobsMap.has(job.targetId)) {
        jobsMap.set(job.targetId, []);
      }
      jobsMap.get(job.targetId)!.push(job);
    }

    return {
      promptVersions: promptVersionsMap,
      optimizationJobs: jobsMap,
    };
  }
}

export const massRepository = new MassRepository();
```

**Step 4: Update MassOrchestrationService**

Update `/apps/backend/src/modules/mass/mass-orchestration.service.ts`:

```typescript
import { massRepository } from '@the-new-fuse/database';

@Injectable()
export class MassOrchestrationService {
  // ... existing code ...

  /**
   * Wait for jobs completion (optimized - batch fetch)
   */
  private async waitForJobsCompletion(jobIds: string[]): Promise<void> {
    const maxWaitTime = 30 * 60 * 1000; // 30 minutes
    const checkInterval = 5000; // 5 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      // OPTIMIZED: Batch fetch all jobs in single query
      const jobs = await massRepository.findJobsByIds(jobIds);

      const allCompleted = jobs.every(
        (job) => job.status === 'completed' || job.status === 'failed'
      );

      if (allCompleted) {
        const failedJobs = jobs.filter((job) => job.status === 'failed');
        if (failedJobs.length > 0) {
          throw new Error(
            `Some optimization jobs failed: ${failedJobs.map((j) => j.id).join(', ')}`
          );
        }
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, checkInterval));
    }

    throw new Error(
      `Timeout waiting for optimization jobs to complete: ${jobIds.join(', ')}`
    );
  }

  /**
   * Get optimization history for multiple agents (optimized)
   */
  async getAgentOptimizationHistoryBatch(
    agentIds: string[],
    userId: string
  ): Promise<
    Map<
      string,
      {
        promptVersions: AgentPromptVersion[];
        optimizationJobs: OptimizationJob[];
      }
    >
  > {
    // OPTIMIZED: Batch fetch all data in 2 queries instead of 2*N
    const { promptVersions, optimizationJobs } =
      await massRepository.getAgentOptimizationHistoryBatch(agentIds, userId);

    const result = new Map();
    for (const agentId of agentIds) {
      result.set(agentId, {
        promptVersions: promptVersions.get(agentId) || [],
        optimizationJobs: optimizationJobs.get(agentId) || [],
      });
    }

    return result;
  }

  // Keep existing single-agent method for backward compatibility
  async getAgentOptimizationHistory(
    agentId: string,
    userId: string
  ): Promise<{
    promptVersions: AgentPromptVersion[];
    optimizationJobs: OptimizationJob[];
  }> {
    const batch = await this.getAgentOptimizationHistoryBatch(
      [agentId],
      userId
    );
    return batch.get(agentId)!;
  }
}
```

**Step 5: Add Database Indexes**

Create `/packages/database/src/drizzle/migrations/add-performance-indexes.sql`:

```sql
-- Indexes for chat room queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_rooms_owner_id
  ON chat_rooms(owner_id)
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_rooms_last_message
  ON chat_rooms(last_message_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_room_participants_room_user
  ON chat_room_participants(room_id, user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_room_participants_user
  ON chat_room_participants(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_room_id
  ON messages(room_id)
  WHERE is_deleted = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_timestamp
  ON messages(room_id, timestamp DESC)
  WHERE is_deleted = false;

-- Indexes for MASS optimization queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_optimization_jobs_target_user
  ON optimization_jobs(target_id, user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_optimization_jobs_status
  ON optimization_jobs(status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_prompt_versions_agent
  ON agent_prompt_versions(agent_id, created_at DESC);

-- Composite indexes for common join patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_room_sender
  ON messages(room_id, sender_id)
  WHERE is_deleted = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_room_agent
  ON messages(room_id, agent_id)
  WHERE is_deleted = false;
```

Apply migration:

```bash
pnpm --filter @the-new-fuse/database run db:migrate
```

#### Files to Create/Modify

**New Files:**

- `/packages/database/src/drizzle/repositories/mass.repository.ts`
- `/packages/database/src/drizzle/migrations/add-performance-indexes.sql`

**Modified Files:**

- `/packages/database/src/drizzle/repositories/chat.repository.ts`
- `/apps/backend/src/modules/chat-rooms/chat-rooms.service.ts`
- `/apps/backend/src/modules/mass/mass-orchestration.service.ts`
- `/packages/database/src/index.ts` (export massRepository)

#### Testing Approach

**Test 1: Query Performance Comparison**

Create `/apps/backend/src/modules/chat-rooms/chat-rooms.performance.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { ChatRoomsService } from './chat-rooms.service';
import { drizzleChatRepository } from '@the-new-fuse/database';

describe('ChatRoomsService Performance', () => {
  let service: ChatRoomsService;
  let testUserId: string;
  let testRoomIds: string[];

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [ChatRoomsService],
    }).compile();

    service = module.get<ChatRoomsService>(ChatRoomsService);

    // Create test data: user with 10 rooms
    testUserId = 'test-user-id';
    testRoomIds = [];

    for (let i = 0; i < 10; i++) {
      const room = await drizzleChatRepository.createRoom({
        name: `Test Room ${i}`,
        ownerId: testUserId,
        isPrivate: false,
        isActive: true,
      });
      testRoomIds.push(room.id);

      await drizzleChatRepository.addParticipant({
        roomId: room.id,
        userId: testUserId,
        role: 'ADMIN',
      });

      // Add 5 messages per room
      for (let j = 0; j < 5; j++) {
        await drizzleChatRepository.createMessage({
          content: `Test message ${j}`,
          roomId: room.id,
          senderId: testUserId,
          role: 'USER',
        });
      }
    }
  });

  it('should fetch user rooms with single optimized query', async () => {
    const startTime = Date.now();
    const rooms = await service.getUserChatRooms(testUserId);
    const endTime = Date.now();

    expect(rooms.length).toBe(10);
    expect(rooms[0].participantCount).toBe(1);
    expect(rooms[0].messageCount).toBe(5);

    // Should complete in under 100ms (single query)
    expect(endTime - startTime).toBeLessThan(100);

    console.log(`Optimized query time: ${endTime - startTime}ms`);
  });

  it('should fetch room with counts efficiently', async () => {
    const startTime = Date.now();
    const room = await service.getChatRoom(testRoomIds[0], testUserId);
    const endTime = Date.now();

    expect(room).toBeDefined();
    expect(room.participantCount).toBe(1);
    expect(room.messageCount).toBe(5);

    // Should complete in under 50ms (single query)
    expect(endTime - startTime).toBeLessThan(50);

    console.log(`Optimized single room query time: ${endTime - startTime}ms`);
  });

  afterAll(async () => {
    // Cleanup test data
    for (const roomId of testRoomIds) {
      await drizzleChatRepository.softDeleteRoom(roomId);
    }
  });
});
```

**Test 2: Load Test with Artillery**

Create `/apps/backend/test/load/chat-rooms.artillery.yml`:

```yaml
config:
  target: 'http://localhost:3001'
  phases:
    - duration: 60
      arrivalRate: 10
  variables:
    authToken: 'your-test-jwt-token'

scenarios:
  - name: 'Get User Chat Rooms'
    flow:
      - get:
          url: '/chat-rooms/user'
          headers:
            Authorization: 'Bearer {{ authToken }}'
          capture:
            - json: '$[0].id'
              as: 'roomId'
      - think: 1
      - get:
          url: '/chat-rooms/{{ roomId }}'
          headers:
            Authorization: 'Bearer {{ authToken }}'
```

Run load test:

```bash
pnpm --filter @the-new-fuse/backend add -D artillery
pnpm --filter @the-new-fuse/backend run artillery run test/load/chat-rooms.artillery.yml
```

**Test 3: Database Query Analysis**

Enable Drizzle query logging:

```typescript
// In drizzle client configuration
import { drizzle } from 'drizzle-orm/node-postgres';

export const db = drizzle(pool, {
  schema,
  logger: process.env.NODE_ENV === 'development',
});
```

Check query count:

```bash
# Start app with query logging
NODE_ENV=development pnpm run dev

# Call API and count queries in console
curl http://localhost:3001/chat-rooms/user -H "Authorization: Bearer <token>"

# Expected: 1 SELECT query (optimized)
# Before: 1 + 2N queries (N rooms)
```

---

## Solution 4: Distributed Locking for Race Conditions

### Problem Analysis

**Race condition location:**

- `/apps/backend/src/modules/mass/mass-orchestration.service.ts` (line 314-340)
- `waitForJobsCompletion()`: Multiple processes polling same jobs can cause race
  conditions
- Jobs can be started by different processes simultaneously

**Risk**:

- Double processing of optimization jobs
- Inconsistent job status updates
- Resource wastage

### Architectural Solution

#### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Process A                                     │
│                                                                   │
│  1. Acquire lock: job:{jobId}:processing                         │
│  2. Check if locked (SET NX EX)                                  │
│  3. If acquired → Process job                                    │
│  4. Update job status                                            │
│  5. Release lock (DEL)                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │  Both try to acquire lock
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      Redis (Lock Manager)                        │
│                                                                   │
│  Key: job:{jobId}:processing                                     │
│  Value: {processId}:{timestamp}                                  │
│  TTL: 300 seconds (auto-release if process dies)                │
│                                                                   │
│  Only one process can acquire lock                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │  Lock already acquired
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Process B                                     │
│                                                                   │
│  1. Try to acquire lock: job:{jobId}:processing                  │
│  2. Lock already held by Process A                               │
│  3. Wait and retry (exponential backoff)                         │
│  4. OR Skip if lock held too long                                │
│  5. Continue to next job                                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Lock Lifecycle                                │
│                                                                   │
│  Acquire  → Process → Release → Next Process                     │
│     ↓                   ↓                                        │
│  Auto-release       Manual                                       │
│  (TTL expired)      (Success/Fail)                               │
└─────────────────────────────────────────────────────────────────┘
```

#### Implementation Strategy

**Step 1: Create Distributed Lock Service**

Create `/apps/backend/src/services/distributed-lock.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';
import { randomUUID } from 'crypto';

export interface LockOptions {
  ttl?: number; // Time to live in seconds (default: 30)
  retries?: number; // Number of retry attempts (default: 3)
  retryDelay?: number; // Delay between retries in ms (default: 1000)
}

@Injectable()
export class DistributedLockService {
  private readonly logger = new Logger(DistributedLockService.name);
  private readonly processId = randomUUID(); // Unique ID for this process

  constructor(private readonly redis: RedisService) {}

  /**
   * Acquire a distributed lock
   * @param key Lock key (e.g., 'job:123:processing')
   * @param options Lock options
   * @returns Lock token if acquired, null if failed
   */
  async acquireLock(
    key: string,
    options: LockOptions = {}
  ): Promise<string | null> {
    const { ttl = 30, retries = 3, retryDelay = 1000 } = options;
    const lockToken = `${this.processId}:${Date.now()}`;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // SET NX (only if not exists) with expiration
        const result = await this.redis
          .getClient()
          .set(key, lockToken, 'EX', ttl, 'NX');

        if (result === 'OK') {
          this.logger.debug(`Lock acquired: ${key} by ${lockToken}`);
          return lockToken;
        }

        // Lock already held
        if (attempt < retries) {
          this.logger.debug(
            `Lock ${key} already held, retrying... (${attempt + 1}/${retries})`
          );
          await this.delay(retryDelay * Math.pow(2, attempt)); // Exponential backoff
        }
      } catch (error) {
        this.logger.error(`Error acquiring lock ${key}:`, error);
        if (attempt === retries) {
          return null;
        }
      }
    }

    this.logger.warn(`Failed to acquire lock ${key} after ${retries} attempts`);
    return null;
  }

  /**
   * Release a distributed lock
   * @param key Lock key
   * @param token Lock token (to ensure we only release our own lock)
   */
  async releaseLock(key: string, token: string): Promise<boolean> {
    try {
      // Lua script to atomically check token and delete
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;

      const result = await this.redis.getClient().eval(script, 1, key, token);

      if (result === 1) {
        this.logger.debug(`Lock released: ${key}`);
        return true;
      } else {
        this.logger.warn(`Lock ${key} was not held by this process`);
        return false;
      }
    } catch (error) {
      this.logger.error(`Error releasing lock ${key}:`, error);
      return false;
    }
  }

  /**
   * Extend lock TTL (useful for long-running operations)
   * @param key Lock key
   * @param token Lock token
   * @param ttl New TTL in seconds
   */
  async extendLock(key: string, token: string, ttl: number): Promise<boolean> {
    try {
      // Lua script to atomically check token and extend TTL
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("expire", KEYS[1], ARGV[2])
        else
          return 0
        end
      `;

      const result = await this.redis
        .getClient()
        .eval(script, 1, key, token, ttl);

      return result === 1;
    } catch (error) {
      this.logger.error(`Error extending lock ${key}:`, error);
      return false;
    }
  }

  /**
   * Execute a function with a distributed lock
   * @param key Lock key
   * @param fn Function to execute
   * @param options Lock options
   */
  async withLock<T>(
    key: string,
    fn: () => Promise<T>,
    options: LockOptions = {}
  ): Promise<T | null> {
    const token = await this.acquireLock(key, options);

    if (!token) {
      this.logger.warn(`Could not acquire lock for ${key}, skipping execution`);
      return null;
    }

    try {
      const result = await fn();
      return result;
    } catch (error) {
      this.logger.error(`Error in locked function ${key}:`, error);
      throw error;
    } finally {
      await this.releaseLock(key, token);
    }
  }

  /**
   * Check if a lock is currently held
   * @param key Lock key
   */
  async isLocked(key: string): Promise<boolean> {
    try {
      const value = await this.redis.get(key);
      return value !== null;
    } catch (error) {
      this.logger.error(`Error checking lock ${key}:`, error);
      return false;
    }
  }

  /**
   * Get lock holder information
   * @param key Lock key
   */
  async getLockHolder(key: string): Promise<{
    processId: string;
    timestamp: number;
  } | null> {
    try {
      const value = await this.redis.get(key);
      if (!value) return null;

      const [processId, timestamp] = value.split(':');
      return {
        processId,
        timestamp: parseInt(timestamp, 10),
      };
    } catch (error) {
      this.logger.error(`Error getting lock holder ${key}:`, error);
      return null;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Add method to get Redis client for advanced usage
  getClient() {
    return this.redis.getClient();
  }
}
```

**Step 2: Update RedisService to Expose Client**

Update `/apps/backend/src/services/redis.service.ts`:

```typescript
@Injectable()
export class RedisService implements OnModuleDestroy {
  // ... existing code ...

  getClient(): Redis {
    return this.client;
  }

  // ... rest of methods
}
```

**Step 3: Update MassOrchestrationService with Locking**

Update `/apps/backend/src/modules/mass/mass-orchestration.service.ts`:

```typescript
import { DistributedLockService } from '../../services/distributed-lock.service';

@Injectable()
export class MassOrchestrationService {
  private readonly logger = new Logger(MassOrchestrationService.name);

  constructor(
    private readonly promptOptimizer: PromptOptimizerService,
    private readonly topologyOptimizer: TopologyOptimizerService,
    private readonly workflowOptimizer: WorkflowPromptOptimizerService,
    private readonly distributedLock: DistributedLockService // Inject lock service
  ) {}

  /**
   * Optimize agent prompt with distributed locking
   */
  async optimizeAgentPrompt(
    agentId: string,
    config: MassOptimizationConfig
  ): Promise<OptimizationJob> {
    const lockKey = `mass:agent:${agentId}:optimize`;

    // Try to acquire lock
    const result = await this.distributedLock.withLock(
      lockKey,
      async () => {
        this.logger.log(`Starting MASS Stage 1 for agent ${agentId} (locked)`);

        const job = await this.createOptimizationJob(
          'block_level',
          agentId,
          config
        );

        try {
          await this.updateJobStatus(job.id, 'running');

          const optimizedPrompt =
            await this.promptOptimizer.optimizeAgentPrompt(agentId, config);

          await this.updateJobResults(job.id, {
            stage: 'block_level',
            agentId,
            optimizedPromptVersion: optimizedPrompt,
            performanceImprovement: this.calculateImprovement(optimizedPrompt),
            completedAt: new Date(),
          });

          await this.updateJobStatus(job.id, 'completed');
          this.logger.log(`MASS Stage 1 completed for agent ${agentId}`);

          return this.getOptimizationJob(job.id);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          this.logger.error(`MASS Stage 1 failed for agent ${agentId}:`, error);
          await this.updateJobStatus(job.id, 'failed', errorMessage);
          throw error;
        }
      },
      {
        ttl: 600, // 10 minutes
        retries: 3,
        retryDelay: 2000,
      }
    );

    if (!result) {
      throw new Error(
        `Could not acquire lock for agent ${agentId} optimization. ` +
          `Another process may be optimizing this agent.`
      );
    }

    return result;
  }

  /**
   * Wait for jobs completion with distributed locking
   */
  private async waitForJobsCompletion(jobIds: string[]): Promise<void> {
    const maxWaitTime = 30 * 60 * 1000; // 30 minutes
    const checkInterval = 5000; // 5 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      // Batch fetch all jobs (optimized)
      const jobs = await massRepository.findJobsByIds(jobIds);

      // Check completion with locks to prevent race conditions
      const statusChecks = await Promise.all(
        jobs.map(async (job) => {
          const lockKey = `mass:job:${job.id}:status`;
          const isLocked = await this.distributedLock.isLocked(lockKey);

          // If locked, another process is updating status, consider it in-progress
          if (isLocked) {
            this.logger.debug(
              `Job ${job.id} status update in progress by another process`
            );
            return { job, completed: false };
          }

          return {
            job,
            completed: job.status === 'completed' || job.status === 'failed',
          };
        })
      );

      const allCompleted = statusChecks.every((check) => check.completed);

      if (allCompleted) {
        const failedJobs = statusChecks
          .filter((check) => check.job.status === 'failed')
          .map((check) => check.job);

        if (failedJobs.length > 0) {
          throw new Error(
            `Some optimization jobs failed: ${failedJobs.map((j) => j.id).join(', ')}`
          );
        }
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, checkInterval));
    }

    throw new Error(
      `Timeout waiting for optimization jobs to complete: ${jobIds.join(', ')}`
    );
  }

  /**
   * Update job status with distributed locking
   */
  private async updateJobStatus(
    jobId: string,
    status: string,
    errorMessage?: string
  ): Promise<void> {
    const lockKey = `mass:job:${jobId}:status`;

    await this.distributedLock.withLock(
      lockKey,
      async () => {
        const updateData: any = { status };

        if (errorMessage) {
          const job = await optimizationJobRepository.findById(jobId);
          const results = (job?.results as any) || {};
          results.error = errorMessage;
          updateData.results = results;
        }

        await optimizationJobRepository.update(jobId, updateData);
      },
      {
        ttl: 10, // Short TTL for status updates
        retries: 5,
        retryDelay: 500,
      }
    );
  }

  // ... rest of service
}
```

**Step 4: Register DistributedLockService**

Update `/apps/backend/src/services/services.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { DistributedLockService } from './distributed-lock.service';

@Module({
  providers: [RedisService, DistributedLockService],
  exports: [RedisService, DistributedLockService],
})
export class ServicesModule {}
```

Update `/apps/backend/src/modules/mass/mass.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ServicesModule } from '../../services/services.module';
import { MassOrchestrationService } from './mass-orchestration.service';
// ... other imports

@Module({
  imports: [ServicesModule], // Import to get DistributedLockService
  providers: [
    MassOrchestrationService,
    // ... other providers
  ],
  exports: [MassOrchestrationService],
})
export class MassModule {}
```

**Step 5: Add Lock Cleanup Job**

Create `/apps/backend/src/jobs/lock-cleanup.job.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RedisService } from '../services/redis.service';

@Injectable()
export class LockCleanupJob {
  private readonly logger = new Logger(LockCleanupJob.name);

  constructor(private readonly redis: RedisService) {}

  /**
   * Clean up stale locks every 5 minutes
   * Locks with expired TTL are automatically removed by Redis,
   * but this provides additional monitoring
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async cleanupStaleLocks() {
    this.logger.debug('Running lock cleanup job');

    try {
      const client = this.redis.getClient();

      // Find all lock keys
      const lockKeys = await client.keys('mass:*:*');

      this.logger.log(`Found ${lockKeys.length} lock keys`);

      let cleanedCount = 0;
      const now = Date.now();

      for (const key of lockKeys) {
        const value = await client.get(key);
        if (!value) continue;

        // Parse lock token
        const [, timestamp] = value.split(':');
        const lockAge = now - parseInt(timestamp, 10);

        // If lock is older than 1 hour, it's likely stale
        if (lockAge > 60 * 60 * 1000) {
          this.logger.warn(`Removing stale lock: ${key} (age: ${lockAge}ms)`);
          await client.del(key);
          cleanedCount++;
        }
      }

      this.logger.log(
        `Lock cleanup complete. Removed ${cleanedCount} stale locks`
      );
    } catch (error) {
      this.logger.error('Error in lock cleanup job:', error);
    }
  }
}
```

#### Files to Create/Modify

**New Files:**

- `/apps/backend/src/services/distributed-lock.service.ts`
- `/apps/backend/src/services/services.module.ts`
- `/apps/backend/src/jobs/lock-cleanup.job.ts`

**Modified Files:**

- `/apps/backend/src/services/redis.service.ts`
- `/apps/backend/src/modules/mass/mass-orchestration.service.ts`
- `/apps/backend/src/modules/mass/mass.module.ts`

**Dependencies:**

```bash
pnpm --filter @the-new-fuse/backend add @nestjs/schedule
```

#### Testing Approach

**Test 1: Basic Lock Acquisition**

Create `/apps/backend/src/services/distributed-lock.service.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { DistributedLockService } from './distributed-lock.service';
import { RedisService } from './redis.service';

describe('DistributedLockService', () => {
  let service: DistributedLockService;
  let redisService: RedisService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [DistributedLockService, RedisService],
    }).compile();

    service = module.get<DistributedLockService>(DistributedLockService);
    redisService = module.get<RedisService>(RedisService);
  });

  afterEach(async () => {
    await redisService.flushAll();
  });

  it('should acquire and release lock', async () => {
    const key = 'test:lock:1';
    const token = await service.acquireLock(key);

    expect(token).toBeDefined();
    expect(await service.isLocked(key)).toBe(true);

    await service.releaseLock(key, token!);
    expect(await service.isLocked(key)).toBe(false);
  });

  it('should prevent concurrent lock acquisition', async () => {
    const key = 'test:lock:2';

    const token1 = await service.acquireLock(key);
    expect(token1).toBeDefined();

    // Second attempt should fail
    const token2 = await service.acquireLock(key, {
      retries: 1,
      retryDelay: 100,
    });
    expect(token2).toBeNull();

    // After release, should succeed
    await service.releaseLock(key, token1!);
    const token3 = await service.acquireLock(key);
    expect(token3).toBeDefined();
  });

  it('should execute function with lock', async () => {
    const key = 'test:lock:3';
    let executed = false;

    const result = await service.withLock(key, async () => {
      executed = true;
      return 'success';
    });

    expect(executed).toBe(true);
    expect(result).toBe('success');
    expect(await service.isLocked(key)).toBe(false);
  });

  it('should extend lock TTL', async () => {
    const key = 'test:lock:4';
    const token = await service.acquireLock(key, { ttl: 5 });

    expect(token).toBeDefined();

    // Extend lock
    const extended = await service.extendLock(key, token!, 60);
    expect(extended).toBe(true);

    // Verify lock still held
    expect(await service.isLocked(key)).toBe(true);

    await service.releaseLock(key, token!);
  });
});
```

**Test 2: Race Condition Prevention**

Create `/apps/backend/src/modules/mass/mass-orchestration.race.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { MassOrchestrationService } from './mass-orchestration.service';
import { DistributedLockService } from '../../services/distributed-lock.service';

describe('MassOrchestrationService Race Conditions', () => {
  let service: MassOrchestrationService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MassOrchestrationService,
        DistributedLockService,
        // ... other providers
      ],
    }).compile();

    service = module.get<MassOrchestrationService>(MassOrchestrationService);
  });

  it('should prevent concurrent optimization of same agent', async () => {
    const agentId = 'test-agent-123';
    const config = { userId: 'test-user' };

    // Start two optimizations concurrently
    const promise1 = service.optimizeAgentPrompt(agentId, config);
    const promise2 = service.optimizeAgentPrompt(agentId, config);

    // One should succeed, one should fail with lock error
    const results = await Promise.allSettled([promise1, promise2]);

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    expect(succeeded).toBe(1);
    expect(failed).toBe(1);

    const failedResult = results.find(
      (r) => r.status === 'rejected'
    ) as PromiseRejectedResult;
    expect(failedResult.reason.message).toContain('Could not acquire lock');
  });
});
```

**Test 3: Stress Test with Multiple Processes**

Create `/apps/backend/test/load/distributed-lock.stress.ts`:

```typescript
import { DistributedLockService } from '../../src/services/distributed-lock.service';
import { RedisService } from '../../src/services/redis.service';

async function stressTest() {
  const redisService = new RedisService();
  const lockService = new DistributedLockService(redisService);

  const lockKey = 'stress:test:lock';
  const numProcesses = 100;
  const results = { acquired: 0, failed: 0 };

  // Simulate 100 concurrent processes trying to acquire same lock
  const promises = Array.from({ length: numProcesses }, async (_, i) => {
    const token = await lockService.acquireLock(lockKey, {
      retries: 0, // No retries for stress test
    });

    if (token) {
      results.acquired++;
      await new Promise((resolve) => setTimeout(resolve, 10)); // Hold lock briefly
      await lockService.releaseLock(lockKey, token);
      return true;
    } else {
      results.failed++;
      return false;
    }
  });

  await Promise.all(promises);

  console.log('Stress test results:');
  console.log(`  Total processes: ${numProcesses}`);
  console.log(`  Successfully acquired: ${results.acquired}`);
  console.log(`  Failed to acquire: ${results.failed}`);
  console.log(`  Lock is exclusive: ${results.acquired === 1 ? 'YES' : 'NO'}`);

  await redisService.disconnect();
}

stressTest();
```

Run stress test:

```bash
pnpm --filter @the-new-fuse/backend run ts-node test/load/distributed-lock.stress.ts
```

**Test 4: Monitor Locks in Production**

Create monitoring endpoint:

```typescript
// In apps/backend/src/health/locks.health.ts

import { Controller, Get } from '@nestjs/common';
import { RedisService } from '../services/redis.service';

@Controller('health/locks')
export class LocksHealthController {
  constructor(private readonly redis: RedisService) {}

  @Get()
  async checkLocks() {
    const client = this.redis.getClient();
    const lockKeys = await client.keys('mass:*:*');

    const locks = await Promise.all(
      lockKeys.map(async (key) => {
        const value = await client.get(key);
        const ttl = await client.ttl(key);

        if (!value) return null;

        const [processId, timestamp] = value.split(':');

        return {
          key,
          processId,
          timestamp: parseInt(timestamp, 10),
          age: Date.now() - parseInt(timestamp, 10),
          ttl,
        };
      })
    );

    return {
      totalLocks: locks.filter((l) => l !== null).length,
      locks: locks.filter((l) => l !== null),
    };
  }
}
```

---

## Implementation Roadmap

### Priority 1: Critical Security (Week 1)

**Day 1-2: Centralized Config & Secret Management**

- [ ] Create AppConfigService
- [ ] Update all 6 files with hardcoded secrets
- [ ] Create .env.example
- [ ] Test fail-fast behavior
- [ ] Deploy to staging

**Day 3-4: Input Validation**

- [ ] Create all DTOs (auth, agent)
- [ ] Configure Global ValidationPipe
- [ ] Refactor controllers
- [ ] Write validation tests
- [ ] Deploy to staging

### Priority 2: Performance Optimization (Week 2)

**Day 1-3: N+1 Query Optimization**

- [ ] Add optimized repository methods
- [ ] Update ChatRoomsService
- [ ] Create MASS repository
- [ ] Update MassOrchestrationService
- [ ] Add database indexes
- [ ] Run performance tests

**Day 4-5: Distributed Locking**

- [ ] Create DistributedLockService
- [ ] Update MassOrchestrationService
- [ ] Add lock cleanup job
- [ ] Write race condition tests
- [ ] Deploy to staging

### Priority 3: Validation & Deployment (Week 3)

**Day 1-2: Integration Testing**

- [ ] Run full test suite
- [ ] Load testing with Artillery
- [ ] Security audit
- [ ] Performance benchmarks

**Day 3: Documentation**

- [ ] Update API documentation
- [ ] Update deployment guide
- [ ] Create runbook for monitoring

**Day 4-5: Production Deployment**

- [ ] Deploy to production
- [ ] Monitor metrics
- [ ] Verify all fixes working

---

## Monitoring & Observability

### Metrics to Track

**Security Metrics:**

- JWT secret validation failures at startup
- Input validation rejection rate
- Malicious input attempts blocked

**Performance Metrics:**

- Average query execution time for chat rooms
- N+1 query elimination (before: 1+2N, after: 1)
- Lock contention rate
- Lock acquisition success rate

**Health Checks:**

- `/health/config` - Verify env variables loaded
- `/health/locks` - Monitor active locks
- `/health/database` - Query performance

### Alerting Rules

```yaml
# Prometheus alerting rules

- alert: HighValidationRejectionRate
  expr: rate(validation_failures_total[5m]) > 10
  annotations:
    summary: High rate of input validation failures

- alert: SlowChatRoomQueries
  expr: histogram_quantile(0.95, chat_room_query_duration_seconds) > 0.5
  annotations:
    summary: Chat room queries taking >500ms at p95

- alert: LockContentionHigh
  expr: rate(lock_acquisition_failures_total[5m]) > 5
  annotations:
    summary: High lock contention detected

- alert: StaleLocks
  expr: lock_age_seconds > 3600
  annotations:
    summary: Locks held for over 1 hour detected
```

---

## Conclusion

These four architectural solutions provide production-ready fixes for all
critical issues:

1. **Hardcoded Secrets**: Centralized config with fail-fast validation ensures
   no weak secrets in production
2. **Input Validation**: Global ValidationPipe with DTOs prevents all malicious
   input
3. **N+1 Queries**: Optimized Drizzle queries with indexes reduce query count
   from O(N) to O(1)
4. **Race Conditions**: Distributed locking with Redis ensures safe concurrent
   job processing

All solutions follow NestJS best practices, use Drizzle ORM, integrate with
Redis, and include comprehensive testing strategies.

**Next Steps**: Proceed to Implementation Agent for code execution.
