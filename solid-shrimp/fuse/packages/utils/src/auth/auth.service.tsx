

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService
    ) {}

    async generateToken(userId: string): Promise<string> {
        try {
            const secret = this.configService.get('JWT_SECRET');
            if (!secret) {
                throw new Error('JWT_SECRET not configured');
            }
            return this.jwtService.sign({ sub: userId }, {
                secret,
                expiresIn: '1d',
                algorithm: 'HS256'
            });
        } catch (error) {
            console.error('Error generating token:', error);
            throw new Error('Failed to generate authentication token');
        }
    }

    async validateUser(token: string): Promise<any> {
        try {
            const secret = this.configService.get('JWT_SECRET');
            if (!secret) {
                throw new Error('JWT_SECRET not configured');
            }
            return this.jwtService.verify(token, { secret });
        } catch (error) {
            if (error instanceof Error) {
                console.error('Error validating user:', error.message);
            }
            throw new Error('Invalid or expired token');
        }
    }

    async refreshToken(token: string): Promise<string | null> {
        try {
            const payload = await this.validateUser(token);
            if (!payload) {
                return null;
            }
            return this.generateToken(payload.sub);
        } catch (error) {
            console.error('Error refreshing token:', error);
            return null;
        }
    }
}
