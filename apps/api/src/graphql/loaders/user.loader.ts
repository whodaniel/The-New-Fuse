import * as DataLoader from 'dataloader';
import { Injectable, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from '../../entities/user.entity';

@Injectable({ scope: Scope.REQUEST })
export class UserLoader {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private readonly batchUsers = new DataLoader<string, User>(
    async (userIds: readonly string[]) => {
      const users = await this.userRepository.find({
        where: { id: In([...userIds]) },
      });

      const userMap = new Map(users.map((user) => [user.id, user]));
      return userIds.map((id) => userMap.get(id) || null) as User[];
    },
  );

  async load(userId: string): Promise<User> {
    return this.batchUsers.load(userId);
  }

  async loadMany(userIds: string[]): Promise<User[]> {
    return this.batchUsers.loadMany(userIds) as Promise<User[]>;
  }
}
