import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service.js';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class GoogleAuthService {
  private oauth2Client: OAuth2Client;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {
    this.oauth2Client = new OAuth2Client(
      configService.get('GOOGLE_CLIENT_ID'),
      configService.get('GOOGLE_CLIENT_SECRET'),
      configService.get('GOOGLE_REDIRECT_URI'),
    );
  }

  async handleCallback(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    const ticket = await this.oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: this.configService.get('GOOGLE_CLIENT_ID'),
    });

    const payload = ticket.getPayload();
    
    // Find or create user
    const user = await this.prisma.user.upsert({
      where: { email: payload.email },
      update: {
        name: payload.name,
        picture: payload.picture,
      },
      create: {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        role: 'USER',
      },
    });

    // Generate JWT
    const jwt = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return { token: jwt, user };
  }
}