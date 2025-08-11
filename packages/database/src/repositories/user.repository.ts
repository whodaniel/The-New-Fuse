import { Injectable } from '@nestjs/common';
import { User, UserRole, Prisma } from '../../generated/prisma';
import { PrismaService } from '../prisma.service';

@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

  private mapDatabaseUserToUser(dbUser: User): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      username: dbUser.username,
      name: dbUser.name,
      hashedPassword: dbUser.hashedPassword,
      role: dbUser.role,
      roles: dbUser.roles,
      isActive: dbUser.isActive,
      lastLogin: dbUser.lastLogin,
      preferences: dbUser.preferences,
      refreshToken: dbUser.refreshToken,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt,
      deletedAt: dbUser.deletedAt,
      emailVerified: dbUser.emailVerified,
    };
  }

  private getUserSelect() {
    return {
      id: true,
      email: true,
      username: true,
      name: true,
      hashedPassword: true,
      role: true,
      roles: true,
      isActive: true,
      lastLogin: true,
      preferences: true,
      refreshToken: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
      emailVerified: true,
    };
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.getUserSelect()
    });

    if (!user) return null;
    return this.mapDatabaseUserToUser(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: this.getUserSelect()
    });

    if (!user) return null;
    return this.mapDatabaseUserToUser(user);
  }

  async findMany(filters?: Prisma.UserWhereInput): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: filters,
      select: this.getUserSelect(),
      orderBy: {
        createdAt: 'desc'
      }
    });

    return users.map(user => this.mapDatabaseUserToUser(user));
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        ...data,
        emailVerified: false,
      },
      select: this.getUserSelect()
    });
    return this.mapDatabaseUserToUser(user);
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      },
      select: this.getUserSelect()
    });
    return this.mapDatabaseUserToUser(user);
  }

  async delete(id: string): Promise<User> {
    const user = await this.prisma.user.delete({
      where: { id },
      select: this.getUserSelect()
    });

    return this.mapDatabaseUserToUser(user);
  }

  async findByRole(role: UserRole): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: { role: role as any }, // Cast to any to handle enum type
      select: this.getUserSelect(),
      orderBy: {
        createdAt: 'desc'
      }
    });

    return users.map(user => this.mapDatabaseUserToUser(user));
  }

  async updatePassword(id: string, hashedPassword: string): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        hashedPassword,
        updatedAt: new Date()
      },
      select: this.getUserSelect()
    });

    return this.mapDatabaseUserToUser(user);
  }

  async updateRole(id: string, role: UserRole): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        role,
        updatedAt: new Date()
      },
      select: this.getUserSelect()
    });

    return this.mapDatabaseUserToUser(user);
  }

  async searchUsers(query: string): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          {
            email: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            name: {
              contains: query,
              mode: 'insensitive'
            }
          }
        ]
      },
      select: this.getUserSelect(),
      orderBy: {
        createdAt: 'desc'
      }
    });

    return users.map(user => this.mapDatabaseUserToUser(user));
  }

  async getUserStats(): Promise<{ total: number; recent: number; byRole: Record<string, number> }> {
    const totalUsers = await this.prisma.user.count();

    const roleStats = await this.prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true
      }
    });

    const recentUsers = await this.prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    });

    return {
      total: totalUsers,
      recent: recentUsers,
      byRole: roleStats.reduce((acc: Record<string, number>, { role, _count }: { role: any, _count: any }) => {
        acc[role] = _count.id;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  async count(filters?: any): Promise<number> {
    return this.prisma.user.count({
      where: filters
    });
  }
}