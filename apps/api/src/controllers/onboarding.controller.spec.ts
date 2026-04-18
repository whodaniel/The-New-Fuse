import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { AuthService } from '../services/auth.service.js';
import { OnboardingController } from './onboarding.controller.js';

const makeReq = (overrides: Partial<Request> = {}): Request =>
  ({
    headers: {},
    query: {},
    ...overrides,
  }) as unknown as Request;

describe('OnboardingController', () => {
  it('rejects onboarding start when invite-only is enabled and no invite/token is provided', async () => {
    const authService = {
      validateInviteCode: jest.fn(),
    } as unknown as AuthService;
    const configService = {
      get: jest.fn((key: string) => (key === 'AUTH_INVITE_ONLY' ? 'true' : '')),
    } as unknown as ConfigService;
    const controller = new OnboardingController(authService, configService);

    await expect(controller.start({}, makeReq())).rejects.toThrow(ForbiddenException);
    expect(authService.validateInviteCode as jest.Mock).not.toHaveBeenCalled();
  });

  it('accepts onboarding start with a valid invite code', async () => {
    const authService = {
      validateInviteCode: jest.fn().mockResolvedValue({ code: 'ABC', source: 'env' }),
    } as unknown as AuthService;
    const configService = {
      get: jest.fn((key: string) => (key === 'AUTH_INVITE_ONLY' ? 'true' : '')),
    } as unknown as ConfigService;
    const controller = new OnboardingController(authService, configService);

    const result = await controller.start(
      { inviteCode: 'ABC' },
      makeReq({ headers: { 'user-agent': 'Mozilla/5.0' } })
    );
    expect(result.success).toBe(true);
    expect(result.access.inviteValidated).toBe(true);
    expect(result.userType).toBe('human');
  });

  it('accepts onboarding start with a valid onboarding token', async () => {
    const authService = {
      validateInviteCode: jest.fn().mockRejectedValue(new Error('invalid invite')),
    } as unknown as AuthService;
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'AUTH_INVITE_ONLY') return 'true';
        if (key === 'AUTH_ONBOARDING_TOKENS') return 'TOKEN123,TOKEN456';
        return '';
      }),
    } as unknown as ConfigService;
    const controller = new OnboardingController(authService, configService);

    const result = await controller.start(
      { onboardingToken: 'TOKEN123' },
      makeReq({ headers: { 'user-agent': 'goose/1.0' } })
    );
    expect(result.success).toBe(true);
    expect(result.access.tokenValidated).toBe(true);
    expect(result.userType).toBe('ai_agent');
  });

  it('detects ai_agent when x-agent-id header is present', async () => {
    const authService = {
      validateInviteCode: jest.fn().mockResolvedValue({ code: 'ABC', source: 'db' }),
    } as unknown as AuthService;
    const configService = {
      get: jest.fn((key: string) => (key === 'AUTH_INVITE_ONLY' ? 'false' : '')),
    } as unknown as ConfigService;
    const controller = new OnboardingController(authService, configService);

    const result = await controller.start(
      { inviteCode: 'ABC' },
      makeReq({ headers: { 'x-agent-id': 'agent-42', 'user-agent': 'Mozilla/5.0' } })
    );
    expect(result.userType).toBe('ai_agent');
  });
});
