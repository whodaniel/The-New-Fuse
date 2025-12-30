import { Injectable } from '@nestjs/common';
import { PrismaService, User } from '@the-new-fuse/database';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
// Prisma types removed during Drizzle migration

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async register({ name, email, password }: { name: string; email: string; password: string }) {
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
        role: 'USER',
      },
    });

    const accessToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'default-jwt-secret-change-in-production',
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET || 'default-jwt-refresh-secret-change-in-production',
      { expiresIn: '7d' }
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async login({ email, password }: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        hashedPassword: true,
        refreshToken: true,
        email: true,
        name: true,
        role: true,
      },
    });
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isValidPassword = await bcrypt.compare(password, user.hashedPassword);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    const accessToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'default-jwt-secret-change-in-production',
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET || 'default-jwt-refresh-secret-change-in-production',
      { expiresIn: '7d' }
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async getCurrentUser(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || 'your-jwt-refresh-secret-key'
      ) as { userId: string };

      const user = await this.prisma.user.findUnique({
        where: {
          id: decoded.userId,
          refreshToken,
        },
      });

      if (!user) {
        throw new Error('Invalid refresh token');
      }

      const accessToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'default-jwt-secret-change-in-production',
        { expiresIn: '15m' }
      );

      const newRefreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET || 'default-jwt-refresh-secret-change-in-production',
        { expiresIn: '7d' }
      );

      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: newRefreshToken },
      });

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }
}
