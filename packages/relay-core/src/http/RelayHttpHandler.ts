import { StandaloneRedisClient } from '@the-new-fuse/infrastructure'; // Assuming this for activityRedis
import http from 'http';
import { URL } from 'url';
import { JWTAuthService } from '../auth/JWTAuthService.js';
import { RedisRelayBridge } from '../redis-relay-bridge.js';
import { Agent, BridgeOperatorContext, Channel } from '../types.js'; // Assuming a types file
import { Logger } from '../utils/Logger.js';

// Assuming these functions are either imported or passed
function buildBridgeOperatorContext(req: http.IncomingMessage): BridgeOperatorContext {
  const headerActor = req.headers['x-tnf-operator'];
  const actor =
    typeof headerActor === 'string' && headerActor.trim() ? headerActor.trim() : 'relay-admin-http';

  return {
    actor,
    remoteAddress: req.socket.remoteAddress || null,
    userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null,
  };
}

// Assuming isLoopbackAddress, parseCsvSet are in a utils file or passed in
function isLoopbackAddress(address: string | null | undefined): boolean {
  if (!address) return false;
  const normalized = address.trim();
  if (!normalized) return false;
  return (
    normalized === '127.0.0.1' ||
    normalized === '::1' ||
    normalized === '::ffff:127.0.0.1' ||
    normalized.startsWith('localhost')
  );
}

// Re-defining parseCsvSet for now, will consider moving to shared utils later
function parseCsvSet(raw: string | undefined, normalize = true): Set<string> {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(',')
      .map((item) => (normalize ? item.trim().toLowerCase() : item.trim()))
      .filter(Boolean)
  );
}

// --- Placeholder for TNFRelayServer methods needed by this handler ---
// These will be passed into the constructor or made available via an interface
interface IRelayServerCore {
  agents: Map<string, Agent>;
  channels: Map<string, Channel>;
  sockets: Map<string, WebSocket>;
  bridge: RedisRelayBridge | null;
  bridgeGateEnabled: boolean;
  pendingBridgeAgents: Map<string, { agent: Agent; socket: WebSocket; requestedAt: number }>;
  approvedBridgeAgents: Set<string>;
  activityPersistenceEnabled: boolean;
  activityRedis: StandaloneRedisClient | null;
  activityUpstash: any; // UpstashRedis type
  activityStreamKey: string;
  activityChannelPrefix: string;
  activityMaxLen: number;
  authService: JWTAuthService | null; // For `emitRelayActivityEvent`
  socketRemoteAddresses: WeakMap<WebSocket, string | null>; // For `shouldAutoApproveBridge`

  // Methods to be called on TNFRelayServer
  approveBridgeAccess(agentId: string, operator: BridgeOperatorContext): boolean;
  denyBridgeAccess(
    agentId: string,
    reason: string | undefined,
    operator: BridgeOperatorContext
  ): boolean;
  setBridgeGateEnabled(enabled: boolean, operator: BridgeOperatorContext): void;
  // Method to send messages to clients, used by emitRelayActivityEvent
  send(ws: WebSocket, message: any): void;
  emitRelayActivityEvent(
    eventType: string,
    content: string,
    metadata: Record<string, unknown>,
    operator: BridgeOperatorContext
  ): void;

  // Helper method from standalone-relay, will need to be passed or re-implemented
  readActivityStream(streamKey: string, count: number): Promise<Array<[string, string[]]>>;
  parseActivityFields(fields: Record<string, string>): any; // PersistedActivityEvent type
}
// --- End Placeholder ---

export class RelayHttpHandler {
  private core: IRelayServerCore;
  private logger: Logger;
  private bridgeAutoApproveLoopback: boolean;
  private bridgeAutoApprovePlatforms: Set<string>;
  private bridgeAutoApproveAgentIds: Set<string>;

  constructor(core: IRelayServerCore, logger: Logger) {
    this.core = core;
    this.logger = logger;
    this.bridgeAutoApproveLoopback = process.env.BRIDGE_AUTO_APPROVE_LOOPBACK !== 'false';
    this.bridgeAutoApprovePlatforms = parseCsvSet(
      process.env.BRIDGE_AUTO_APPROVE_PLATFORMS || 'orchestrator,system,relay,master-clock'
    );
    this.bridgeAutoApproveAgentIds = parseCsvSet(process.env.BRIDGE_AUTO_APPROVE_AGENT_IDS || '');
  }

  public handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    const urlString = req.url || '/';
    const parsedUrl = new URL(urlString, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-TNF-Operator'); // Added X-TNF-Operator

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    res.setHeader('Content-Type', 'application/json');

    if (pathname === '/activity/recent') {
      void this.handleActivityRecentEndpoint(parsedUrl, res);
      return;
    }

    switch (pathname) {
      case '/':
      case '/health':
        this.handleHealthEndpoint(res);
        break;
      case '/agents':
        this.handleAgentsEndpoint(res);
        break;
      case '/channels':
        this.handleChannelsEndpoint(res);
        break;
      case '/status':
        this.handleStatusEndpoint(res);
        break;
      case '/bridge/pending':
        this.handleBridgePendingEndpoint(res);
        break;
      case '/bridge/approve':
        if (req.method === 'POST') {
          this.handleBridgeApproveRequest(req, res);
        } else {
          res.writeHead(405);
          res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
        break;
      case '/bridge/deny':
        if (req.method === 'POST') {
          this.handleBridgeDenyRequest(req, res);
        } else {
          res.writeHead(405);
          res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
        break;
      case '/bridge/toggle':
        if (req.method === 'POST') {
          this.handleBridgeToggleRequest(req, res);
        } else {
          res.writeHead(405);
          res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
        break;
      default:
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
    }
  }

  private handleHealthEndpoint(res: http.ServerResponse): void {
    res.writeHead(200);
    res.end(
      JSON.stringify({
        status: 'ok',
        relay: 'running',
        version: '1.0.0', // This should probably come from package.json
        agents: this.core.agents.size,
        channels: this.core.channels.size,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      })
    );
  }

  private handleAgentsEndpoint(res: http.ServerResponse): void {
    res.writeHead(200);
    res.end(JSON.stringify(Array.from(this.core.agents.values())));
  }

  private handleChannelsEndpoint(res: http.ServerResponse): void {
    res.writeHead(200);
    res.end(JSON.stringify(Array.from(this.core.channels.values())));
  }

  private handleStatusEndpoint(res: http.ServerResponse): void {
    res.writeHead(200);
    res.end(
      JSON.stringify({
        agents: Array.from(this.core.agents.values()),
        channels: Array.from(this.core.channels.values()),
        connections: this.core.sockets.size,
        bridge: {
          connected: this.core.bridge?.isConnected() || false,
          gateEnabled: this.core.bridgeGateEnabled,
          pendingRequests: this.core.pendingBridgeAgents.size,
          approvedAgents: Array.from(this.core.approvedBridgeAgents),
        },
      })
    );
  }

  private handleBridgePendingEndpoint(res: http.ServerResponse): void {
    res.writeHead(200);
    res.end(
      JSON.stringify({
        pending: this.getPendingBridgeRequests(),
        gateEnabled: this.core.bridgeGateEnabled,
      })
    );
  }

  private handleBridgeApproveRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const operator = buildBridgeOperatorContext(req);
        const { agentId } = JSON.parse(body);
        if (!agentId) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Missing agentId' }));
          return;
        }
        const success = this.core.approveBridgeAccess(agentId, operator);
        res.writeHead(success ? 200 : 404);
        res.end(
          JSON.stringify({
            success,
            agentId,
            approvedAgents: Array.from(this.core.approvedBridgeAgents),
            pending: this.getPendingBridgeRequests(),
          })
        );
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON', details: String(err) }));
      }
    });
  }

  private handleBridgeDenyRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const operator = buildBridgeOperatorContext(req);
        const { agentId, reason } = JSON.parse(body);
        if (!agentId) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Missing agentId' }));
          return;
        }
        const success = this.core.denyBridgeAccess(agentId, reason, {
          ...operator,
          reason: typeof reason === 'string' ? reason : null,
        });
        res.writeHead(success ? 200 : 404);
        res.end(
          JSON.stringify({
            success,
            agentId,
            reason,
            pending: this.getPendingBridgeRequests(),
          })
        );
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON', details: String(err) }));
      }
    });
  }

  private handleBridgeToggleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const operator = buildBridgeOperatorContext(req);
        const { enabled } = JSON.parse(body);
        if (typeof enabled !== 'boolean') {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Missing or invalid enabled field' }));
          return;
        }
        this.core.setBridgeGateEnabled(enabled, operator);
        res.writeHead(200);
        res.end(
          JSON.stringify({
            success: true,
            gateEnabled: this.core.bridgeGateEnabled,
            approvedAgents: Array.from(this.core.approvedBridgeAgents),
            pending: this.getPendingBridgeRequests(),
          })
        );
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON', details: String(err) }));
      }
    });
  }

  private async handleActivityRecentEndpoint(
    parsedUrl: URL,
    res: http.ServerResponse
  ): Promise<void> {
    if (!this.core.activityPersistenceEnabled || !this.core.activityRedis) {
      res.writeHead(503);
      res.end(
        JSON.stringify({
          error: 'Activity persistence is disabled',
          enabled: this.core.activityPersistenceEnabled,
        })
      );
      return;
    }

    const channelId = parsedUrl.searchParams.get('channel');
    const rawCount = parsedUrl.searchParams.get('count') || '100';
    const count = Math.min(Math.max(parseInt(rawCount, 10) || 100, 1), 500);
    const streamKey = channelId
      ? `${this.core.activityChannelPrefix}${channelId}`
      : this.core.activityStreamKey;

    try {
      const entries = await this.core.readActivityStream(streamKey, count);
      const events = (entries as any[]).map((entry) => {
        const [streamId, flatFields] = entry;
        const fields: Record<string, string> = {};
        for (let i = 0; i < flatFields.length; i += 2) {
          fields[flatFields[i]] = flatFields[i + 1];
        }
        return {
          streamId,
          ...this.core.parseActivityFields(fields),
        };
      });
      res.writeHead(200);
      res.end(
        JSON.stringify({
          stream: streamKey,
          count: events.length,
          events,
        })
      );
    } catch (err) {
      res.writeHead(500);
      res.end(
        JSON.stringify({
          error: 'Failed to read activity stream',
          details: err instanceof Error ? err.message : String(err),
        })
      );
    }
  }

  private getPendingBridgeRequests(): Array<{
    agentId: string;
    name: string;
    platform: string;
    requestedAt: number;
  }> {
    return Array.from(this.core.pendingBridgeAgents.values()).map(({ agent, requestedAt }) => ({
      agentId: agent.id,
      name: agent.name,
      platform: agent.platform,
      requestedAt,
    }));
  }
}
