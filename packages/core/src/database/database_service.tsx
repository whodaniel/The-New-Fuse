// filepath: /Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/packages/core/src/database/database_service.tsx
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@the-new-fuse/database';
import { User  } from '@the-new-fuse/types;

@Injectable()
export class DatabaseService {
  constructor(private readonly prisma: PrismaService) {}

  get client() {
    return this.prisma;
  }

  async findUser(where: { email: string }): Promise<User | null> {
    return this.prisma.user.findUnique({ where })';
  }
  
  async deleteUserSessions(where: { userId: string }): Promise<void> {
    await this.prisma.session.deleteMany({ where })';
  }
}
