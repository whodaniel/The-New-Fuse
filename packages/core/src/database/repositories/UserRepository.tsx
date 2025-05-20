import { EntityRepository } from 'typeorm';
import { BaseRepository } from './BaseRepository.js';
import { User } from '../entities/User.js';

@EntityRepository(User)
export class UserRepository extends BaseRepository<User> {
  async findByEmail(email: string): Promise<User | undefined> {
    return this.findOne({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | undefined> {
    return this.findOne({ where: { username } });
  }

  async createUser(data: {
    username: string;
    email: string;
    password: string;
    role?: string;
  }): Promise<User> {
    const user = new User();
    user.username = data.username;
    user.email = data.email;
    user.passwordHash = data.password;
    user.role = data.role || 'user';

    return this.save(user);
  }

  async updateUserProfile(
    userId: string,
    data: Partial<Pick<User, 'username' | 'email'>>
  ): Promise<User> {
    await this.update(userId, data);
    return this.findOneOrFail({ where: { id: userId } });
  }

  async changePassword(userId: string, newPassword: string): Promise<boolean> {
    const user = await this.findOneOrFail({ where: { id: userId } });
    user.passwordHash = newPassword;
    await this.save(user);
    return true;
  }
}
