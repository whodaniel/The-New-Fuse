// /test/index.test.ts

import { formatDate } from '../src/utils.js';

describe('Utility Functions', () => {
  it('should format a date correctly', () => {
    const date = new Date('2024-01-01');
    expect(formatDate(date)).toBe('1/1/2024');
  });

  // Add more tests here
});