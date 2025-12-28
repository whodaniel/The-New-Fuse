import { Injectable } from '@nestjs/common';
import { PrismaService } from '@the-new-fuse/database';
import { User, Prisma } from '@the-new-fuse/database/generated/prisma';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async findOne(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id }
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email }
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username }
    });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.findByEmail(email);
  }

  async findUserByUsername(username: string): Promise<User | null> {
    return this.findByUsername(username);
  }

  async createUser(email: string, hashedPassword: string, username: string): Promise<User> {
    return this.prisma.user.create({
      data: {
        email,
        hashedPassword,
        username,
        role: 'USER',
        // Add other required fields if any, based on your schema.prisma
      },
    });
  }

  async getUserProfileById(userId: string): Promise<User | null> {
    return this.findOne(userId);
  }

  async updateUserProfileById(userId: string, profileData: Partial<User>): Promise<User | null> {
    try {
      return await this.update(userId, profileData);
    } catch (error) {
      return null;
    }
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    // Remove any readonly/computed fields that Prisma doesn't allow in updates
    const { id: _id, createdAt, ...updateData } = data as any;
    return this.prisma.user.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });
  }

  async delete(id: string): Promise<User> {
    return this.prisma.user.delete({
      where: { id }
    });
  }
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  bio?: string;
  preferences?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}