#!/bin/bash
set -e

echo "Starting backend TypeScript error fix process..."

# Step 1: Create missing directories if they don't exist
echo "Creating missing directories..."
mkdir -p src/events
mkdir -p src/auth/events
mkdir -p src/cache
mkdir -p src/utils

# Step 2: Create auth.utils.ts file
echo "Creating auth.utils.ts..."
cat > src/utils/auth.utils.ts << 'EOL'
import * as bcrypt from 'bcrypt';

/**
 * Compare a plain text password with a hashed password
 * @param plainTextPassword The plain text password to compare
 * @param hashedPassword The hashed password to compare against
 * @returns Promise<boolean> True if passwords match, false otherwise
 */
export async function comparePasswords(plainTextPassword: string, hashedPassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plainTextPassword, hashedPassword);
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
}

/**
 * Hash a plain text password
 * @param password The plain text password to hash
 * @returns Promise<string> The hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}
EOL

# Step 3: Create logging.service.ts file
echo "Creating logging.service.ts..."
cat > src/services/logging.service.ts << 'EOL'
import { Injectable } from '@nestjs/common';
import { LoggingService as CoreLoggingService } from './loggingService';

@Injectable()
export class LoggingService {
  private coreLogger: CoreLoggingService;

  constructor() {
    // Create a default configuration for the logger
    const config = {
      level: process.env.LOG_LEVEL || 'info',
      format: 'json' as 'json' | 'simple',
      transports: {
        console: true,
        file: process.env.LOG_TO_FILE === 'true' ? {
          filename: process.env.LOG_FILE_PATH || 'logs/app.log',
          maxFiles: parseInt(process.env.LOG_MAX_FILES || '5', 10),
          maxSize: process.env.LOG_MAX_SIZE || '10m'
        } : undefined
      }
    };

    this.coreLogger = new CoreLoggingService(config);
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.coreLogger.info(message, metadata);
  }

  error(message: string, error?: Error | any, metadata?: Record<string, any>): void {
    this.coreLogger.error(message, { ...metadata, error });
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.coreLogger.warn(message, metadata);
  }

  debug(message: string, metadata?: Record<string, any>): void {
    this.coreLogger.debug(message, metadata);
  }

  setContext(context: string): void {
    this.coreLogger.setContext(context);
  }
}
EOL

# Step 4: Create event-bus.service.ts file
echo "Creating event-bus.service.ts..."
cat > src/events/event-bus.service.ts << 'EOL'
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * Base class for all events in the system
 */
export abstract class BaseEvent {
  constructor(public readonly timestamp: Date = new Date()) {}
}

/**
 * Event bus service for publishing and subscribing to events
 */
@Injectable()
export class EventBus {
  constructor(private eventEmitter: EventEmitter2) {}

  /**
   * Publish an event to the event bus
   * @param event The event to publish
   */
  async publish<T extends BaseEvent>(event: T): Promise<void> {
    const eventName = event.constructor.name;
    this.eventEmitter.emit(eventName, event);
  }

  /**
   * Subscribe to an event
   * @param eventName The name of the event to subscribe to
   * @param handler The handler function to call when the event is published
   */
  subscribe<T extends BaseEvent>(eventName: string, handler: (event: T) => void): void {
    this.eventEmitter.on(eventName, handler);
  }

  /**
   * Unsubscribe from an event
   * @param eventName The name of the event to unsubscribe from
   * @param handler The handler function to remove
   */
  unsubscribe<T extends BaseEvent>(eventName: string, handler: (event: T) => void): void {
    this.eventEmitter.off(eventName, handler);
  }
}
EOL

# Step 5: Create auth.events.ts file
echo "Creating auth.events.ts..."
cat > src/auth/events/auth.events.ts << 'EOL'
import { BaseEvent } from '../../events/event-bus.service';

/**
 * Event emitted when a user logs in
 */
export class UserLoginEvent extends BaseEvent {
  constructor(public readonly user: any) {
    super();
  }
}

/**
 * Event emitted when a user logs out
 */
export class UserLogoutEvent extends BaseEvent {
  constructor(public readonly userId: string) {
    super();
  }
}

/**
 * Event emitted when a user registers
 */
export class UserRegisteredEvent extends BaseEvent {
  constructor(public readonly user: any) {
    super();
  }
}

/**
 * Event emitted when a user's password is reset
 */
export class PasswordResetEvent extends BaseEvent {
  constructor(public readonly userId: string) {
    super();
  }
}
EOL

# Step 6: Create ws-auth.guard.ts file
echo "Creating ws-auth.guard.ts..."
cat > src/auth/ws-auth.guard.ts << 'EOL'
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { LoggingService } from '../services/logging.service';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private logger: LoggingService
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>();
    const token = this.extractTokenFromHeader(client);
    
    if (!token) {
      this.logger.warn('WebSocket connection attempt without token');
      throw new WsException('Unauthorized');
    }
    
    try {
      const payload = this.jwtService.verify(token);
      // Attach user to socket
      client['user'] = payload;
      return true;
    } catch (error) {
      this.logger.error('WebSocket authentication failed', error);
      throw new WsException('Unauthorized');
    }
  }

  private extractTokenFromHeader(client: Socket): string | undefined {
    const auth = client.handshake.headers.authorization;
    if (!auth) return undefined;
    
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return undefined;
    
    return parts[1];
  }
}
EOL

# Step 7: Create cache.service.ts file
echo "Creating cache.service.ts..."
cat > src/cache/cache.service.ts << 'EOL'
import { Injectable } from '@nestjs/common';
import { RedisService } from '../services/redis.service';
import { LoggingService } from '../services/logging.service';

@Injectable()
export class CacheService {
  constructor(
    private readonly redisService: RedisService,
    private readonly logger: LoggingService
  ) {}

  /**
   * Set a value in the cache
   * @param key The key to store the value under
   * @param value The value to store
   * @param ttl Time to live in seconds (optional)
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await this.redisService.getClient().set(key, serializedValue, 'EX', ttl);
      } else {
        await this.redisService.getClient().set(key, serializedValue);
      }
      this.logger.debug(`Cache set: ${key}`, { ttl });
    } catch (error) {
      this.logger.error(`Failed to set cache for key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Get a value from the cache
   * @param key The key to retrieve
   * @returns The stored value or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redisService.getClient().get(key);
      if (!value) return null;
      
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Failed to get cache for key: ${key}`, error);
      return null;
    }
  }

  /**
   * Delete a value from the cache
   * @param key The key to delete
   */
  async delete(key: string): Promise<void> {
    try {
      await this.redisService.getClient().del(key);
      this.logger.debug(`Cache deleted: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete cache for key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Check if a key exists in the cache
   * @param key The key to check
   * @returns True if the key exists, false otherwise
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redisService.getClient().exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to check existence for key: ${key}`, error);
      return false;
    }
  }
}
EOL

# Step 8: Update tsconfig.json to include the new paths
echo "Updating tsconfig.json..."
cat > tsconfig.json << 'EOL'
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "es2017",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false,
    "paths": {
      "@/*": ["src/*"],
      "@the-new-fuse/core": ["../../packages/core/src"],
      "@the-new-fuse/types": ["../../packages/types/src"],
      "@the-new-fuse/utils": ["../../packages/utils/src"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOL

# Step 9: Install required dependencies
echo "Installing required dependencies..."
yarn add -D @types/bcrypt @types/socket.io @nestjs/event-emitter

# Step 10: Run TypeScript check to verify fixes
echo "Running TypeScript check..."
yarn tsc --noEmit

echo "TypeScript fixes completed! Please review the changes and make any necessary adjustments."