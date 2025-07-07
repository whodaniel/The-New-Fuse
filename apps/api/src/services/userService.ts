import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { User } from '@prisma/client';

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

  async createUser(email: string, password: string, username: string): Promise<User> {
    return this.create({
      email,
      password,
      username
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

  async create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    return this.prisma.user.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        ...data,
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

// Export the service instance for compatibility
export const userService = new UserService(null as any); // Will be properly injected in DI container