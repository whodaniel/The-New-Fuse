import { Injectable, Logger } from '@nestjs/common';
import { drizzleUserRepository } from '@the-new-fuse/database';
import { RedisService } from '../services/redis.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly redisService: RedisService) {}

  async findOne(id: string) {
    return drizzleUserRepository.findById(id);
  }

  async findByEmail(email: string) {
    return drizzleUserRepository.findByEmail(email);
  }

  async create(userData: any) {
    return drizzleUserRepository.create(userData);
  }

  async update(id: string, userData: any) {
    return drizzleUserRepository.update(id, userData);
  }

  async delete(id: string) {
    return drizzleUserRepository.delete(id);
  }

  async findAll() {
    return drizzleUserRepository.findAll();
  }
}
