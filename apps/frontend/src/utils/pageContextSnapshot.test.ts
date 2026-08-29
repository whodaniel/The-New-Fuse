import { describe, expect, it } from 'vitest';
import { sanitizePageText } from './pageContextSnapshot';

describe('pageContextSnapshot sanitization', () => {
  it('redacts sensitive API keys and JWTs', () => {
    const raw =
      'Secret OpenAI key is sk-123456789012345678901234 and JWT is eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const { text, redactionCount } = sanitizePageText(raw);

    expect(text).toContain('[REDACTED_API_KEY]');
    expect(text).toContain('[REDACTED_JWT]');
    expect(text).not.toContain('sk-123456789012345678901234');
    expect(redactionCount).toBe(2);
  });

  it('redacts credit card numbers and SSNs', () => {
    const raw = 'Payment card: 4111 2222 3333 4444 and SSN: 123-45-6789';
    const { text, redactionCount } = sanitizePageText(raw);

    expect(text).toContain('[REDACTED_CC]');
    expect(text).toContain('[REDACTED_SSN]');
    expect(text).not.toContain('4111 2222 3333 4444');
    expect(text).not.toContain('123-45-6789');
    expect(redactionCount).toBe(2);
  });

  it('preserves clean text without redaction', () => {
    const raw = 'This is a standard TNF dashboard text snippet describing agent performance.';
    const { text, redactionCount } = sanitizePageText(raw);

    expect(text).toBe(raw);
    expect(redactionCount).toBe(0);
  });
});
