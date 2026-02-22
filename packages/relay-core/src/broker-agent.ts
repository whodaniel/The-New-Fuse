#!/usr/bin/env node
import { createClient, type RedisClientType } from 'redis';
import { createTNFEnvelope } from './protocol/tnf-envelope';

type QueueTask = {
  id: string;
  title?: string;
  description?: string;
  priority?: string;
  assignee?: string;
  requiredCapabilities?: string[];
  itinerary?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
};

type PolicyDecision = 'allow' | 'escalate' | 'deny';

type PolicyResult = {
  decision: PolicyDecision;
  reason: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
};

type RegistryAgent = {
  id?: string;
  agentId?: string;
  role?: string;
  status?: string;
  capabilities?: string[];
  lastSeen?: string;
  isOnline?: boolean;
  [key: string]: unknown;
};

const CONFIG = {
  REDIS_URL:
    process.env.REDIS_URL ||
    process.env.RAILWAY_REDIS_URL ||
    process.env.LIVE_REDIS_URL ||
    process.env.REDIS_PRIVATE_URL ||
    process.env.REDIS_TLS_URL ||
    'redis://default:mDNmtwseaVHcQsCHaIoZapjlWrvAjtot@tramway.proxy.rlwy.net:13570',
  LEDGER_API_BASE:
    process.env.LEDGER_API_BASE ||
    process.env.RAILWAY_API_URL ||
    process.env.LIVE_API_BASE_URL ||
    process.env.API_BASE_URL ||
    process.env.TNF_API_BASE ||
    'http://localhost:3001',
  TASK_QUEUE_KEY: process.env.BROKER_TASK_QUEUE_KEY || 'tnf:master:tasks:realtime',
  DECISION_CHANNEL: process.env.BROKER_DECISION_CHANNEL || 'tnf:broker:decisions',
  INGRESS_CHANNEL: process.env.BROKER_INGRESS_CHANNEL || 'tnf:bus:ingress',
  EGRESS_PREFIX: process.env.BROKER_EGRESS_PREFIX || 'tnf:bus:egress',
  HEARTBEAT_CHANNEL: process.env.BROKER_HEARTBEAT_CHANNEL || 'tnf:heartbeat',
  AGENT_REGISTRY_KEY: process.env.BROKER_AGENT_REGISTRY_KEY || 'tnf:agent-registry',
  DIRECTOR_REVIEW_QUEUE: process.env.BROKER_DIRECTOR_REVIEW_QUEUE || 'tnf:director:review:pending',
  POLICY_MODE: process.env.BROKER_POLICY_MODE || 'strict',
  ALLOW_CRITICAL_WITHOUT_DIRECTOR:
    (process.env.BROKER_ALLOW_CRITICAL_WITHOUT_DIRECTOR || 'false') === 'true',
  HEARTBEAT_INTERVAL_MS: parseInt(process.env.BROKER_HEARTBEAT_INTERVAL_MS || '', 10) || 3000,
  QUEUE_BLOCK_TIMEOUT_SEC: parseInt(process.env.BROKER_QUEUE_BLOCK_TIMEOUT_SEC || '', 10) || 5,
};

class BrokerAgent {
  private redis: RedisClientType;
  private redisBlocking: RedisClientType;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private running = false;
  private readonly brokerId = process.env.BROKER_ID || `BROKER-${Date.now()}`;

  constructor() {
    this.redis = createClient({ url: CONFIG.REDIS_URL });
    this.redisBlocking = createClient({ url: CONFIG.REDIS_URL });
    this.redis.on('error', (err) => console.error('[Broker] Redis error:', err?.message || err));
    this.redisBlocking.on('error', (err) =>
      console.error('[Broker] Redis blocking error:', err?.message || err)
    );
  }

  async start(): Promise<void> {
    await this.redis.connect();
    await this.redisBlocking.connect();
    this.running = true;

    await this.registerBroker();
    this.startHeartbeat();

    console.log(`[Broker] Online as ${this.brokerId}`);
    console.log(`[Broker] Consuming queue: ${CONFIG.TASK_QUEUE_KEY}`);
    await this.consumeLoop();
  }

  private async registerBroker(): Promise<void> {
    const now = new Date().toISOString();
    const record = {
      id: this.brokerId,
      name: 'TNF Runtime Broker',
      role: 'broker',
      platform: 'broker-agent',
      status: 'active',
      isOnline: true,
      capabilities: ['task-routing', 'priority-dispatch', 'realtime-broker-routing'],
      registeredAt: now,
      lastSeen: now,
    };
    await this.redis.hSet(CONFIG.AGENT_REGISTRY_KEY, this.brokerId, JSON.stringify(record));
  }

  private startHeartbeat(): void {
    const sendHeartbeat = async () => {
      const nowIso = new Date().toISOString();
      const heartbeat = {
        type: 'heartbeat',
        source: this.brokerId,
        role: 'broker',
        timestamp: nowIso,
      };

      try {
        await this.redis.publish(CONFIG.HEARTBEAT_CHANNEL, JSON.stringify(heartbeat));
        const existing = await this.redis.hGet(CONFIG.AGENT_REGISTRY_KEY, this.brokerId);
        const parsed = existing ? (JSON.parse(existing) as RegistryAgent) : {};
        await this.redis.hSet(
          CONFIG.AGENT_REGISTRY_KEY,
          this.brokerId,
          JSON.stringify({
            ...parsed,
            id: this.brokerId,
            role: 'broker',
            status: 'active',
            isOnline: true,
            lastSeen: nowIso,
          })
        );
      } catch (error) {
        console.warn('[Broker] Heartbeat failed:', (error as Error).message);
      }
    };

    this.heartbeatInterval = setInterval(sendHeartbeat, CONFIG.HEARTBEAT_INTERVAL_MS);
    void sendHeartbeat();
  }

  private async consumeLoop(): Promise<void> {
    while (this.running) {
      try {
        const result = (await this.redisBlocking.brPop(
          CONFIG.TASK_QUEUE_KEY,
          CONFIG.QUEUE_BLOCK_TIMEOUT_SEC
        )) as { key: string; element: string } | null;
        if (!result?.element) {
          continue;
        }

        const task = this.safeParseTask(result.element);
        if (!task?.id) {
          continue;
        }

        await this.dispatchTask(task);
      } catch (error) {
        console.error('[Broker] Consume loop error:', (error as Error).message);
      }
    }
  }

  private safeParseTask(raw: string): QueueTask | null {
    try {
      return JSON.parse(raw) as QueueTask;
    } catch {
      console.warn('[Broker] Skipping malformed queue payload');
      return null;
    }
  }

  private normalizePriority(priority: unknown): 'low' | 'normal' | 'high' | 'critical' {
    const p = String(priority || 'medium').toLowerCase();
    if (p === 'urgent' || p === 'critical' || p === 'p0') return 'critical';
    if (p === 'high' || p === 'p1') return 'high';
    if (p === 'low' || p === 'p3') return 'low';
    return 'normal';
  }

  private isStrictPolicyMode(): boolean {
    return String(CONFIG.POLICY_MODE || 'strict').toLowerCase() !== 'permissive';
  }

  private evaluatePolicy(task: QueueTask, targetAgentId: string | null): PolicyResult {
    const lane = String((task.itinerary as any)?.lane || '').toLowerCase();
    const priority = this.normalizePriority(task.priority);
    const metadata = (task.metadata || {}) as Record<string, unknown>;
    const requiresDirectorApproval =
      metadata.requiresDirectorApproval === true ||
      metadata.policyGate === 'director_approval_required';
    const hasTarget = !!targetAgentId;

    if (!lane) {
      return {
        decision: 'escalate',
        reason: 'Missing itinerary lane for dispatch governance',
        riskLevel: 'high',
      };
    }

    if (!hasTarget && this.isStrictPolicyMode()) {
      return {
        decision: 'escalate',
        reason: 'No target worker available in strict policy mode',
        riskLevel: 'high',
      };
    }

    if (requiresDirectorApproval) {
      return {
        decision: 'escalate',
        reason: 'Task explicitly requires Director approval',
        riskLevel: priority === 'critical' ? 'critical' : 'high',
      };
    }

    if (priority === 'critical' && !CONFIG.ALLOW_CRITICAL_WITHOUT_DIRECTOR) {
      return {
        decision: 'escalate',
        reason: 'Critical task requires Director review',
        riskLevel: 'critical',
      };
    }

    if (
      lane === 'suggestion_vote' ||
      lane === 'changelog_suggestion' ||
      lane === 'kanban_delivery'
    ) {
      return {
        decision: 'deny',
        reason: `Lane '${lane}' is non-realtime and cannot be broker-dispatched`,
        riskLevel: 'medium',
      };
    }

    return {
      decision: 'allow',
      reason: 'Policy checks passed',
      riskLevel: priority === 'critical' ? 'high' : 'low',
    };
  }

  private isWorkerAgent(agent: RegistryAgent): boolean {
    const role = String(agent.role || '').toLowerCase();
    const status = String(agent.status || '').toLowerCase();
    if (agent.isOnline === false) return false;
    if (!['active', 'idle', 'ready', 'online'].includes(status)) return false;
    return !['broker', 'orchestrator', 'director'].includes(role);
  }

  private getAgentId(agent: RegistryAgent): string {
    return String(agent.id || agent.agentId || '');
  }

  private getCapabilityList(agent: RegistryAgent): string[] {
    if (!Array.isArray(agent.capabilities)) return [];
    return agent.capabilities.map((cap) => String(cap).toLowerCase());
  }

  private async selectTargetAgent(task: QueueTask): Promise<string | null> {
    const registry = await this.redis.hGetAll(CONFIG.AGENT_REGISTRY_KEY);
    const agents = Object.values(registry)
      .map((raw) => {
        try {
          return JSON.parse(raw) as RegistryAgent;
        } catch {
          return null;
        }
      })
      .filter((agent): agent is RegistryAgent => !!agent)
      .filter((agent) => this.isWorkerAgent(agent));

    if (agents.length === 0) return null;

    const requestedAssignee = String(task.assignee || '').trim();
    if (requestedAssignee) {
      const exact = agents.find((agent) => this.getAgentId(agent) === requestedAssignee);
      if (exact) return this.getAgentId(exact);
    }

    const requiredCapabilities = Array.isArray(task.requiredCapabilities)
      ? task.requiredCapabilities.map((cap) => String(cap).toLowerCase())
      : [];
    if (requiredCapabilities.length > 0) {
      const capable = agents.find((agent) =>
        requiredCapabilities.every((cap) => this.getCapabilityList(agent).includes(cap))
      );
      if (capable) return this.getAgentId(capable);
    }

    const sorted = [...agents].sort((a, b) => {
      const ta = Date.parse(String(a.lastSeen || 0)) || 0;
      const tb = Date.parse(String(b.lastSeen || 0)) || 0;
      return ta - tb;
    });
    return this.getAgentId(sorted[0]) || null;
  }

  private async publishPolicyDecision(
    task: QueueTask,
    policy: PolicyResult,
    targetAgentId: string | null
  ): Promise<void> {
    await this.redis.publish(
      CONFIG.DECISION_CHANNEL,
      JSON.stringify({
        brokerId: this.brokerId,
        taskId: task.id,
        policyDecision: policy.decision,
        policyReason: policy.reason,
        riskLevel: policy.riskLevel,
        targetAgentId,
        decidedAt: new Date().toISOString(),
        itinerary: task.itinerary || {},
      })
    );
  }

  private async escalateToDirector(task: QueueTask, policy: PolicyResult): Promise<void> {
    const payload = {
      task,
      brokerId: this.brokerId,
      escalatedAt: new Date().toISOString(),
      reason: policy.reason,
      riskLevel: policy.riskLevel,
      sourceQueue: CONFIG.TASK_QUEUE_KEY,
    };
    await this.redis.lPush(CONFIG.DIRECTOR_REVIEW_QUEUE, JSON.stringify(payload));
  }

  private async dispatchTask(task: QueueTask): Promise<void> {
    const targetAgentId = await this.selectTargetAgent(task);
    const priority = this.normalizePriority(task.priority);
    const channelId = String((task.itinerary as any)?.lane || 'realtime_broker_routing');
    const policy = this.evaluatePolicy(task, targetAgentId);

    await this.publishPolicyDecision(task, policy, targetAgentId);

    if (policy.decision === 'deny') {
      await this.persistDecision(task, null, policy, 'rejected');
      console.warn(`[Broker] Denied ${task.id}: ${policy.reason}`);
      return;
    }

    if (policy.decision === 'escalate') {
      await this.escalateToDirector(task, policy);
      await this.persistDecision(task, null, policy, 'under_review');
      console.warn(`[Broker] Escalated ${task.id} to Director: ${policy.reason}`);
      return;
    }

    const envelope = createTNFEnvelope(
      'task',
      { agentId: this.brokerId, role: 'coordinator', platform: 'broker-agent' },
      targetAgentId ? { agentId: targetAgentId, role: 'worker' } : { broadcast: true },
      {
        action: 'execute_task',
        taskId: task.id,
        task,
        priority,
      },
      {
        channelId,
        sessionId: this.brokerId,
      }
    );

    if (targetAgentId) {
      await this.redis.publish(
        `${CONFIG.EGRESS_PREFIX}:${targetAgentId}`,
        JSON.stringify(envelope)
      );
    } else {
      await this.redis.publish(CONFIG.INGRESS_CHANNEL, JSON.stringify(envelope));
    }

    await this.persistDecision(task, targetAgentId, policy, 'queued');
    console.log(
      `[Broker] Dispatched ${task.id} -> ${targetAgentId || 'broadcast'} (${String(task.title || '')})`
    );
  }

  private async persistDecision(
    task: QueueTask,
    targetAgentId: string | null,
    policy: PolicyResult,
    status: 'queued' | 'under_review' | 'rejected'
  ): Promise<void> {
    const base = CONFIG.LEDGER_API_BASE.replace(/\/$/, '');
    const patchUrl = `${base}/api/unified-ledger/records/${encodeURIComponent(task.id)}`;
    const ingestUrl = `${base}/api/unified-ledger/ingest/orchestration`;

    const patchPayload = {
      status,
      itinerary: task.itinerary || undefined,
      metadata: {
        actor: this.brokerId,
        brokerDecision: {
          brokerId: this.brokerId,
          targetAgentId,
          dispatchedAt: new Date().toISOString(),
          policyDecision: policy.decision,
          policyReason: policy.reason,
          riskLevel: policy.riskLevel,
        },
      },
    };

    try {
      const patchRes = await fetch(patchUrl, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(patchPayload),
      });
      if (patchRes.ok) return;
    } catch {
      // fall through to ingest fallback
    }

    try {
      await fetch(ingestUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type: 'TASK_DISPATCH',
          action: status === 'queued' ? 'broker_dispatch' : 'broker_policy_gate',
          task: {
            ...task,
            targetAgents: targetAgentId ? [targetAgentId] : [],
          },
          brokerId: this.brokerId,
          status,
          policyDecision: policy.decision,
          policyReason: policy.reason,
          riskLevel: policy.riskLevel,
        }),
      });
    } catch (error) {
      console.warn('[Broker] Failed to persist dispatch:', (error as Error).message);
    }
  }

  async shutdown(): Promise<void> {
    this.running = false;
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    try {
      const existing = await this.redis.hGet(CONFIG.AGENT_REGISTRY_KEY, this.brokerId);
      const parsed = existing ? (JSON.parse(existing) as RegistryAgent) : {};
      await this.redis.hSet(
        CONFIG.AGENT_REGISTRY_KEY,
        this.brokerId,
        JSON.stringify({
          ...parsed,
          id: this.brokerId,
          role: 'broker',
          status: 'offline',
          isOnline: false,
          lastSeen: new Date().toISOString(),
        })
      );
    } catch {
      // best effort
    }
    await this.redisBlocking.quit();
    await this.redis.quit();
  }
}

const broker = new BrokerAgent();

process.on('SIGINT', async () => {
  await broker.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await broker.shutdown();
  process.exit(0);
});

void broker.start().catch(async (error) => {
  console.error('[Broker] Fatal startup error:', (error as Error).message);
  await broker.shutdown();
  process.exit(1);
});
