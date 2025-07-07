import { Injectable } from '@nestjs/common';
import { PrismaService } from '@the-new-fuse/database';
import * as bcrypt from 'bcrypt';
import { User } from '@the-new-fuse/types';

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.prismaService.user.findUnique({ 
      where: { email } 
    });

    if (!user || !user.password) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async createUser(data: {
    email: string;
    password: string;
    name?: string;
  }): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.prismaService.user.create({
      data: {
        ...data,
        password: hashedPassword,
        role: 'USER',
        emailVerified: false
      }
    });
  }

  async logout(userId: string): Promise<void> {
    await this.prismaService.session.deleteMany({ 
      where: { userId } 
    });
  }
}
