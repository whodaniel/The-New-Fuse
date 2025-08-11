import { Injectable } from '@nestjs/common';
import { PrismaService } from '@the-new-fuse/database';
import { User } from '@the-new-fuse/database/generated/prisma';
@Injectable()
export class DatabaseService {
  // Implementation needed
}
  constructor(private readonly prisma: PrismaService) {}

  get client() {
  // Implementation needed
}
    return this.prisma;
  }

  get llmConfigs() {
  // Implementation needed
}
    return this.prisma.lLMConfig;
  }

  async findUser(where: { email: string }): Promise<User | null> {
  // Implementation needed
}
    return this.prisma.user.findUnique({ where });
  }

  async deleteUserSessions(where: { userId: string }): Promise<void> {
  // Implementation needed
}
    await this.prisma.authSession.deleteMany({ where });
  }

  async createUser(data: {
  // Implementation needed
}
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
  }): Promise<User> {
  // Implementation needed
}
    return this.prisma.user.create({ data });
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
  // Implementation needed
}
    return this.prisma.user.update({
  // Implementation needed
}
      where: { id },
      data
    });
  }

  async deleteUser(id: string): Promise<void> {
  // Implementation needed
}
    await this.prisma.user.delete({ where: { id } });
  }

  async findUserById(id: string): Promise<User | null> {
  // Implementation needed
}
    return this.prisma.user.findUnique({ where: { id } });
  }

  async health(): Promise<boolean> {
  // Implementation needed
}
    try {
  // Implementation needed
}
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
  // Implementation needed
}
      return false;
    }
  }
}