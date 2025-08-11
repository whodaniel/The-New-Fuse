import * as jwt from 'jsonwebtoken';
import { Request } from 'express';
import { PrismaService } from '../prisma.service';
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

// Extended types for Prisma queries
interface UserWithPermissions {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
  passwordHash: string;
  role: any;
  userPermissions: Array<{
    permission: {
      id: string;
      name: string;
    };
  }>;
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
        include: { 
          userPermissions: { 
            include: { 
              permission: true 
            } 
          } 
        } as any
      }) as UserWithPermissions | null;
      
      if (!user) return false;
      
      // Transform user data to match the expected User interface
      const transformedUser: User = {
        id: user.id,
        email: user.email,
        permissions: user.userPermissions.map((up: any) => ({
          id: up.permission.id,
          name: up.permission.name
        }))
      };
      
      (req as any).user = transformedUser;
      return true;
    } catch {
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
