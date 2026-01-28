import { describe, expect, it } from 'vitest';
import { UserRole } from '../user';

describe('UserRole Enum', () => {
  it('should have correct values', () => {
    expect(UserRole.ADMIN).toBe('ADMIN');
    expect(UserRole.USER).toBe('USER');
    expect(UserRole.SUPER_ADMIN).toBe('SUPER_ADMIN');
    expect(UserRole.DEVELOPER).toBe('developer');
  });

  it('should be a runtime object', () => {
    expect(typeof UserRole).toBe('object');
    expect(Object.keys(UserRole).length).toBeGreaterThan(0);
  });
});
