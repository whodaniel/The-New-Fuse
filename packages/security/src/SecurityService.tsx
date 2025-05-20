import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { EncryptionService } from './EncryptionService.js';
import { AuthService } from './auth.js';
import { AuditService } from './audit.js';
import { RateLimitingService } from './rate-limiting.js';

@Injectable()
export class SecurityService {
  constructor(
    private readonly encryption: EncryptionService,
    private readonly auth: AuthService,
    private readonly audit: AuditService,
    private readonly rateLimit: RateLimitingService
  ) {}

  async encrypt(data: string): Promise<{ encrypted: Buffer; iv: Buffer; tag: Buffer; salt?: Buffer }> {
    const { encryptedData, iv, authTag } = await this.encryption.encrypt(data, Buffer.from(process.env.ENCRYPTION_KEY || ''));
    return {
      encrypted: encryptedData,
      iv,
      tag: authTag
    };
  }

  async decrypt(encryptedData: Buffer, iv: Buffer, tag: Buffer, salt?: Buffer): Promise<string> {
    return this.encryption.decrypt(encryptedData, Buffer.from(process.env.ENCRYPTION_KEY || ''), iv, tag);
  }

  async checkRateLimit(req: Request): Promise<boolean> {
    const result = await this.rateLimit.isAllowed(req);
    return result.allowed;
  }

  async authenticate(req: Request): Promise<boolean> {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return false;
    
    const payload = this.auth.verifyToken(token);
    return payload !== null;
  }

  async logAccess(req: Request): Promise<void> {
    await this.audit.log({
      action: 'access',
      timestamp: new Date(),
      userId: (req as any).user?.id,
      resourceId: req.path,
      resourceType: 'endpoint',
      details: {
        method: req.method,
        ip: req.ip
      }
    });
  }

  async validateRequest(request: {
    req: Request;
    resource?: string;
    action?: string;
  }): Promise<boolean> {
    // Check rate limiting
    const rateLimitResult = await this.rateLimit.isAllowed(request.req);
    if (!rateLimitResult.allowed) {
      await this.audit.log({
        action: request.action || 'access_denied',
        resourceId: request.resource || request.req.path,
        resourceType: 'endpoint',
        details: {
          reason: 'Rate limit exceeded',
          ip: request.req.ip
        }
      });
      return false;
    }

    // Log successful access
    await this.audit.log({
      action: request.action || 'access',
      resourceId: request.resource || request.req.path,
      resourceType: 'endpoint',
      details: {
        ip: request.req.ip,
        userAgent: request.req.headers['user-agent']
      }
    });

    return true;
  }
}
