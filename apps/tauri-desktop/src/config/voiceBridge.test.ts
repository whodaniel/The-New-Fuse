import { describe, expect, it } from 'vitest';
import { parseStreamTail, parseU2ALine } from './voiceBridge';

describe('voiceBridge parsing', () => {
  it('extracts plain body from U2A tagged lines', () => {
    const parsed = parseU2ALine(
      '[U2A from:danielgoldberg speaker:TNF:USER:DANIELGOLDBERG:001 profile:main id:123] hello there'
    );
    expect(parsed?.from).toBe('danielgoldberg');
    expect(parsed?.speakerId).toBe('TNF:USER:DANIELGOLDBERG:001');
    expect(parsed?.profile).toBe('main');
    expect(parsed?.body).toBe('hello there');
  });

  it('keeps legacy plain lines readable', () => {
    const parsed = parseU2ALine('legacy plain line');
    expect(parsed?.body).toBe('legacy plain line');
  });

  it('returns the most recent stream lines', () => {
    const tail = parseStreamTail('one\n[U2A from:a speaker:TNF:USER:A:001 profile:main id:1] two\nthree', 2);
    expect(tail).toHaveLength(2);
    expect(tail[0].body).toBe('two');
    expect(tail[1].body).toBe('three');
  });
});
