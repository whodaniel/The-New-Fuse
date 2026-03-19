import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HandoffAckInput,
  HandoffPacketInput,
  HandoffStoreService,
  type HandoffAck,
  type HandoffPacket,
} from '@the-new-fuse/relay-core';
import { UnifiedLedgerService } from '../modules/unified-ledger/unified-ledger.service';

const REQUIRED_GATE_CHAIN = [
  'TENANT_SCOPE_GATE',
  'TRACE_CONTINUITY_GATE',
  'TERMINAL_BINDING_GATE',
  'HIGH_RISK_RUNTIME_GATE',
  'CHANNEL_MEMBERSHIP_GATE',
] as const;

type GateDecision = { gate: string; decision: 'allow' | 'deny' | 'quarantine' };
type ExternalGateMode = 'off' | 'warn' | 'enforce';
type GateTelemetryOutcome = 'allow' | 'warn' | 'deny' | 'error';

@Injectable()
export class AgentHandoffService implements OnModuleDestroy {
  private readonly logger = new Logger(AgentHandoffService.name);
  private readonly store: HandoffStoreService;

  constructor(
    private readonly configService: ConfigService,
    private readonly unifiedLedgerService: UnifiedLedgerService
  ) {
    this.store = new HandoffStoreService({
      redisUrl: this.configService.get<string>('REDIS_URL'),
      keyPrefix: this.configService.get<string>('HANDOFF_KEY_PREFIX') || 'tnf:handoff:v1',
    });
  }

  async publishForTenant(input: unknown, tenantId: string): Promise<HandoffPacket> {
    const parsed = this.parsePacketInput(input);
    if (parsed.scope.tenantId !== tenantId) {
      throw new BadRequestException('scope.tenantId must match the requested tenantId');
    }
    try {
      this.assertPublishLineage(parsed, tenantId);
      this.assertGateChain(parsed.gateDecisions);
      const lineageGateDecisions = parsed.cumulativeId.federation?.gate_decisions || [];
      if (lineageGateDecisions.length > 0) {
        this.assertGateChain(lineageGateDecisions);
        this.assertGateConsistency(
          parsed.gateDecisions,
          lineageGateDecisions,
          'cumulativeId.federation.gate_decisions'
        );
      }
      this.assertTerminalBinding(parsed);
    } catch (error) {
      await this.emitGateTelemetryEvent({
        tenantId,
        category: 'publish_validation',
        outcome: 'deny',
        mode: this.getExternalGateMode(),
        reason: (error as Error).message,
        correlationId: parsed.cumulativeId?.lineage?.correlation_id || null,
      });
      throw error;
    }
    await this.assertExternalFederationGatePolicy(parsed);
    const packet = await this.store.publish(parsed);
    await this.emitLifecycleEvent('handoff_publish', {
      tenantId,
      packetId: packet.id,
      packetVersion: packet.version,
      correlationId: packet.cumulativeId?.lineage?.correlation_id ?? null,
      fromAgentId: packet.fromAgentId,
      targetAgentIds: packet.targets.agentIds,
      priority: packet.priority,
      scope: packet.scope,
      tags: packet.tags,
      gateDecisions: packet.gateDecisions,
      workflowId: packet.scope.workflowId,
      sessionKey: packet.scope.sessionKey,
      payloadSummary: packet.payload?.summary ?? 'n/a',
    });
    return packet;
  }

  async listForAgent(
    agentId: string,
    tenantId: string,
    options: { limit?: number; includeAcknowledged?: boolean }
  ): Promise<
    Array<{ packet: HandoffPacket; ack: { status: string; note?: string; ackedAt: string } | null }>
  > {
    const rows = await this.store.listForAgent(agentId, options);
    return rows.filter((row) => row.packet.scope.tenantId === tenantId);
  }

  async acknowledgeForTenant(input: unknown, tenantId: string): Promise<HandoffAck> {
    const parsed = this.parseAckInput(input);
    const packet = await this.store.getPacket(parsed.packetId);
    if (!packet) {
      throw new NotFoundException(`Handoff packet not found: ${parsed.packetId}`);
    }
    if (packet.scope.tenantId !== tenantId) {
      throw new BadRequestException('Packet tenant scope does not match tenantId');
    }
    try {
      this.assertAckLineage(parsed, packet, tenantId);
      const ackGateDecisions = parsed.cumulativeId.federation?.gate_decisions || [];
      if (ackGateDecisions.length > 0) {
        this.assertGateChain(ackGateDecisions);
        this.assertGateConsistency(
          packet.gateDecisions || [],
          ackGateDecisions,
          'ack cumulativeId.federation.gate_decisions',
          { allowMissingExpected: true }
        );
      }
    } catch (error) {
      await this.emitGateTelemetryEvent({
        tenantId,
        category: 'ack_validation',
        outcome: 'deny',
        mode: this.getExternalGateMode(),
        reason: (error as Error).message,
        correlationId: parsed.cumulativeId?.lineage?.correlation_id || null,
        packetId: parsed.packetId,
      });
      throw error;
    }
    const ackGateDecisions = parsed.cumulativeId.federation?.gate_decisions || [];
    const ack = await this.store.acknowledge(parsed);
    await this.emitLifecycleEvent('handoff_ack', {
      tenantId,
      packetId: parsed.packetId,
      packetVersion: packet.version,
      correlationId: parsed.cumulativeId?.lineage?.correlation_id ?? null,
      agentId: parsed.agentId,
      status: parsed.status,
      note: parsed.note,
      ackedAt: ack.ackedAt,
      workflowId: packet.scope.workflowId,
      sessionKey: packet.scope.sessionKey,
      packetGateDecisions: packet.gateDecisions || [],
      ackGateDecisions,
    });
    return ack;
  }

  async listBySession(
    sessionKey: string,
    tenantId: string,
    limit: number
  ): Promise<HandoffPacket[]> {
    const packets = await this.store.listBySession(sessionKey, limit);
    return packets.filter((packet) => packet.scope.tenantId === tenantId);
  }

  async getPacket(packetId: string, tenantId: string): Promise<HandoffPacket> {
    const packet = await this.store.getPacket(packetId);
    if (!packet) {
      throw new NotFoundException(`Handoff packet not found: ${packetId}`);
    }
    if (packet.scope.tenantId !== tenantId) {
      throw new BadRequestException('Packet tenant scope does not match tenantId');
    }
    return packet;
  }

  async onModuleDestroy() {
    try {
      await this.store.close();
    } catch (error) {
      this.logger.warn(`Failed to close handoff store cleanly: ${(error as Error).message}`);
    }
  }

  private parsePacketInput(input: unknown) {
    try {
      return HandoffPacketInput.parse(input);
    } catch (error) {
      throw new BadRequestException(`Invalid handoff packet input: ${(error as Error).message}`);
    }
  }

  private parseAckInput(input: unknown) {
    try {
      return HandoffAckInput.parse(input);
    } catch (error) {
      throw new BadRequestException(`Invalid handoff ack input: ${(error as Error).message}`);
    }
  }

  private assertPublishLineage(
    parsed: ReturnType<typeof HandoffPacketInput.parse>,
    tenantId: string
  ) {
    const mcid = parsed.cumulativeId;
    if (mcid.scope.tenant_id !== tenantId || mcid.scope.tenant_id !== parsed.scope.tenantId) {
      throw new BadRequestException('cumulativeId.scope.tenant_id must match handoff tenant scope');
    }

    if ((parsed.scope.sessionKey || null) !== (mcid.scope.session_key || null)) {
      throw new BadRequestException('cumulativeId.scope.session_key must match scope.sessionKey');
    }

    if ((parsed.scope.workflowId || null) !== (mcid.scope.workflow_id || null)) {
      throw new BadRequestException('cumulativeId.scope.workflow_id must match scope.workflowId');
    }

    if ((parsed.scope.channelId || null) !== (mcid.scope.channel_id || null)) {
      throw new BadRequestException('cumulativeId.scope.channel_id must match scope.channelId');
    }

    if (
      parsed.payload.twipRef?.twid &&
      mcid.lineage.twid &&
      parsed.payload.twipRef.twid !== mcid.lineage.twid
    ) {
      throw new BadRequestException('cumulativeId.lineage.twid must match payload.twipRef.twid');
    }
  }

  private assertGateChain(gateDecisions: GateDecision[]) {
    const byGate = new Map(gateDecisions.map((entry) => [entry.gate, entry]));
    for (const requiredGate of REQUIRED_GATE_CHAIN) {
      const gate = byGate.get(requiredGate);
      if (!gate) {
        throw new BadRequestException(`Missing required federation gate decision: ${requiredGate}`);
      }
      if (gate.decision !== 'allow') {
        throw new BadRequestException(
          `Federation gate ${requiredGate} is not allow (decision=${gate.decision})`
        );
      }
    }
  }

  private assertGateConsistency(
    expectedGateDecisions: GateDecision[],
    candidateGateDecisions: GateDecision[],
    candidateLabel: string,
    options?: { allowMissingExpected?: boolean }
  ) {
    if (expectedGateDecisions.length === 0 || candidateGateDecisions.length === 0) {
      return;
    }

    const allowMissingExpected = options?.allowMissingExpected ?? false;
    const candidateByGate = new Map(candidateGateDecisions.map((entry) => [entry.gate, entry]));
    for (const expected of expectedGateDecisions) {
      const candidate = candidateByGate.get(expected.gate);
      if (!candidate) {
        if (allowMissingExpected) {
          continue;
        }
        throw new BadRequestException(
          `Missing gate ${expected.gate} in ${candidateLabel} while validating gate continuity`
        );
      }

      if (candidate.decision !== expected.decision) {
        throw new BadRequestException(
          `Gate decision mismatch for ${expected.gate}: packet=${expected.decision}, ${candidateLabel}=${candidate.decision}`
        );
      }
    }
  }

  private assertTerminalBinding(parsed: ReturnType<typeof HandoffPacketInput.parse>) {
    const terminalBound = parsed.tags.includes('terminal-bound') || Boolean(parsed.payload.twipRef);
    if (!terminalBound) return;

    const twid = parsed.payload.twipRef?.twid || parsed.cumulativeId.lineage.twid;
    if (!twid) {
      throw new BadRequestException(
        'Terminal-bound handoffs require payload.twipRef.twid or cumulativeId.lineage.twid'
      );
    }
  }

  private assertAckLineage(
    parsed: ReturnType<typeof HandoffAckInput.parse>,
    packet: HandoffPacket,
    tenantId: string
  ) {
    const mcid = parsed.cumulativeId;
    if (mcid.scope.tenant_id !== tenantId || mcid.scope.tenant_id !== packet.scope.tenantId) {
      throw new BadRequestException(
        'Ack cumulativeId.scope.tenant_id must match packet tenant scope'
      );
    }

    if ((packet.scope.sessionKey || null) !== (mcid.scope.session_key || null)) {
      throw new BadRequestException(
        'Ack cumulativeId.scope.session_key must match packet scope.sessionKey'
      );
    }

    if ((packet.scope.workflowId || null) !== (mcid.scope.workflow_id || null)) {
      throw new BadRequestException(
        'Ack cumulativeId.scope.workflow_id must match packet scope.workflowId'
      );
    }

    if ((packet.scope.channelId || null) !== (mcid.scope.channel_id || null)) {
      throw new BadRequestException(
        'Ack cumulativeId.scope.channel_id must match packet scope.channelId'
      );
    }

    if (mcid.lineage.handoff_packet_id && mcid.lineage.handoff_packet_id !== parsed.packetId) {
      throw new BadRequestException(
        'Ack cumulativeId.lineage.handoff_packet_id must match packetId'
      );
    }

    if (
      packet.cumulativeId?.lineage?.correlation_id &&
      mcid.lineage.correlation_id !== packet.cumulativeId.lineage.correlation_id
    ) {
      throw new BadRequestException(
        'Ack cumulativeId.lineage.correlation_id must match published packet cumulativeId'
      );
    }
  }

  private async emitLifecycleEvent(
    category: 'handoff_publish' | 'handoff_ack' | 'handoff_gate_evaluation',
    payload: Record<string, unknown>
  ): Promise<void> {
    try {
      const tenantId =
        typeof payload.tenantId === 'string' && payload.tenantId.trim().length > 0
          ? payload.tenantId
          : undefined;
      await this.unifiedLedgerService.createTimelineEvent({
        eventType: 'historical_event',
        actor: 'agent_handoff_service',
        userId: tenantId ? `tenant:${tenantId}` : 'tenant:unknown',
        payload: {
          category,
          ...payload,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Failed to emit handoff lifecycle timeline event (${category}): ${(error as Error).message}`
      );
    }
  }

  private getExternalGateMode(): ExternalGateMode {
    const raw = String(
      this.configService.get<string>('TNF_GATE_POLICY_MODE') || 'off'
    ).toLowerCase();
    if (raw === 'warn' || raw === 'enforce') return raw;
    return 'off';
  }

  private async assertExternalFederationGatePolicy(
    parsed: ReturnType<typeof HandoffPacketInput.parse>
  ): Promise<void> {
    const mode = this.getExternalGateMode();
    if (mode === 'off') return;
    const tenantId = parsed.scope.tenantId;
    const correlationId = parsed.cumulativeId?.lineage?.correlation_id || null;

    const endpoint = this.configService.get<string>('TNF_GATE_POLICY_ENDPOINT');
    if (!endpoint) {
      const message = 'TNF_GATE_POLICY_ENDPOINT is not configured';
      await this.emitGateTelemetryEvent({
        tenantId,
        category: 'external_policy',
        outcome: mode === 'enforce' ? 'deny' : 'warn',
        mode,
        reason: message,
        correlationId,
      });
      if (mode === 'enforce') throw new BadRequestException(message);
      this.logger.warn(`External gate policy check skipped: ${message}`);
      return;
    }

    const url = `${endpoint.replace(/\/+$/, '')}/gates/federation/evaluate`;
    const token = this.configService.get<string>('TNF_GATE_POLICY_TOKEN');
    let response: Response;

    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(token ? { 'x-auth-token': token } : {}),
        },
        body: JSON.stringify({ request: parsed }),
      });
    } catch (error) {
      const message = `External gate policy request failed: ${(error as Error).message}`;
      await this.emitGateTelemetryEvent({
        tenantId,
        category: 'external_policy',
        outcome: mode === 'enforce' ? 'deny' : 'warn',
        mode,
        reason: message,
        correlationId,
      });
      if (mode === 'enforce') throw new BadRequestException(message);
      this.logger.warn(message);
      return;
    }

    let result: any = null;
    try {
      result = await response.json();
    } catch {
      result = null;
    }

    const deniedReasons = Array.isArray(result?.reasons)
      ? result.reasons.map((entry: unknown) => String(entry))
      : [];
    const reasonText = deniedReasons.length > 0 ? deniedReasons.join('; ') : 'no reason provided';
    const allowed = response.ok && result?.ok === true;

    if (allowed) {
      await this.emitGateTelemetryEvent({
        tenantId,
        category: 'external_policy',
        outcome: 'allow',
        mode,
        reason: 'External federation gate policy allowed request',
        correlationId,
      });
      return;
    }

    const message = `External federation gate denied packet: ${reasonText}`;
    await this.emitGateTelemetryEvent({
      tenantId,
      category: 'external_policy',
      outcome: mode === 'enforce' ? 'deny' : 'warn',
      mode,
      reason: message,
      correlationId,
    });
    if (mode === 'enforce') {
      throw new BadRequestException(message);
    }

    this.logger.warn(message);
  }

  private async emitGateTelemetryEvent(input: {
    tenantId: string;
    category: 'publish_validation' | 'ack_validation' | 'external_policy';
    outcome: GateTelemetryOutcome;
    mode: ExternalGateMode;
    reason: string;
    correlationId?: string | null;
    packetId?: string | null;
  }): Promise<void> {
    await this.emitLifecycleEvent('handoff_gate_evaluation', {
      tenantId: input.tenantId,
      gateCategory: input.category,
      outcome: input.outcome,
      mode: input.mode,
      reason: input.reason,
      correlationId: input.correlationId || null,
      packetId: input.packetId || null,
      at: new Date().toISOString(),
    });
  }
}
