import { describe, it, expect } from 'vitest';
import { exampleUtil } from './example.js';

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
