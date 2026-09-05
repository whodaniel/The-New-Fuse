import { describe, expect, it } from 'vitest';
import {
  buildGreeterSafeSessionData,
  isOnboardingSecretKey,
  redactOnboardingSecrets,
} from './onboardingSecrets';
import { buildGreeterContext } from './onboardingGreeter';

describe('onboarding secret scrubbing', () => {
  it('detects provider key field names', () => {
    expect(isOnboardingSecretKey('openaiKey')).toBe(true);
    expect(isOnboardingSecretKey('anthropicKey')).toBe(true);
    expect(isOnboardingSecretKey('apiKey')).toBe(true);
    expect(isOnboardingSecretKey('providerMode')).toBe(false);
    expect(isOnboardingSecretKey('name')).toBe(false);
  });

  it('redacts secrets from session patches and keeps configured flags', () => {
    const redacted = redactOnboardingSecrets({
      name: 'Dana',
      providerMode: 'bring_your_own',
      openaiKey: 'sk-test-openai-secret-value-123456',
      anthropicKey: 'sk-ant-secret-value-1234567890',
      apiKey: 'workspace-secret',
      workspacePath: '/Users/dana/project',
    });

    expect(redacted).toEqual({
      name: 'Dana',
      providerMode: 'bring_your_own',
      openaiKeyConfigured: true,
      anthropicKeyConfigured: true,
      apiKeyConfigured: true,
      workspacePath: '/Users/dana/project',
    });
    expect(JSON.stringify(redacted)).not.toMatch(/sk-test|sk-ant|workspace-secret/);
  });

  it('allowlists only non-secret greeter facts', () => {
    const safe = buildGreeterSafeSessionData({
      name: 'Dana',
      openaiKey: 'sk-should-never-appear',
      notes: 'drop me',
      selectedTools: ['shell'],
      openaiKeyConfigured: true,
    });

    expect(safe).toEqual({
      name: 'Dana',
      selectedTools: ['shell'],
      openaiKeyConfigured: true,
    });
    expect(JSON.stringify(safe)).not.toContain('sk-should-never-appear');
    expect(safe).not.toHaveProperty('notes');
  });

  it('buildGreeterContext never serializes raw provider keys into sessionData', () => {
    const ctx = buildGreeterContext({
      stepLabel: 'API & Provider',
      userType: 'human',
      userName: 'Dana',
      sessionData: {
        name: 'Dana',
        openaiKey: 'sk-leak-me-please-1234567890',
        googleKey: 'AIzaSyD-should-not-leak-abcdefghijk',
        providerMode: 'bring_your_own',
      },
    });

    const serialized = JSON.stringify(ctx);
    expect(serialized).not.toContain('sk-leak-me');
    expect(serialized).not.toContain('AIzaSyD');
    expect(ctx.sessionData).toMatchObject({
      name: 'Dana',
      providerMode: 'bring_your_own',
      openaiKeyConfigured: true,
      googleKeyConfigured: true,
    });
  });
});
