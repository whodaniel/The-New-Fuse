import { describe, expect, it } from '@jest/globals';

import {
  hasAuthorizationLevel,
  isInviteCodeAccepted,
  resolveInvitePolicy,
  resolvePermissionClaims,
  resolveRoleClaims,
} from './auth-policy';

describe('auth-policy', () => {
  it('normalizes and expands SUPER_ADMIN role claims', () => {
    const roles = resolveRoleClaims({ role: 'SUPER_ADMIN', roles: ['SUPER_ADMIN'] });
    const permissions = resolvePermissionClaims({}, roles);

    expect(roles).toEqual(
      expect.arrayContaining(['SUPER_ADMIN', 'super_admin', 'admin', 'system'])
    );
    expect(permissions).toEqual(
      expect.arrayContaining(['system:access', 'admin:access', 'handoff:publish'])
    );
  });

  it('evaluates admin/system authorization from mixed-case claims', () => {
    expect(hasAuthorizationLevel({ roles: ['ADMIN'] }, 'admin')).toBe(true);
    expect(hasAuthorizationLevel({ roles: ['SUPER_ADMIN'] }, 'system')).toBe(true);
    expect(hasAuthorizationLevel({ permissions: ['ADMIN:ACCESS'] }, 'admin')).toBe(true);
  });

  it('treats master super admin email as privileged', () => {
    expect(hasAuthorizationLevel({ email: 'owner@example.com' }, 'admin')).toBe(true);
    expect(hasAuthorizationLevel({ email: 'owner@example.com' }, 'system')).toBe(true);
  });

  it('supports invite-only policy via config/env style keys', () => {
    const config = {
      get: (key: string) => {
        if (key === 'AUTH_INVITE_ONLY') return 'true';
        if (key === 'AUTH_INVITE_CODES') return 'alpha,beta,gamma';
        return undefined;
      },
    };

    const policy = resolveInvitePolicy(config);

    expect(policy.enabled).toBe(true);
    expect(isInviteCodeAccepted('beta', policy)).toBe(true);
    expect(isInviteCodeAccepted('delta', policy)).toBe(false);
    expect(isInviteCodeAccepted(undefined, policy)).toBe(false);
  });

  it('supports parsing invite codes from a valid JSON array', () => {
    const config = {
      get: (key: string) => {
        if (key === 'AUTH_INVITE_ONLY') return 'true';
        if (key === 'AUTH_INVITE_CODES') return '["json-alpha", "json-beta"]';
        return undefined;
      },
    };

    const policy = resolveInvitePolicy(config);

    expect(policy.enabled).toBe(true);
    expect(isInviteCodeAccepted('json-alpha', policy)).toBe(true);
    expect(isInviteCodeAccepted('json-beta', policy)).toBe(true);
    expect(isInviteCodeAccepted('json-gamma', policy)).toBe(false);
  });

  it('falls back to delimiter parsing if JSON parsing fails', () => {
    const config = {
      get: (key: string) => {
        if (key === 'AUTH_INVITE_ONLY') return 'true';
        if (key === 'AUTH_INVITE_CODES') return '[invalid-json]';
        return undefined;
      },
    };

    const policy = resolveInvitePolicy(config);

    expect(policy.enabled).toBe(true);
    // "[invalid-json]" should be parsed as a code
    expect(isInviteCodeAccepted('[invalid-json]', policy)).toBe(true);
  });
});
