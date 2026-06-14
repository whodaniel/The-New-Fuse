import WebSocket from 'ws';
import { TnfAgentEnvelopeIdentity } from '../contracts/envelope.js';

interface RelayConnectionConfig {
  RELAY_URL: string;
}

type LogFunction = (
  level: string,
  category: string,
  message: string,
  data?: Record<string, any>
) => void;
type ProcessMessageFunction = (msg: any, source: string) => void;
type GetOrchestratorIdentityFunction = () => TnfAgentEnvelopeIdentity;
type OnDisconnectFunction = () => void;

export class RelayConnectionManager {
  private config: RelayConnectionConfig;
  private log: LogFunction;
  private processMessage: ProcessMessageFunction;
  private getOrchestratorEnvelopeIdentity: GetOrchestratorIdentityFunction;
  private onDisconnect: OnDisconnectFunction;
  private ws: WebSocket | null;
  private reconnectTimer: NodeJS.Timeout | null;
  private sessionId: string; // MasterClock's sessionId

  constructor(
    config: RelayConnectionConfig,
    log: LogFunction,
    processMessage: ProcessMessageFunction,
    getOrchestratorEnvelopeIdentity: GetOrchestratorIdentityFunction,
    onDisconnect: OnDisconnectFunction,
    sessionId: string
  ) {
    this.config = config;
    this.log = log;
    this.processMessage = processMessage;
    this.getOrchestratorEnvelopeIdentity = getOrchestratorEnvelopeIdentity;
    this.onDisconnect = onDisconnect;
    this.ws = null;
    this.reconnectTimer = null;
    this.sessionId = sessionId;
  }

  async connectRelay(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.log('info', 'RELAY', `Connecting to ${this.config.RELAY_URL}...`);

      this.ws = new WebSocket(this.config.RELAY_URL);

      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10000);

      this.ws.on('open', () => {
        clearTimeout(timeout);
        this.log('info', 'RELAY', '✅ Connected to WebSocket relay');
        this.registerAsOrchestrator();
        resolve();
      });

      this.ws.on('message', (data: any) => {
        this.handleRelayMessageInternal(data);
      });

      this.ws.on('close', () => {
        this.log('warn', 'RELAY', 'Disconnected from relay');
        this.onDisconnect();
      });

      this.ws.on('error', (err: any) => {
        this.log('error', 'RELAY', `Connection error: ${err.message}`);
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  // MasterClock will call this if it needs to reconnect overall
  scheduleReconnect() {
    // This method is now effectively owned by MasterClock, which orchestrates reconnection.
    // The RelayConnectionManager simply reports disconnection via onDisconnect callback.
    // No op here, MasterClock will handle scheduling a full restart.
  }

  private registerAsOrchestrator() {
    const orchestrator = this.getOrchestratorEnvelopeIdentity();
    this.send({
      type: 'AGENT_REGISTER',
      payload: {
        agent: {
          id: this.sessionId,
          canonicalEntityId: orchestrator.canonicalEntityId,
          operationalHandle: orchestrator.operationalHandle,
          runtimeSessionId: orchestrator.runtimeSessionId,
          aliases: orchestrator.aliases,
          name: 'TNF Master Orchestrator',
          platform: 'orchestrator',
          role: 'ORCHESTRATOR',
          capabilities: [
            'orchestration',
            'task-distribution',
            'agent-coordination',
            'stall-detection',
            'recovery',
            'onboarding',
          ],
        },
      },
    });
  }

  send(msg: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          ...msg,
          source: this.sessionId,
          timestamp: Date.now(),
        })
      );
    }
  }

  private handleRelayMessageInternal(data: any) {
    try {
      const msg = JSON.parse(data.toString());
      this.processMessage(msg, 'relay');
    } catch (e) {
      // Invalid JSON - ignore
    }
  }

  // For shutdown
  close() {
    if (this.ws) {
      this.ws.close();
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
