import { Injectable } from '@nestjs/common';
import { PrismaService } from '@the-new-fuse/database';
import { User } from '@the-new-fuse/database/generated/prisma';

@Injectable()
export class DatabaseService {
  constructor(private readonly prisma: PrismaService) {}

  get client() {
    return this.prisma;
  }

  get llmConfigs() {
    return this.prisma.lLMConfig;
  }

  async findUser(where: { email: string }): Promise<User | null> {
    return this.prisma.user.findUnique({ where });
  }

  async deleteUserSessions(where: { userId: string }): Promise<void> {
    await this.prisma.authSession.deleteMany({ where });
  }

  async createUser(data: {
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
  }): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data
    });
  }

  async deleteUser(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  async findUserById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async health(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      return false;
    }
  }
}