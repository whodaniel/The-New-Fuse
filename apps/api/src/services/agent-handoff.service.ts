import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  HandoffAck,
  HandoffPacket,
} from '@the-new-fuse/relay-core/dist/protocol/handoff-protocol.js';
import {
  HandoffAckInput,
  HandoffPacketInput,
} from '@the-new-fuse/relay-core/dist/protocol/handoff-protocol.js';
import { HandoffStoreService } from '@the-new-fuse/relay-core/dist/services/HandoffStoreService.js';
import { UnifiedLedgerService } from '../modules/unified-ledger/unified-ledger.service';

const REQUIRED_GATE_CHAIN = [
  'TENANT_SCOPE_GATE',
  'TRACE_CONTINUITY_GATE',
  'TERMINAL_BINDING_GATE',
  'HIGH_RISK_RUNTIME_GATE',
  'CHANNEL_MEMBERSHIP_GATE',
] as const;

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
    this.assertPublishLineage(parsed, tenantId);
    this.assertGateChain(parsed.gateDecisions);
    this.assertTerminalBinding(parsed);
    const packet = await this.store.publish(parsed);
    await this.emitLifecycleEvent('handoff_publish', {
      tenantId,
      packetId: packet.id,
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
    this.assertAckLineage(parsed, packet, tenantId);
    const ack = await this.store.acknowledge(parsed);
    await this.emitLifecycleEvent('handoff_ack', {
      tenantId,
      packetId: parsed.packetId,
      correlationId: parsed.cumulativeId?.lineage?.correlation_id ?? null,
      agentId: parsed.agentId,
      status: parsed.status,
      note: parsed.note,
      ackedAt: ack.ackedAt,
      workflowId: packet.scope.workflowId,
      sessionKey: packet.scope.sessionKey,
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

  private assertGateChain(
    gateDecisions: Array<{ gate: string; decision: 'allow' | 'deny' | 'quarantine' }>
  ) {
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
    category: 'handoff_publish' | 'handoff_ack',
    payload: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.unifiedLedgerService.createTimelineEvent({
        eventType: 'historical_event',
        actor: 'agent_handoff_service',
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
}
