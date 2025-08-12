import { Injectable } from '@nestjs/common';
import { PrismaService } from '@the-new-fuse/database';
import { User } from '@the-new-fuse/database/generated/prisma';
@Injectable()
export class DatabaseService {
  constructor(private readonly prisma: PrismaService) {}

  get client() {
return this.prisma;
  }}

  get llmConfigs() {
return this.prisma.lLMConfig;
  }}

  async findUser(): unknown {
    return this.prisma.user.findUnique({ where });
  }

  async deleteUserSessions(): unknown {
    await this.prisma.authSession.deleteMany({ where });
  }

  async createUser(): unknown {
    return this.prisma.user.create({ data });
  }

  async updateUser(): unknown {
    return this.prisma.user.update({
where: { id },
  }      data
    });
  }

  async deleteUser(): unknown {
    await this.prisma.user.delete({ where: { id } });
  }

  async findUserById(): unknown {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async health(): unknown {
    try {
await this.prisma.$queryRaw`SELECT 1`;
  }      return true;
    } catch (error) {
return false;
  }}
  }
}