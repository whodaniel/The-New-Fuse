import { describe, expect, it } from 'vitest';
import { exampleUtil } from './example';

describe('exampleUtil', () => {
  it('should return the expected result', () => {
    const result = exampleUtil('test');
    expect(result).toBe('test-processed');
  });

  it('should handle empty input', () => {
    const result = exampleUtil('');
    expect(result).toBe('-processed');
  });
});
