import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../services/redis.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async create(userData: any) {
    return this.prisma.user.create({
      data: userData,
    });
  }

  async update(id: string, userData: any) {
    return this.prisma.user.update({
      where: { id },
      data: userData,
    });
  }

  async delete(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async findAll() {
    return this.prisma.user.findMany();
  }
}