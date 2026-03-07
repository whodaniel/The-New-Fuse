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
} from '@the-new-fuse/relay-core/dist/protocol/handoff-protocol.js';
import { HandoffStoreService } from '@the-new-fuse/relay-core/dist/services/HandoffStoreService.js';
import type {
  HandoffAck,
  HandoffPacket,
} from '@the-new-fuse/relay-core/dist/protocol/handoff-protocol.js';

@Injectable()
export class AgentHandoffService implements OnModuleDestroy {
  private readonly logger = new Logger(AgentHandoffService.name);
  private readonly store: HandoffStoreService;

  constructor(private readonly configService: ConfigService) {
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
    return this.store.publish(parsed);
  }

  async listForAgent(
    agentId: string,
    tenantId: string,
    options: { limit?: number; includeAcknowledged?: boolean }
  ): Promise<Array<{ packet: HandoffPacket; ack: { status: string; note?: string; ackedAt: string } | null }>> {
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
    return this.store.acknowledge(parsed);
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
}
