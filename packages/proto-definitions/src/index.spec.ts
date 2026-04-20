import { credentials, Metadata } from './index.js';

describe('Proto Definitions Exports', () => {
  it('should be able to import from index', () => {
    expect(credentials).toBeDefined();
    expect(Metadata).toBeDefined();
  });
});
