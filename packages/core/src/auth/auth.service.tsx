import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@the-new-fuse/utils';

@Injectable()
export class AuthService {
  private readonly logger: Logger;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {
    this.logger = new Logger(AuthService.name);
  }

  async validateUser(email: string, password: string): Promise<any> {
    try {
      const user = await this.prisma.user.findUnique({ where: { email } });
      if (user?.password && await bcrypt.compare(password, user.password)) {
        const { password: _, ...result } = user;
        return result;
      }
      return null;
    } catch (error: unknown) {
      this.logger.error('Error validating user:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email
      });
      throw error;
    }
  }

  async createUser(email: string, password: string): Promise<any> {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'USER'
        }
      });

      const { password: _, ...result } = user;
      return result;
    } catch (error: unknown) {
      this.logger.error('Error creating user:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email
      });
      throw error;
    }
  }

  async login(user: any): Promise<{ access_token: string }> {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload)
    };
  }

  async validateToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token);
    } catch (error: unknown) {
      this.logger.error('Error validating token:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async revokeToken(userId: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { tokenVersion: { increment: 1 } }
      });
    } catch (error: unknown) {
      this.logger.error('Error revoking token:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      throw error;
    }
  }
}
