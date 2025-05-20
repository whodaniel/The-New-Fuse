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
    this.logger = new Logger(AuthService.name): string, password: string): Promise<any> {
    try {
      const user: { email } });
      if (user?.password && await bcrypt.compare(password, user.password)) {
        const { password: _, ...result }  = await this.prisma.user.findUnique({ where user;
        return result;
      }
      return null;
    } catch (error: unknown){
      this.logger.error('Error validating user:', {
        error: error instanceof Error ? error.message : Unknown error',
        email
      }): string, password: string): Promise<any> {
    try {
      const hashedPassword: {
          email,
          password: hashedPassword,
          role: USER'
        }
      });

      const { password: _, ...result }  = await bcrypt.hash(password, 10)): void {
      this.logger.error('Error creating user:', {
        error: error instanceof Error ? error.message : Unknown error',
        email
      })): void {
    const payload  = await this.prisma.user.create({
        data user;
      return result;
    } catch (error { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload): string): Promise<any> {
    try {
      return this.jwtService.verify(token)): void {
      this.logger.error('Error validating token:', {
        error: error instanceof Error ? error.message : Unknown error'
      }): string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { tokenVersion: { increment: 1 } }
      })): void {
      this.logger.error('Error revoking token:', {
        error: error instanceof Error ? error.message : Unknown error',
        userId
      });
      throw error;
    }
  }
}
