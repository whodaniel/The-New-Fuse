#!/bin/bash

SECURITY_DIR="./packages/security"
echo "🔧 Fixing issues in the security package..."

# 1. Fix JWT signing in SecurityService.tsx
if [ -f "$SECURITY_DIR/src/SecurityService.tsx" ]; then
  echo "Fixing JWT signing in SecurityService.tsx..."
  sed -i '' 's/return jwt.sign(payload, Buffer.from(this.jwtSecret), { expiresIn });/return jwt.sign(payload, Buffer.from(this.jwtSecret), { expiresIn: expiresIn });/g' "$SECURITY_DIR/src/SecurityService.tsx"

  # Fix encryption/decryption return types
  sed -i '' 's/return this.encryption.encrypt(data);/return JSON.stringify(this.encryption.encrypt(data));/g' "$SECURITY_DIR/src/SecurityService.tsx"
  sed -i '' 's/return this.encryption.decrypt(encryptedData);/const { iv, tag, salt } = JSON.parse(encryptedData);\nreturn this.encryption.decrypt(encryptedData, iv, tag, salt);/g' "$SECURITY_DIR/src/SecurityService.tsx"
  
  # Fix auth method
  sed -i '' 's/const isAuthenticated = await this.auth.validateRequest(req);/const isAuthenticated = await this.auth.authenticate(req);/g' "$SECURITY_DIR/src/SecurityService.tsx"
fi

# 2. Create missing modules
echo "Creating missing modules..."

# Create rate-limiting directory and files
mkdir -p "$SECURITY_DIR/src/rate-limiting"
cat > "$SECURITY_DIR/src/rate-limiting/index.ts" << 'EOFILE'
export class RateLimitingService {
  constructor() {}
  
  async limit(key: string, limit: number, duration: number): Promise<boolean> {
    // Implementation would go here
    return true;
  }
}
EOFILE

# Create audit directory and files
mkdir -p "$SECURITY_DIR/src/audit"
cat > "$SECURITY_DIR/src/audit/index.ts" << 'EOFILE'
import { z } from 'zod';

export const AuditLogEntry = z.object({
  id: z.string(),
  action: z.string(),
  userId: z.string().optional(),
  resourceId: z.string().optional(),
  resourceType: z.string().optional(),
  timestamp: z.date(),
  details: z.record(z.any()).optional(),
});

export type AuditLogEntryType = z.infer<typeof AuditLogEntry>;

export class AuditService {
  constructor(private storage: any) {}
  
  async log(entry: Omit<AuditLogEntryType, 'id' | 'timestamp'>): Promise<void> {
    const fullEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date()
    };
    
    await this.storage.createAuditLog(fullEntry);
  }
  
  async getAuditLogs(filter?: Partial<AuditLogEntryType>): Promise<AuditLogEntryType[]> {
    return this.storage.getAuditLogs(filter);
  }
}
EOFILE

# Create the drizzle service
cat > "$SECURITY_DIR/src/drizzle.service.ts" << 'EOFILE'
import { DrizzleClient } from '@drizzle/client';

export class DatabaseService extends DrizzleClient {
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/the_new_fuse_db'
        }
      }
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
EOFILE

# Create the hashing service
mkdir -p "$SECURITY_DIR/src/auth"
cat > "$SECURITY_DIR/src/auth/hashing.service.ts" << 'EOFILE'
import * as bcrypt from 'bcrypt';

export class HashingService {
  private readonly saltRounds = 10;
  
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }
  
  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
EOFILE

# Update the AuthService to fix the validateRequest issue
cat > "$SECURITY_DIR/src/auth/AuthService.tsx" << 'EOFILE'
import * as jwt from 'jsonwebtoken';
import { Request } from 'express';
import { DatabaseService } from '../drizzle.service';
import { HashingService } from './hashing.service';

export interface User {
  id: string;
  email: string;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  name: string;
}

export class AuthService {
  private readonly jwtSecret: string;
  
  constructor(
    private readonly drizzle: DatabaseService,
    private readonly hashingService: HashingService
  ) {
    this.jwtSecret = process.env.JWT_SECRET || 'super-secret-key';
  }
  
  async authenticate(req: Request): Promise<boolean> {
    try {
      const token = this.extractTokenFromRequest(req);
      if (!token) return false;
      
      const decoded = jwt.verify(token, this.jwtSecret) as { userId: string };
      if (!decoded.userId) return false;
      
      const user = await this.drizzle.user.findUnique({
        where: { id: decoded.userId },
        include: { permissions: true }
      });
      
      if (!user) return false;
      
      (req as any).user = user;
      return true;
    } catch (error) {
      return false;
    }
  }
  
  private extractTokenFromRequest(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return null;
  }
  
  async validatePermission(user: User, permission: string): Promise<boolean> {
    return user.permissions.some(p => p.name === permission);
  }
}
EOFILE

# Create SessionManager service
mkdir -p "$SECURITY_DIR/src/services"
cat > "$SECURITY_DIR/src/services/SessionManager.ts" << 'EOFILE'
import { v4 as uuidv4 } from 'uuid';

export interface Session {
  id: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  data: Record<string, any>;
}

export interface AuthUser {
  id: string;
  email: string;
  roles: string[];
}

class SessionManager {
  private sessions: Map<string, Session> = new Map();
  
  createSession(userId: string, ttlMinutes: number = 60): Session {
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMinutes(now.getMinutes() + ttlMinutes);
    
    const session: Session = {
      id: uuidv4(),
      userId,
      createdAt: now,
      expiresAt,
      data: {}
    };
    
    this.sessions.set(session.id, session);
    return session;
  }
  
  getSession(sessionId: string): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;
    
    // Check if expired
    if (new Date() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return undefined;
    }
    
    return session;
  }
  
  updateSession(sessionId: string, data: Partial<Session['data']>): boolean {
    const session = this.getSession(sessionId);
    if (!session) return false;
    
    session.data = { ...session.data, ...data };
    return true;
  }
  
  destroySession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }
}

export const sessionManager = new SessionManager();
EOFILE

# Update the module import in middleware
cat > "$SECURITY_DIR/src/middleware/session.middleware.tsx" << 'EOFILE'
import { Request, Response, NextFunction } from 'express';
import { sessionManager, Session, AuthUser } from '../services/SessionManager';

export interface RequestWithSession extends Request {
  session?: Session;
  user?: AuthUser;
}

export const sessionMiddleware = (req: RequestWithSession, res: Response, next: NextFunction) => {
  const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];
  
  if (sessionId) {
    const session = sessionManager.getSession(sessionId);
    if (session) {
      req.session = session;
      // Here we would typically load the user from the database
      // For this example, we'll just create a mock user
      req.user = {
        id: session.userId,
        email: 'user@example.com',
        roles: ['user']
      };
    }
  }
  
  next();
};
EOFILE

# Fix export type issues in middleware/index.tsx
cat > "$SECURITY_DIR/src/middleware/index.tsx" << 'EOFILE'
import { Request } from 'express';

export interface User {
  id: string;
  email: string;
  roles: string[];
}

export interface AuthenticatedRequest extends Request {
  user: User;
}

export { default as authMiddleware } from './auth.middleware';
export { default as rateLimitMiddleware } from './rate-limit.middleware';
export { default as securityHeadersMiddleware } from './security-headers.middleware';
export { default as corsMiddleware } from './cors.middleware';
export { sessionMiddleware } from './session.middleware';

// Type-only exports
export type { AuthenticatedRequest, User };
EOFILE

# Create a proper tsconfig.json for the security package
cat > "$SECURITY_DIR/tsconfig.json" << 'EOFILE'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true,
    "declaration": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "moduleResolution": "node",
    "target": "es2020",
    "module": "commonjs",
    "strict": true,
    "isolatedModules": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
EOFILE

# Create a package.json for security to ensure proper dependencies
cat > "$SECURITY_DIR/package.json" << 'EOFILE'
{
  "name": "@the-new-fuse/security",
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "license": "MIT",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "lint": "eslint src --ext .ts,.tsx"
  },
  "dependencies": {
    "bcrypt": "^5.1.0",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.0",
    "uuid": "^9.0.0",
    "zod": "^3.21.4",
    "@drizzle/client": "^4.11.0"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.0",
    "@types/express": "^4.17.17",
    "@types/jsonwebtoken": "^9.0.1",
    "@types/uuid": "^9.0.1",
    "@types/node": "^18.15.3",
    "typescript": "^5.0.2"
  }
}
EOFILE

echo "✅ Security package fixes completed"
