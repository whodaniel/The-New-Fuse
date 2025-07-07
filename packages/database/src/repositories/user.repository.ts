import { Injectable } from '@nestjs/common';
import { User, UserRole } from '../types';
import { PrismaService } from '../prisma.service';

@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

  private mapDatabaseUserToUser(dbUser: any): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name || undefined, // Convert null to undefined
      passwordHash: dbUser.passwordHash,
      role: dbUser.role,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt
    };
  }

  private getUserSelect() {
    return {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
      role: true,
      createdAt: true,
      updatedAt: true
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

  async findMany(filters?: any): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: filters,
      select: this.getUserSelect(),
      orderBy: {
        createdAt: 'desc'
      }
    });

    return users.map(user => this.mapDatabaseUserToUser(user));
  }

  async create(data: any): Promise<User> {
    const dbData = {
      email: data.email,
      name: data.name,
      passwordHash: data.passwordHash,
      role: data.role
    };

    const user = await this.prisma.user.create({
      data: dbData,
      select: this.getUserSelect()
    });

    return this.mapDatabaseUserToUser(user);
  }

  async update(id: string, data: any): Promise<User> {
    const dbData: any = {
      updatedAt: new Date()
    };

    if (data.email !== undefined) dbData.email = data.email;
    if (data.name !== undefined) dbData.name = data.name;
    if (data.passwordHash !== undefined) dbData.passwordHash = data.passwordHash;
    if (data.role !== undefined) dbData.role = data.role;

    const user = await this.prisma.user.update({
      where: { id },
      data: dbData,
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

  async updatePassword(id: string, passwordHash: string): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        passwordHash,
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
        role: role as any, // Cast to any to handle enum type
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

  async getUserStats(): Promise<any> {
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