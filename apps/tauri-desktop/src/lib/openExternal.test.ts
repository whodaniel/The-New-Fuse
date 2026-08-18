import { afterEach, describe, expect, it, vi } from 'vitest';
import { openExternal } from './openExternal';

describe('openExternal', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('blocks javascript and file schemes without opening', async () => {
    const open = vi.fn();
    vi.stubGlobal('open', open);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await openExternal('javascript:alert(1)');
    await openExternal('file:///etc/passwd');

    expect(open).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
  });

  it('blocks invalid URLs', async () => {
    const open = vi.fn();
    vi.stubGlobal('open', open);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await openExternal('not a url');
    expect(open).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
  });

  it('falls back to window.open for http(s) when opener plugin is unavailable', async () => {
    const open = vi.fn();
    vi.stubGlobal('open', open);

    await openExternal('https://thenewfuse.com/docs');
    expect(open).toHaveBeenCalledWith('https://thenewfuse.com/docs', '_blank', 'noopener,noreferrer');
  });
});
