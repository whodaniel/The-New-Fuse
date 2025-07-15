import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  async findOne(id: string) {
    return {
      id: id,
      email: 'test@example.com',
      name: 'Test User',
    };
  }
}