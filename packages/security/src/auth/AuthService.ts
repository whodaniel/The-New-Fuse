import * as jwt from 'jsonwebtoken';
import { Request } from 'express';
import { PrismaService } from '../prisma.service.js';
import { HashingService } from './hashing.service.js';

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
    private readonly prisma: PrismaService,
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
      
      const user = await this.prisma.user.findUnique({
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
