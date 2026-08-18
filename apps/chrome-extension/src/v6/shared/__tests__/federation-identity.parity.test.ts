/**
 * Cross-runtime parity for the federated ID# scheme.
 *
 * The same agent must resolve to the same `ID#:<Base58>` no matter which edge
 * computes it, otherwise `@ID#:...` addressing silently fails to route between
 * the browser extension and the relay. Three implementations exist:
 *
 *   - apps/chrome-extension/src/v6/shared/federation-identity.ts  (browser edge)
 *   - scripts/lib/federation-protocol.cjs                          (relay tooling)
 *   - packages/relay-core/src/contracts/recovery-federation.ts     (relay core)
 *
 * This suite pins the browser edge against the relay tooling implementation.
 */

import { execFileSync } from 'child_process';
import * as path from 'path';

import { buildCanonicalEntityId, deterministicIdNumber } from '../federation-identity';

const REPO_ROOT = path.resolve(__dirname, '../../../../../..');
const RELAY_PROTOCOL = path.join(REPO_ROOT, 'scripts/lib/federation-protocol.cjs');

const realAgentIds = [
  'page-agent-1234-ab4cd',
  'browser-agent-xyz',
  'BROKER-Green',
  'BROKER-Blue',
  'agent-kimi-001',
  'PAGE-1234-AB4CD',
  'tnf-local-terminal-ttys010',
  'a',
];

/**
 * The relay module depends on ESM-only packages, so it cannot be `require`d
 * through jest's CJS transform. Run it in a real Node process instead — that
 * also means we compare against the implementation exactly as the relay
 * executes it, not a transformed approximation.
 */
function relayIdNumbers(): Record<string, string> {
  const script = `
    const { deterministicIdNumber } = require(${JSON.stringify(RELAY_PROTOCOL)});
    const ids = ${JSON.stringify(realAgentIds)};
    const out = {};
    for (const id of ids) out[id] = deterministicIdNumber(id);
    out['<empty>'] = deterministicIdNumber('');
    out['<null>'] = deterministicIdNumber(null);
    out['<undefined>'] = deterministicIdNumber(undefined);
    process.stdout.write(JSON.stringify(out));
  `;
  return JSON.parse(
    execFileSync(process.execPath, ['-e', script], { cwd: REPO_ROOT, encoding: 'utf8' })
  );
}

describe('federated ID# cross-runtime parity', () => {
  let relay: Record<string, string>;

  beforeAll(() => {
    relay = relayIdNumbers();
  });

  it.each(realAgentIds)('browser and relay agree on ID# for %s', (agentId) => {
    expect(deterministicIdNumber(agentId)).toBe(relay[agentId]);
  });

  it('emits a well-formed base58 ID# (no ambiguous 0/O/I/l characters)', () => {
    for (const agentId of realAgentIds) {
      expect(deterministicIdNumber(agentId)).toMatch(/^ID#:[1-9A-HJ-NP-Za-km-z]+$/);
    }
  });

  it('is stable across repeated calls', () => {
    const first = deterministicIdNumber('page-agent-1234-ab4cd');
    expect(deterministicIdNumber('page-agent-1234-ab4cd')).toBe(first);
  });

  it('distinguishes the Green and Blue channel brokers', () => {
    expect(deterministicIdNumber('BROKER-Green')).not.toBe(deterministicIdNumber('BROKER-Blue'));
  });

  // Regression: the browser copy previously indexed `agentId.length` directly, so
  // an unset agent id threw instead of falling back to the shared 'agent' seed —
  // producing a different ID# (or none) than the relay for the same agent.
  it.each([
    ['<empty>', ''],
    ['<null>', null],
    ['<undefined>', undefined],
  ])('matches the relay fallback for %s agent ids', (key, agentId) => {
    expect(deterministicIdNumber(agentId as unknown as string)).toBe(relay[key as string]);
  });
});

describe('canonical entity ids are platform-symmetric', () => {
  const canonicalFor = (name: string) =>
    buildCanonicalEntityId({
      category: 'AGENT',
      provider: 'FUSE',
      name,
      instance: '1234',
      scope: 'LOCAL',
    });

  it('gives Kimi page agents the same shape as Gemini page agents', () => {
    expect(canonicalFor('MOONSHOT_KIMI_PAGE')).toBe('TNF:LOCAL:AGENT:FUSE:MOONSHOT_KIMI_PAGE:1234');
    expect(canonicalFor('GOOGLE_GEMINI_PAGE')).toBe('TNF:LOCAL:AGENT:FUSE:GOOGLE_GEMINI_PAGE:1234');
  });

  it('rejects identity categories outside the federated set', () => {
    expect(() =>
      buildCanonicalEntityId({ category: 'NOT_A_CATEGORY', provider: 'FUSE', name: 'X' })
    ).toThrow(/invalid identity category/i);
  });
});
