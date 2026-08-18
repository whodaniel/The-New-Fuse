import { ACTIVITY_CHANNEL, isStandardChannel, STANDARD_CHANNEL_IDS } from '../constants';

/**
 * The extension must agree with STANDARD_CHANNELS in
 * packages/relay-core/src/standalone-relay.ts about which channels the relay
 * seeds — those are federation infrastructure and must not be deletable from
 * the popup or the floating panel.
 */
describe('standard federation channels', () => {
  it('covers the canonical relay-seeded set', () => {
    expect([...STANDARD_CHANNEL_IDS].sort()).toEqual([
      'blue',
      'fuse-activity-log',
      'general',
      'green',
      'purple',
      'red',
      'yellow',
    ]);
  });

  it('includes the activity channel the extension publishes to', () => {
    expect(STANDARD_CHANNEL_IDS).toContain(ACTIVITY_CHANNEL);
  });

  it('recognises standard channels regardless of case or padding', () => {
    expect(isStandardChannel('general')).toBe(true);
    expect(isStandardChannel('Green')).toBe(true);
    expect(isStandardChannel('  YELLOW  ')).toBe(true);
    expect(isStandardChannel(ACTIVITY_CHANNEL)).toBe(true);
  });

  it('does not treat user-created channels as standard', () => {
    expect(isStandardChannel('release-planning')).toBe(false);
    expect(isStandardChannel('local-1786900000000')).toBe(false);
    expect(isStandardChannel('general-2')).toBe(false);
  });

  it('is safe on empty and nullish input', () => {
    expect(isStandardChannel('')).toBe(false);
    expect(isStandardChannel(undefined as unknown as string)).toBe(false);
    expect(isStandardChannel(null as unknown as string)).toBe(false);
  });
});
