import { randomUUID } from 'crypto';
import { type TnfAuditTrace } from '../contracts/audit.js';
import { type TnfAgentEnvelopeIdentity } from '../contracts/envelope.js';
import { createTNFEnvelope } from '../protocol/tnf-envelope.js';
import { RedisClientManager } from './redis-client-manager.service.js';

interface SelfPromptConfig {
  SELF_PROMPT_ENABLED: boolean;
  SELF_PROMPT_COOLDOWN_MS: number;
  REDIS_KEYS: {
    INGRESS: string;
    SELF_PROMPTS: string;
    EGRESS_PREFIX: string;
  };
}

type LogFunction = (
  level: string,
  category: string,
  message: string,
  data?: Record<string, any>
) => void;

type GetOrchestratorIdentityFunction = () => TnfAgentEnvelopeIdentity;
type GetAgentIdentityFunction = (sourceOrAgentId: string) => TnfAgentEnvelopeIdentity;
type GetOrchestratorAuditFunction = (
  overrides?: Partial<TnfAuditTrace>
) => Partial<TnfAuditTrace> & Pick<TnfAuditTrace, 'source' | 'actor'>;

export class SelfPromptService {
  private config: SelfPromptConfig;
  private log: LogFunction;
  private redisClient: RedisClientManager;
  private selfPromptCooldowns: Map<string, number>;
  private getOrchestratorEnvelopeIdentity: GetOrchestratorIdentityFunction;
  private getAgentEnvelopeIdentity: GetAgentIdentityFunction;
  private getOrchestratorAudit: GetOrchestratorAuditFunction;
  private sessionId: string; // MasterClock's sessionId

  constructor(
    config: SelfPromptConfig,
    log: LogFunction,
    redisClient: RedisClientManager,
    getOrchestratorEnvelopeIdentity: GetOrchestratorIdentityFunction,
    getAgentEnvelopeIdentity: GetAgentIdentityFunction,
    getOrchestratorAudit: GetOrchestratorAuditFunction,
    sessionId: string
  ) {
    this.config = config;
    this.log = log;
    this.redisClient = redisClient;
    this.selfPromptCooldowns = new Map();
    this.getOrchestratorEnvelopeIdentity = getOrchestratorEnvelopeIdentity;
    this.getAgentEnvelopeIdentity = getAgentEnvelopeIdentity;
    this.getOrchestratorAudit = getOrchestratorAudit;
    this.sessionId = sessionId;
  }

  pruneCooldowns(now: number, maxAge: number): number {
    let prunedCount = 0;
    for (const [key, timestamp] of this.selfPromptCooldowns.entries()) {
      if (now - timestamp > maxAge) {
        this.selfPromptCooldowns.delete(key);
        prunedCount++;
      }
    }
    if (prunedCount > 0) {
      this.log('debug', 'MEMORY', `Pruned ${prunedCount} self-prompt cooldowns`);
    }
    return prunedCount;
  }

  async emitSelfPrompt(params: {
    kind: 'agent-stall' | 'process-stall';
    channel: string;
    prompt: string;
    reason: string;
    targetAgentId?: string;
    targetSourceId?: string;
    targetProcessId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    if (
      !this.config.SELF_PROMPT_ENABLED ||
      (!this.redisClient.rawRedisClient && !this.redisClient.rawUpstashClient)
    ) {
      return;
    }

    const cooldownKey = `${params.kind}:${params.targetAgentId || params.targetProcessId || params.channel}`;
    const now = Date.now();
    const lastSentAt = this.selfPromptCooldowns.get(cooldownKey) || 0;
    if (now - lastSentAt < this.config.SELF_PROMPT_COOLDOWN_MS) {
      return;
    }
    this.selfPromptCooldowns.set(cooldownKey, now);
    const issuedAtIso = new Date(now).toISOString();
    const tenantId = process.env.TENANT_ID || 'tnf-local';
    const cumulativeId = {
      spec: 'tnf/mcid/0.1',
      id: randomUUID(),
      scope: {
        tenant_id: tenantId,
        session_key: this.sessionId,
        workflow_id: null,
        channel_id: params.channel,
      },
      lineage: {
        trace_id: null,
        correlation_id: randomUUID(),
        causation_id: null,
        handoff_packet_id: null,
        twid: null,
        task_id: null,
      },
      federation: {
        domain: tenantId,
        route: ['master-clock', 'self-prompt'],
        hop_count: 1,
        gate_decisions: [
          { gate: 'TENANT_SCOPE_GATE', decision: 'allow', at: issuedAtIso },
          { gate: 'TRACE_CONTINUITY_GATE', decision: 'allow', at: issuedAtIso },
          { gate: 'CHANNEL_MEMBERSHIP_GATE', decision: 'allow', at: issuedAtIso },
        ],
      },
      issued_at: issuedAtIso,
    };

    const originalMessage = {
      type: 'CHANNEL_MESSAGE',
      channel: params.channel,
      payload: {
        from: this.sessionId,
        to: 'broadcast',
        content: params.prompt,
        metadata: {
          isSystemMessage: true,
          isSelfPrompt: true,
          reason: params.reason,
          ...(params.metadata || {}),
        },
      },
    };

    const broadcastEnvelope = createTNFEnvelope(
      'event',
      this.getOrchestratorEnvelopeIdentity(),
      { broadcast: true },
      {
        eventType: 'SELF_PROMPT',
        data: {
          ...params,
          cumulativeId,
          issuedAt: now,
        },
        originalMessage,
      },
      {
        channelId: params.channel,
        sessionId: this.sessionId,
      },
      {
        audit: this.getOrchestratorAudit({
          channelId: params.channel,
          sessionId: this.sessionId,
        }),
      }
    );

    try {
      await this.redisClient.publish(
        this.config.REDIS_KEYS.INGRESS,
        JSON.stringify(broadcastEnvelope)
      );
      await this.redisClient.lpush(
        this.config.REDIS_KEYS.SELF_PROMPTS,
        JSON.stringify({
          sessionId: this.sessionId,
          ...params,
          cumulativeId,
          issuedAt: now,
        })
      );
      await this.redisClient.ltrim(this.config.REDIS_KEYS.SELF_PROMPTS, 0, 499);
    } catch (error: any) {
      this.log('warn', 'SELF-PROMPT', `Failed to publish self-prompt: ${error.message}`);
    }

    if (params.targetSourceId) {
      const directEnvelope = createTNFEnvelope(
        'task',
        this.getOrchestratorEnvelopeIdentity(),
        this.getAgentEnvelopeIdentity(params.targetSourceId),
        {
          action: 'self_prompt_continue',
          parameters: {
            prompt: params.prompt,
            reason: params.reason,
            channel: params.channel,
            cumulativeId,
            ...(params.metadata || {}),
          },
          priority: 'high',
        },
        {
          channelId: params.channel,
          sessionId: this.sessionId,
        },
        {
          audit: this.getOrchestratorAudit({
            channelId: params.channel,
            sessionId: this.sessionId,
          }),
        }
      );

      try {
        await this.redisClient.publish(
          `${this.config.REDIS_KEYS.EGRESS_PREFIX}:${params.targetSourceId}`,
          JSON.stringify(directEnvelope)
        );
      } catch (error: any) {
        this.log(
          'warn',
          'SELF-PROMPT',
          `Failed targeted self-prompt publish for ${params.targetSourceId}: ${error.message}`
        );
      }
    }

    this.log('info', 'SELF-PROMPT', `Self-prompt issued (${params.kind})`, {
      channel: params.channel,
      targetAgentId: params.targetAgentId,
      targetProcessId: params.targetProcessId,
      reason: params.reason,
    });
  }
}
