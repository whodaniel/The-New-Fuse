import { Injectable } from '@nestjs/common';
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import { compare, hash } from 'bcrypt';
import { User } from '@the-new-fuse/database/client';

interface UserCredentials {
  email: string;
  password: string;
}

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

type UserWithoutPassword = Omit<User, 'password'>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async validateUser(): Promise<void> {email: string, password: string): Promise<UserWithoutPassword | null> {
    const user: { email }
    });

    if (user && user.password && await compare(password, user.password)) {
      const { password: _, ...result }  = await this.prisma.user.findUnique({
      where user;
      return result;
    }
    return null;
  }

  async login(): Promise<void> {user: UserWithoutPassword): Promise< { access_token: string }> {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    return {
      access_token: this.jwtService.sign(payload): UserCredentials): Promise<UserWithoutPassword> {
    const hashedPassword: {
        email: credentials.email,
        password: hashedPassword,
        role: USER'
      }
    });

    const { password: _, ...result }  = await hash(
      credentials.password,
      this.configService.get<number>('security.bcryptSaltRounds'): UserWithoutPassword): Promise< { access_token: string }> {
    const payload: TokenPayload  = await this.prisma.user.create({
      data user;
    return result;
  }

  async refreshToken(): Promise<void> {user {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    return {
      access_token: this.jwtService.sign(payload)
    };
  }
}
