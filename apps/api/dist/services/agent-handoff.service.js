"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AgentHandoffService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentHandoffService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const relay_core_1 = require("@the-new-fuse/relay-core");
const fs = __importStar(require("fs/promises"));
const unified_ledger_service_1 = require("../modules/unified-ledger/unified-ledger.service");
const REQUIRED_GATE_CHAIN = [
    'TENANT_SCOPE_GATE',
    'TRACE_CONTINUITY_GATE',
    'TERMINAL_BINDING_GATE',
    'HIGH_RISK_RUNTIME_GATE',
    'CHANNEL_MEMBERSHIP_GATE',
];
let AgentHandoffService = AgentHandoffService_1 = class AgentHandoffService {
    constructor(configService, unifiedLedgerService, pointerResolver) {
        this.configService = configService;
        this.unifiedLedgerService = unifiedLedgerService;
        this.pointerResolver = pointerResolver;
        this.logger = new common_1.Logger(AgentHandoffService_1.name);
        this.store = new relay_core_1.HandoffStoreService({
            redisUrl: this.configService.get('REDIS_URL'),
            keyPrefix: this.configService.get('HANDOFF_KEY_PREFIX') || 'tnf:handoff:v1',
        });
    }
    /**
     * Resolves resource pointers in a handoff packet.
     * This allows agents to receive lightweight packets and fetch heavy data on-demand.
     */
    async resolvePointers(packet) {
        const resolved = {};
        const pointers = packet.payload.resourcePointers;
        if (!pointers)
            return resolved;
        for (const [key, pointer] of Object.entries(pointers)) {
            try {
                if (this.pointerResolver?.resolve) {
                    resolved[key] = await this.pointerResolver.resolve(pointer);
                }
                else {
                    resolved[key] = await this.resolvePointerFallback(pointer);
                }
            }
            catch (error) {
                this.logger.error(`Failed to resolve pointer ${key} in packet ${packet.id}: ${error.message}`);
                throw error;
            }
        }
        return resolved;
    }
    async resolvePointerFallback(pointer) {
        const uri = typeof pointer.uri === 'string' ? pointer.uri : '';
        if (!uri) {
            throw new Error('Pointer is missing a uri field');
        }
        if (uri.startsWith('file://')) {
            const filePath = uri.replace('file://', '');
            return fs.readFile(filePath, 'utf8');
        }
        throw new Error(`Pointer resolver unavailable for URI scheme. Enable A2A pointer resolver or use file:// pointers. uri=${uri}`);
    }
    async publishForTenant(input, tenantId) {
        const parsed = this.parsePacketInput(input);
        if (parsed.scope.tenantId !== tenantId) {
            throw new common_1.BadRequestException('scope.tenantId must match the requested tenantId');
        }
        try {
            this.assertPublishLineage(parsed, tenantId);
            this.assertGateChain(parsed.gateDecisions);
            const lineageGateDecisions = parsed.cumulativeId.federation?.gate_decisions || [];
            if (lineageGateDecisions.length > 0) {
                this.assertGateChain(lineageGateDecisions);
                this.assertGateConsistency(parsed.gateDecisions, lineageGateDecisions, 'cumulativeId.federation.gate_decisions');
            }
            this.assertTerminalBinding(parsed);
        }
        catch (error) {
            await this.emitGateTelemetryEvent({
                tenantId,
                category: 'publish_validation',
                outcome: 'deny',
                mode: this.getExternalGateMode(),
                reason: error.message,
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
    async listForAgent(agentId, tenantId, options) {
        const rows = await this.store.listForAgent(agentId, options);
        return rows.filter((row) => row.packet.scope.tenantId === tenantId);
    }
    async acknowledgeForTenant(input, tenantId) {
        const parsed = this.parseAckInput(input);
        const packet = await this.store.getPacket(parsed.packetId);
        if (!packet) {
            throw new common_1.NotFoundException(`Handoff packet not found: ${parsed.packetId}`);
        }
        if (packet.scope.tenantId !== tenantId) {
            throw new common_1.BadRequestException('Packet tenant scope does not match tenantId');
        }
        try {
            this.assertAckLineage(parsed, packet, tenantId);
            const ackGateDecisions = parsed.cumulativeId.federation?.gate_decisions || [];
            if (ackGateDecisions.length > 0) {
                this.assertGateChain(ackGateDecisions);
                this.assertGateConsistency(packet.gateDecisions || [], ackGateDecisions, 'ack cumulativeId.federation.gate_decisions', { allowMissingExpected: true });
            }
        }
        catch (error) {
            await this.emitGateTelemetryEvent({
                tenantId,
                category: 'ack_validation',
                outcome: 'deny',
                mode: this.getExternalGateMode(),
                reason: error.message,
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
    async listBySession(sessionKey, tenantId, limit) {
        const packets = await this.store.listBySession(sessionKey, limit);
        return packets.filter((packet) => packet.scope.tenantId === tenantId);
    }
    async getPacket(packetId, tenantId) {
        const packet = await this.store.getPacket(packetId);
        if (!packet) {
            throw new common_1.NotFoundException(`Handoff packet not found: ${packetId}`);
        }
        if (packet.scope.tenantId !== tenantId) {
            throw new common_1.BadRequestException('Packet tenant scope does not match tenantId');
        }
        return packet;
    }
    async onModuleDestroy() {
        try {
            await this.store.close();
        }
        catch (error) {
            this.logger.warn(`Failed to close handoff store cleanly: ${error.message}`);
        }
    }
    parsePacketInput(input) {
        try {
            return relay_core_1.HandoffPacketInput.parse(input);
        }
        catch (error) {
            throw new common_1.BadRequestException(`Invalid handoff packet input: ${error.message}`);
        }
    }
    parseAckInput(input) {
        try {
            return relay_core_1.HandoffAckInput.parse(input);
        }
        catch (error) {
            throw new common_1.BadRequestException(`Invalid handoff ack input: ${error.message}`);
        }
    }
    assertPublishLineage(parsed, tenantId) {
        const mcid = parsed.cumulativeId;
        if (mcid.scope.tenant_id !== tenantId || mcid.scope.tenant_id !== parsed.scope.tenantId) {
            throw new common_1.BadRequestException('cumulativeId.scope.tenant_id must match handoff tenant scope');
        }
        if ((parsed.scope.sessionKey || null) !== (mcid.scope.session_key || null)) {
            throw new common_1.BadRequestException('cumulativeId.scope.session_key must match scope.sessionKey');
        }
        if ((parsed.scope.workflowId || null) !== (mcid.scope.workflow_id || null)) {
            throw new common_1.BadRequestException('cumulativeId.scope.workflow_id must match scope.workflowId');
        }
        if ((parsed.scope.channelId || null) !== (mcid.scope.channel_id || null)) {
            throw new common_1.BadRequestException('cumulativeId.scope.channel_id must match scope.channelId');
        }
        if (parsed.payload.twipRef?.twid &&
            mcid.lineage.twid &&
            parsed.payload.twipRef.twid !== mcid.lineage.twid) {
            throw new common_1.BadRequestException('cumulativeId.lineage.twid must match payload.twipRef.twid');
        }
    }
    assertGateChain(gateDecisions) {
        const byGate = new Map(gateDecisions.map((entry) => [entry.gate, entry]));
        for (const requiredGate of REQUIRED_GATE_CHAIN) {
            const gate = byGate.get(requiredGate);
            if (!gate) {
                throw new common_1.BadRequestException(`Missing required federation gate decision: ${requiredGate}`);
            }
            if (gate.decision !== 'allow') {
                throw new common_1.BadRequestException(`Federation gate ${requiredGate} is not allow (decision=${gate.decision})`);
            }
        }
    }
    assertGateConsistency(expectedGateDecisions, candidateGateDecisions, candidateLabel, options) {
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
                throw new common_1.BadRequestException(`Missing gate ${expected.gate} in ${candidateLabel} while validating gate continuity`);
            }
            if (candidate.decision !== expected.decision) {
                throw new common_1.BadRequestException(`Gate decision mismatch for ${expected.gate}: packet=${expected.decision}, ${candidateLabel}=${candidate.decision}`);
            }
        }
    }
    assertTerminalBinding(parsed) {
        const terminalBound = parsed.tags.includes('terminal-bound') || Boolean(parsed.payload.twipRef);
        if (!terminalBound)
            return;
        const twid = parsed.payload.twipRef?.twid || parsed.cumulativeId.lineage.twid;
        if (!twid) {
            throw new common_1.BadRequestException('Terminal-bound handoffs require payload.twipRef.twid or cumulativeId.lineage.twid');
        }
    }
    assertAckLineage(parsed, packet, tenantId) {
        const mcid = parsed.cumulativeId;
        if (mcid.scope.tenant_id !== tenantId || mcid.scope.tenant_id !== packet.scope.tenantId) {
            throw new common_1.BadRequestException('Ack cumulativeId.scope.tenant_id must match packet tenant scope');
        }
        if ((packet.scope.sessionKey || null) !== (mcid.scope.session_key || null)) {
            throw new common_1.BadRequestException('Ack cumulativeId.scope.session_key must match packet scope.sessionKey');
        }
        if ((packet.scope.workflowId || null) !== (mcid.scope.workflow_id || null)) {
            throw new common_1.BadRequestException('Ack cumulativeId.scope.workflow_id must match packet scope.workflowId');
        }
        if ((packet.scope.channelId || null) !== (mcid.scope.channel_id || null)) {
            throw new common_1.BadRequestException('Ack cumulativeId.scope.channel_id must match packet scope.channelId');
        }
        if (mcid.lineage.handoff_packet_id && mcid.lineage.handoff_packet_id !== parsed.packetId) {
            throw new common_1.BadRequestException('Ack cumulativeId.lineage.handoff_packet_id must match packetId');
        }
        if (packet.cumulativeId?.lineage?.correlation_id &&
            mcid.lineage.correlation_id !== packet.cumulativeId.lineage.correlation_id) {
            throw new common_1.BadRequestException('Ack cumulativeId.lineage.correlation_id must match published packet cumulativeId');
        }
    }
    async emitLifecycleEvent(category, payload) {
        try {
            const tenantId = typeof payload.tenantId === 'string' && payload.tenantId.trim().length > 0
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
        }
        catch (error) {
            this.logger.warn(`Failed to emit handoff lifecycle timeline event (${category}): ${error.message}`);
        }
    }
    getExternalGateMode() {
        const raw = String(this.configService.get('TNF_GATE_POLICY_MODE') || 'off').toLowerCase();
        if (raw === 'warn' || raw === 'enforce')
            return raw;
        return 'off';
    }
    async assertExternalFederationGatePolicy(parsed) {
        const mode = this.getExternalGateMode();
        if (mode === 'off')
            return;
        const tenantId = parsed.scope.tenantId;
        const correlationId = parsed.cumulativeId?.lineage?.correlation_id || null;
        const endpoint = this.configService.get('TNF_GATE_POLICY_ENDPOINT');
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
            if (mode === 'enforce')
                throw new common_1.BadRequestException(message);
            this.logger.warn(`External gate policy check skipped: ${message}`);
            return;
        }
        const url = `${endpoint.replace(/\/+$/, '')}/gates/federation/evaluate`;
        const token = this.configService.get('TNF_GATE_POLICY_TOKEN');
        const evaluation = await this.evaluateExternalFederationGatePolicy(url, token, parsed);
        if (evaluation.kind === 'fallback') {
            const message = `${evaluation.reason}; local federation gate validation accepted request`;
            await this.emitGateTelemetryEvent({
                tenantId,
                category: 'external_policy',
                outcome: 'warn',
                mode,
                reason: message,
                correlationId,
            });
            this.logger.warn(message);
            return;
        }
        if (evaluation.kind === 'allow') {
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
        const message = evaluation.reason;
        await this.emitGateTelemetryEvent({
            tenantId,
            category: 'external_policy',
            outcome: mode === 'enforce' ? 'deny' : 'warn',
            mode,
            reason: message,
            correlationId,
        });
        if (mode === 'enforce') {
            throw new common_1.BadRequestException(message);
        }
        this.logger.warn(message);
    }
    async evaluateExternalFederationGatePolicy(url, token, parsed) {
        let response;
        try {
            response = await fetch(url, {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    ...(token ? { 'x-auth-token': token } : {}),
                },
                body: JSON.stringify({ request: parsed }),
            });
        }
        catch (error) {
            return {
                kind: 'fallback',
                reason: `External gate policy request failed: ${error.message}`,
            };
        }
        const statusLabel = `HTTP ${response.status}`;
        let result = null;
        let parsedJson = true;
        try {
            result = await response.json();
        }
        catch {
            parsedJson = false;
            result = null;
        }
        if (response.status >= 500) {
            return {
                kind: 'fallback',
                reason: `External gate policy worker unavailable (${statusLabel})`,
            };
        }
        if (response.ok && (!parsedJson || result === null)) {
            return {
                kind: 'fallback',
                reason: `External gate policy worker returned invalid JSON (${statusLabel})`,
            };
        }
        if (response.ok && result?.ok === true) {
            return { kind: 'allow' };
        }
        const deniedReasons = Array.isArray(result?.reasons)
            ? result.reasons.map((entry) => String(entry))
            : [];
        const reasonText = deniedReasons.length > 0 ? deniedReasons.join('; ') : statusLabel;
        return {
            kind: 'deny',
            reason: `External federation gate denied packet: ${reasonText}`,
        };
    }
    async emitGateTelemetryEvent(input) {
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
};
exports.AgentHandoffService = AgentHandoffService;
exports.AgentHandoffService = AgentHandoffService = AgentHandoffService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [config_1.ConfigService,
        unified_ledger_service_1.UnifiedLedgerService, Object])
], AgentHandoffService);
//# sourceMappingURL=agent-handoff.service.js.map