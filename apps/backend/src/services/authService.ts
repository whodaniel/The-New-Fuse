import { Injectable } from '@nestjs/common';
import { PrismaService } from '@the-new-fuse/database';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '@the-new-fuse/types';

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}

  private transformPrismaUser(prismaUser: any): User {
    return {
      id: prismaUser.id,
      username: prismaUser.name || prismaUser.email.split('@')[0],
      email: prismaUser.email,
      displayName: prismaUser.name,
      avatarUrl: prismaUser.avatar || prismaUser.picture,
      roles: [prismaUser.role?.toLowerCase() as UserRole] || ['user' as UserRole],
      isActive: prismaUser.emailVerified ?? true,
      lastLogin: null,
      authProvider: prismaUser.googleId ? 'google' : 'local',
      authProviderId: prismaUser.googleId,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt
    };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const prismaUser = await this.prismaService.user.findUnique({ 
      where: { email } 
    });

    if (!prismaUser || !prismaUser.password) {
      return null;
    }

    const isValid = await bcrypt.compare(password, prismaUser.password);
    return isValid ? this.transformPrismaUser(prismaUser) : null;
  }

  async createUser(data: {
    email: string;
    password: string;
    name?: string;
  }): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const prismaUser = await this.prismaService.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: 'user',
        emailVerified: false
      }
    });
    return this.transformPrismaUser(prismaUser);
  }

  async logout(userId: string): Promise<void> {
    // TODO: Implement session management when session model is added to Prisma schema
    // await this.prismaService.session.deleteMany({ 
    //   where: { userId } 
    // });
  }
}
