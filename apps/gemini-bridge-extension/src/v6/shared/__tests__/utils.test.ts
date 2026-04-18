import { simpleHash } from '../utils';

describe('Shared Utils', () => {
  describe('simpleHash', () => {
    it('should return the same hash for the same string', () => {
      const input = 'hello world';
      expect(simpleHash(input)).toBe(simpleHash(input));
    });

    it('should return different hashes for different strings', () => {
      expect(simpleHash('hello')).not.toBe(simpleHash('world'));
    });

    it('should handle empty strings', () => {
      expect(typeof simpleHash('')).toBe('string');
    });

    it('should produce different hashes for strings with small differences', () => {
      expect(simpleHash('Message 1')).not.toBe(simpleHash('Message 2'));
    });

    it('should be deterministic', () => {
      const input = 'complex-string-123!@#';
      const firstRun = simpleHash(input);
      const secondRun = simpleHash(input);
      expect(firstRun).toBe(secondRun);
    });
  });
});
