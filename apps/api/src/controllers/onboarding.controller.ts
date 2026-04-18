import { Body, Controller, ForbiddenException, Post, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AuthLevel, RequireAuthLevel } from '../guards/secure-auth.guard.js';
import { AuthService } from '../services/auth.service.js';

type OnboardingStartDto = {
  inviteCode?: string;
  onboardingToken?: string;
};

const isTruthy = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  if (typeof value !== 'string') return false;
  return ['1', 'true', 'yes', 'on', 'enabled'].includes(value.trim().toLowerCase());
};

@Controller('onboarding')
@RequireAuthLevel(AuthLevel.PUBLIC)
export class OnboardingController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) {}

  @Post('start')
  async start(@Body() body: OnboardingStartDto, @Req() req: Request) {
    const inviteOnly = isTruthy(this.configService.get<string>('AUTH_INVITE_ONLY'));
    const inviteCode = this.pickFirst(
      body?.inviteCode,
      this.headerValue(req, 'x-invite-code'),
      this.queryValue(req, 'inviteCode'),
      this.queryValue(req, 'invite')
    );
    const onboardingToken = this.pickFirst(
      body?.onboardingToken,
      this.headerValue(req, 'x-onboarding-token'),
      this.queryValue(req, 'onboardingToken'),
      this.queryValue(req, 'token')
    );

    let inviteValidated = false;
    let inviteSource: 'db' | 'env' | null = null;
    if (inviteCode) {
      try {
        const validation = await this.authService.validateInviteCode(inviteCode);
        inviteValidated = true;
        inviteSource = validation.source;
      } catch {
        inviteValidated = false;
      }
    }

    const tokenValidated = this.validateOnboardingToken(onboardingToken);
    if (inviteOnly && !inviteValidated && !tokenValidated) {
      throw new ForbiddenException(
        'Invite code or onboarding token is required to start onboarding'
      );
    }

    const userAgent = (req.headers['user-agent'] || '').toString().toLowerCase();
    const userType = this.detectUserType(userAgent, req.headers);

    return {
      success: true,
      userType,
      sessionId: `onb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      inviteOnly,
      access: {
        inviteValidated,
        inviteSource,
        tokenValidated,
      },
    };
  }

  private detectUserType(userAgent: string, headers: Request['headers']): 'human' | 'ai_agent' {
    const xAgentId = String(headers['x-agent-id'] || '').trim();
    const xAgentType = String(headers['x-agent-type'] || '').trim();
    if (xAgentId || xAgentType) {
      return 'ai_agent';
    }

    const aiHints = ['bot', 'agent', 'claude', 'gpt', 'gemini', 'goose', 'anthropic', 'openai'];
    const looksLikeAgent = aiHints.some((hint) => userAgent.includes(hint));
    return looksLikeAgent ? 'ai_agent' : 'human';
  }

  private validateOnboardingToken(token: string | undefined): boolean {
    if (!token) return false;
    const normalized = token.trim();
    if (!normalized) return false;
    const allowed = (
      this.configService.get<string>('AUTH_ONBOARDING_TOKENS') ||
      this.configService.get<string>('AUTH_INVITE_CODES') ||
      ''
    )
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
    return allowed.includes(normalized);
  }

  private pickFirst(...values: Array<string | undefined>): string | undefined {
    for (const value of values) {
      const normalized = String(value || '').trim();
      if (normalized) return normalized;
    }
    return undefined;
  }

  private headerValue(req: Request, key: string): string | undefined {
    const value = req.headers[key];
    if (Array.isArray(value)) return value[0];
    return typeof value === 'string' ? value : undefined;
  }

  private queryValue(req: Request, key: string): string | undefined {
    const value = req.query[key];
    if (Array.isArray(value)) return String(value[0] || '');
    return value ? String(value) : undefined;
  }
}
