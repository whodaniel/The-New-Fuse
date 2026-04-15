import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { drizzleUserRepository } from '@the-new-fuse/database';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class GoogleAuthService {
  private oauth2Client: OAuth2Client;

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService
  ) {
    this.oauth2Client = new OAuth2Client(
      configService.get('GOOGLE_CLIENT_ID'),
      configService.get('GOOGLE_CLIENT_SECRET'),
      configService.get('GOOGLE_REDIRECT_URI')
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
    let user = await drizzleUserRepository.findByEmail(payload.email);

    if (user) {
      // Update existing user
      // Note: picture field is not currently in schema, ignoring
      user = await drizzleUserRepository.update(user.id, {
        name: payload.name,
      });
      // Also ensure email verified
      if (!user.emailVerified) {
        await drizzleUserRepository.verifyEmail(user.id);
        user.emailVerified = true;
      }
    } else {
      // Create new user
      user = await drizzleUserRepository.create({
        email: payload.email,
        name: payload.name,
        hashedPassword: '', // No password for OAuth users
        emailVerified: true,
        role: 'USER',
        isActive: true,
      });
    }

    // Generate JWT
    const jwt = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return { token: jwt, user };
  }
}
