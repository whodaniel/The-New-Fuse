import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-github2';
import { VerifyCallback } from 'passport-oauth2';
import { PrismaService } from '../prisma/prisma.service';
import { BaseOAuthStrategy } from './base-oauth.strategy';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  private baseStrategy: BaseOAuthStrategy;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService
  ) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID') || 'MISSING_GITHUB_CLIENT_ID',
      clientSecret:
        configService.get<string>('GITHUB_CLIENT_SECRET') || 'MISSING_GITHUB_CLIENT_SECRET',
      callbackURL:
        configService.get<string>('GITHUB_CALLBACK_URL') ||
        `${configService.get<string>('API_URL')}/auth/github/callback`,
      scope: ['user:email'],
    });

    this.baseStrategy = new (class extends BaseOAuthStrategy {
      protected getProviderIdField(): 'githubId' {
        return 'githubId';
      }

      protected getProviderName(): string {
        return 'GitHub';
      }
    })(configService, prisma);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback
  ): Promise<any> {
    return this.baseStrategy.validateOAuthUser(profile, accessToken, refreshToken, done);
  }
}
