import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type HandoffAck, type HandoffPacket } from '@the-new-fuse/relay-core';
import { UnifiedLedgerService } from '../modules/unified-ledger/unified-ledger.service';
export declare class AgentHandoffService implements OnModuleDestroy {
    private readonly configService;
    private readonly unifiedLedgerService;
    private readonly pointerResolver?;
    private readonly logger;
    private readonly store;
    constructor(configService: ConfigService, unifiedLedgerService: UnifiedLedgerService, pointerResolver?: {
        resolve: (pointer: Record<string, unknown>) => Promise<unknown>;
    } | undefined);
    /**
     * Resolves resource pointers in a handoff packet.
     * This allows agents to receive lightweight packets and fetch heavy data on-demand.
     */
    resolvePointers(packet: HandoffPacket): Promise<Record<string, any>>;
    private resolvePointerFallback;
    publishForTenant(input: unknown, tenantId: string): Promise<HandoffPacket>;
    listForAgent(agentId: string, tenantId: string, options: {
        limit?: number;
        includeAcknowledged?: boolean;
    }): Promise<Array<{
        packet: HandoffPacket;
        ack: {
            status: string;
            note?: string;
            ackedAt: string;
        } | null;
    }>>;
    acknowledgeForTenant(input: unknown, tenantId: string): Promise<HandoffAck>;
    listBySession(sessionKey: string, tenantId: string, limit: number): Promise<HandoffPacket[]>;
    getPacket(packetId: string, tenantId: string): Promise<HandoffPacket>;
    onModuleDestroy(): Promise<void>;
    private parsePacketInput;
    private parseAckInput;
    private assertPublishLineage;
    private assertGateChain;
    private assertGateConsistency;
    private assertTerminalBinding;
    private assertAckLineage;
    private emitLifecycleEvent;
    private getExternalGateMode;
    private assertExternalFederationGatePolicy;
    private evaluateExternalFederationGatePolicy;
    private emitGateTelemetryEvent;
}
//# sourceMappingURL=agent-handoff.service.d.ts.map