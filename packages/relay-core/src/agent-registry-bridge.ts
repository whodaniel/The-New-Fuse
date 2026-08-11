/**
 * TNF Agent Registry WebSocket Bridge
 * Registers agents with Master Clock and keeps them alive via heartbeat
 * Acts as a living agent on the relay — always present, always listening
 */
import {
  connectStandaloneRedisClient,
  createStandaloneRedisClient,
} from '@the-new-fuse/infrastructure';
import { randomUUID } from 'crypto';
import { WebSocket } from 'ws';
import { buildCanonicalEntityId } from './contracts/identity.js';

// Phase 9 FOLLOWUP-2: stable locally-deterministic Federated ID# allocator.
// In production this is replaced by FederatedIdentityService (Redis-INCR +
// base58 encode); here we use FNV-1a(agentId) so bridge-started agents
// (launchpad, master-clock) get a stable ID# across process restarts that
// won't collide with the canonical service when the service is later wired in.
// Same alphabet as FederatedIdentityService.
const FEDERATED_BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function encodeBase58(num: number): string {
  if (!Number.isFinite(num) || num <= 0) return FEDERATED_BASE58_ALPHABET[0];
  let remaining = Math.trunc(num);
  let encoded = '';
  while (remaining > 0) {
    encoded = FEDERATED_BASE58_ALPHABET[remaining % 58] + encoded;
    remaining = Math.floor(remaining / 58);
  }
  return encoded;
}

/**
 * PROVISIONAL bridge ID# — the fourth mirror of this hash.
 *
 * Band allocation (Phase 9, revised 2026-08-09). The bands exist so an ID#'s
 * provenance is readable from its value:
 *
 *   1 – 999,999,999      production sequential (Redis INCR, FederatedIdentityService)
 *   1,000 – 9,999        seeder  (legacy, overlaps production — see note)
 *   1e9 – 2e9            PROVISIONAL: this function + the three edge mirrors
 *
 * The previous band was `5000 + (h % 10000)`, chosen to be "visually distinct
 * from production sequential (1-N) and from seeder (1000-9999)". It was neither
 * distinct nor large enough:
 *
 *   - it OVERLAPPED the seeder band at 5,000–9,999, so provenance was not in
 *     fact readable from the value;
 *   - 10,000 values against a 194-agent roster produced two live collisions
 *     (`ID#:4gV`, `ID#:3Ub`). This runs on the registration path, so those were
 *     ambiguous addresses for `resolveMessageTarget`, which routes on `@ID#:…`.
 *
 * Must stay in lock-step with `federation-identity.ts`,
 * `federation-protocol.cjs`, and `recovery-federation.ts` — a divergence yields
 * a different ID# for the same agent depending on which side computed it.
 *
 * Still provisional: a server-assigned sequential `idNumber` always wins.
 */
const PROVISIONAL_ID_FLOOR = 1_000_000_000;
const PROVISIONAL_ID_SPACE = 1_000_000_000;

function deterministicBridgeIdNumber(agentId: string): string {
  let h = 0x811c9dc5;
  const id = String(agentId || 'agent');
  for (let i = 0; i < id.length; i += 1) {
    h ^= id.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return `ID#:${encodeBase58(PROVISIONAL_ID_FLOOR + (h % PROVISIONAL_ID_SPACE))}`;
}

// Phase 9 FOLLOWUP-3: build a fresh mcid envelope at registration time.
// Schema reference: docs/protocols/schemas/tnf-master-cumulative-id.schema.json
// (spec: tnf/mcid/0.1). The cumulative event id is the bridge session UUID;
// correlation_id is its own UUID (the session-instance correlation key);
// causation_id is null on registration (no upstream event).
function buildRegistrationMcid(sessionId: string): string {
  return JSON.stringify({
    spec: 'tnf/mcid/0.1',
    id: sessionId,
    scope: { tenant_id: 'tnf-default' },
    lineage: {
      trace_id: null,
      correlation_id: sessionId,
      causation_id: null,
    },
    emittedAt: new Date().toISOString(),
    source: 'agent-registry-bridge',
  });
}

const RELAY_URL =
  process.env.RELAY_URL ||
  process.env.TNF_RELAY_URL ||
  process.env.RELAY_WS_URL ||
  'ws://127.0.0.1:3000/ws';
const AGENT_ID = process.env.AGENT_ID || 'LAUNCHPAD-AGENT';
const HEARTBEAT_INTERVAL = parseInt(process.env.HEARTBEAT_INTERVAL || '3000');

class AgentRegistryBridge {
  private ws: WebSocket | null = null;
  private sessionId = randomUUID();
  private registered = false;
  private messageHandlers = new Map<string, (msg: any) => void>();

  async connect() {
    return new Promise<void>((resolve, reject) => {
      this.ws = new WebSocket(RELAY_URL);

      this.ws.on('open', async () => {
        console.log(`[${AGENT_ID}] Connected to relay ${RELAY_URL}`);
        await this.register();
        resolve();
      });

      this.ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          this.handleMessage(msg);
        } catch (e) {
          // Ignore non-JSON
        }
      });

      this.ws.on('error', (err) => {
        console.error(`[${AGENT_ID}] WS error:`, err.message);
      });

      this.ws.on('close', () => {
        console.log(`[${AGENT_ID}] Disconnected. Reconnecting in 5s...`);
        this.registered = false;
        setTimeout(() => this.connect(), 5000);
      });
    });
  }

  private async allocateAuthoritativeIdNumber(agentId: string): Promise<string> {
    try {
      const redis = createStandaloneRedisClient({ lazyConnect: true });
      await connectStandaloneRedisClient(redis as any);

      const key = `tnf:identity:seq:${agentId}`;
      const seq = await redis.incr(key);
      const encoded = encodeBase58(seq);

      if ('quit' in redis && typeof redis.quit === 'function') {
        await redis.quit();
      } else if ('disconnect' in redis && typeof redis.disconnect === 'function') {
        await redis.disconnect();
      }

      return `ID#:${encoded}`;
    } catch (e) {
      console.warn(
        `[${AGENT_ID}] Failed to connect to Redis for authoritative ID#. Falling back to provisional hash. Reason: ${e instanceof Error ? e.message : e}`
      );
      return deterministicBridgeIdNumber(agentId);
    }
  }

  private async register() {
    if (!this.ws || this.registered) return;
    this.ws.send(
      JSON.stringify({
        type: 'AGENT_REGISTER',
        payload: {
          agent: {
            id: this.sessionId,
            // Phase 9 (audit 2026-06-14): canonicalEntityId MUST be in the
            // TNF-namespaced format `TNF:[scope:]CATEGORY:PROVIDER:NAME:INSTANCE`
            // and pass `normalizeCanonicalEntityId()`. Previous value was
            // `AGENT://TNFCORE/${AGENT_ID}` which would be rejected by any
            // consumer validating via `isCanonicalEntityId()`. Built from parts.
            canonicalEntityId: buildCanonicalEntityId({
              category: 'AGENT',
              provider: 'TNFCORE',
              name: AGENT_ID,
              instance: 1,
            }),
            // Phase 9 FOLLOWUP-2: Federated ID# included in the registration
            // payload. In production this is allocated by FederatedIdentityService;
            // here we use a deterministic hash so it survives restarts and
            // does not collide with seeder-generated values.
            idNumber: await this.allocateAuthoritativeIdNumber(AGENT_ID),
            // Phase 9 FOLLOWUP-3: emit mcid envelope at registration. mcid is
            // the cumulative event id; correlation_id links registration events
            // originating from the same bridge session.
            mcid: buildRegistrationMcid(this.sessionId),
            operationalHandle: AGENT_ID,
            name: AGENT_ID,
            platform: 'tnf-core',
            capabilities: ['launchpad', 'orchestrator', 'heartbeat'],
            // Phase 9 (audit 2026-06-14) FIX: preserve fulfillment + traits
            // from upstream persona payload so broker can route by model/tool.
            fulfillment: {
              vendor: 'tnf',
              model: process.env.TNF_MODEL || 'default',
              transport: 'cli',
              protocol_version: 'tnf/protocol/1.0',
            },
            traits: {
              daccRole: 'broker',
              autonomy_level: 'autonomous',
              subAgent_capable: true,
              observability: 'native',
            },
          },
        },
        source: this.sessionId,
        timestamp: Date.now(),
      })
    );
    this.registered = true;
    console.log(`[${AGENT_ID}] Registered with session ${this.sessionId}`);
  }

  private handleMessage(msg: any) {
    const handler = this.messageHandlers.get(msg.type);
    if (handler) handler(msg);
  }

  on(type: string, handler: (msg: any) => void) {
    this.messageHandlers.set(type, handler);
  }

  send(type: string, payload: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        type,
        payload,
        source: this.sessionId,
        timestamp: Date.now(),
      })
    );
  }

  startHeartbeat() {
    setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(
          JSON.stringify({
            type: 'AGENT_HEARTBEAT',
            payload: { agentId: this.sessionId, status: 'active' },
            source: this.sessionId,
            timestamp: Date.now(),
          })
        );
      }
    }, HEARTBEAT_INTERVAL);
  }
}

// Auto-start if run directly
if (require.main === module) {
  const bridge = new AgentRegistryBridge();
  bridge.connect().then(() => {
    bridge.startHeartbeat();
    console.log(`[${AGENT_ID}] Agent registry bridge started`);
    console.log(`[${AGENT_ID}] Session: ${bridge['sessionId']}`);
  });
}

export { AgentRegistryBridge };
