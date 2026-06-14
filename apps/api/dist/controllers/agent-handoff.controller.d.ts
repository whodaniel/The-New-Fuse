import { User } from '@the-new-fuse/database';
type AuthUser = User & {
    tenantId?: string;
    agencyId?: string;
    roles?: string[];
    permissions?: string[];
};
import { AgentHandoffService } from '../services/agent-handoff.service';
export declare class AgentHandoffController {
    private readonly handoffService;
    constructor(handoffService: AgentHandoffService);
    publish(input: unknown, user: AuthUser): Promise<{
        fromAgentId: string;
        targets: {
            agentIds: string[];
            roles: string[];
        };
        scope: {
            tenantId: string;
            sessionKey?: string | undefined;
            workflowId?: string | undefined;
            channelId?: string | undefined;
        };
        payload: {
            title: string;
            summary: string;
            prompt: string;
            acceptanceCriteria: string[];
            nextActions: string[];
            artifacts: string[];
            resourcePointers?: Record<string, {
                uri: string;
                integrityHash?: string | undefined;
                mimeType?: string | undefined;
                size?: number | undefined;
            }> | undefined;
            twipRef?: {
                twid: string;
                correlationId?: string | undefined;
                integrityHash?: string | undefined;
            } | undefined;
        };
        priority: "low" | "high" | "critical" | "normal";
        tags: string[];
        id: string;
        version: "1.0" | "1.1";
        createdAt: string;
        expiresAt: string;
        status: "pending" | "completed" | "rejected" | "received" | "claimed";
        cumulativeId?: {
            spec: "tnf/mcid/0.1";
            id: string;
            scope: {
                tenant_id: string;
                cron_namespace?: string | null | undefined;
                session_key?: string | null | undefined;
                workflow_id?: string | null | undefined;
                channel_id?: string | null | undefined;
            };
            lineage: {
                correlation_id: string;
                causation_id: string | null;
                trace_id?: string | null | undefined;
                handoff_packet_id?: string | null | undefined;
                twid?: string | null | undefined;
                task_id?: string | null | undefined;
                schedule_id?: string | null | undefined;
                schedule_run_id?: string | null | undefined;
            };
            federation?: {
                domain: string;
                route: string[];
                hop_count: number;
                gate_decisions: {
                    gate: string;
                    decision: "allow" | "deny" | "quarantine";
                    at: string;
                    reason?: string | undefined;
                }[];
            } | undefined;
            issued_at?: string | undefined;
        } | undefined;
        gateDecisions?: {
            gate: string;
            decision: "allow" | "deny" | "quarantine";
            at: string;
            reason?: string | undefined;
        }[] | undefined;
    }>;
    listAgentInbox(agentId: string, user: AuthUser, tenantIdParam?: string, limit?: number, includeAcknowledged?: string): Promise<{
        agentId: string;
        tenantId: string;
        count: number;
        items: {
            packet: import("@the-new-fuse/relay-core").HandoffPacket;
            ack: {
                status: string;
                note?: string;
                ackedAt: string;
            } | null;
        }[];
    }>;
    acknowledge(input: unknown, user: AuthUser): Promise<{
        packetId: string;
        agentId: string;
        status: "completed" | "rejected" | "received" | "claimed";
        cumulativeId: {
            spec: "tnf/mcid/0.1";
            id: string;
            scope: {
                tenant_id: string;
                cron_namespace?: string | null | undefined;
                session_key?: string | null | undefined;
                workflow_id?: string | null | undefined;
                channel_id?: string | null | undefined;
            };
            lineage: {
                correlation_id: string;
                causation_id: string | null;
                trace_id?: string | null | undefined;
                handoff_packet_id?: string | null | undefined;
                twid?: string | null | undefined;
                task_id?: string | null | undefined;
                schedule_id?: string | null | undefined;
                schedule_run_id?: string | null | undefined;
            };
            federation?: {
                domain: string;
                route: string[];
                hop_count: number;
                gate_decisions: {
                    gate: string;
                    decision: "allow" | "deny" | "quarantine";
                    at: string;
                    reason?: string | undefined;
                }[];
            } | undefined;
            issued_at?: string | undefined;
        };
        ackedAt: string;
        note?: string | undefined;
    }>;
    listBySession(sessionKey: string, user: AuthUser, tenantIdParam?: string, limit?: number): Promise<{
        sessionKey: string;
        tenantId: string;
        count: number;
        packets: {
            fromAgentId: string;
            targets: {
                agentIds: string[];
                roles: string[];
            };
            scope: {
                tenantId: string;
                sessionKey?: string | undefined;
                workflowId?: string | undefined;
                channelId?: string | undefined;
            };
            payload: {
                title: string;
                summary: string;
                prompt: string;
                acceptanceCriteria: string[];
                nextActions: string[];
                artifacts: string[];
                resourcePointers?: Record<string, {
                    uri: string;
                    integrityHash?: string | undefined;
                    mimeType?: string | undefined;
                    size?: number | undefined;
                }> | undefined;
                twipRef?: {
                    twid: string;
                    correlationId?: string | undefined;
                    integrityHash?: string | undefined;
                } | undefined;
            };
            priority: "low" | "high" | "critical" | "normal";
            tags: string[];
            id: string;
            version: "1.0" | "1.1";
            createdAt: string;
            expiresAt: string;
            status: "pending" | "completed" | "rejected" | "received" | "claimed";
            cumulativeId?: {
                spec: "tnf/mcid/0.1";
                id: string;
                scope: {
                    tenant_id: string;
                    cron_namespace?: string | null | undefined;
                    session_key?: string | null | undefined;
                    workflow_id?: string | null | undefined;
                    channel_id?: string | null | undefined;
                };
                lineage: {
                    correlation_id: string;
                    causation_id: string | null;
                    trace_id?: string | null | undefined;
                    handoff_packet_id?: string | null | undefined;
                    twid?: string | null | undefined;
                    task_id?: string | null | undefined;
                    schedule_id?: string | null | undefined;
                    schedule_run_id?: string | null | undefined;
                };
                federation?: {
                    domain: string;
                    route: string[];
                    hop_count: number;
                    gate_decisions: {
                        gate: string;
                        decision: "allow" | "deny" | "quarantine";
                        at: string;
                        reason?: string | undefined;
                    }[];
                } | undefined;
                issued_at?: string | undefined;
            } | undefined;
            gateDecisions?: {
                gate: string;
                decision: "allow" | "deny" | "quarantine";
                at: string;
                reason?: string | undefined;
            }[] | undefined;
        }[];
    }>;
    getPacket(packetId: string, tenantIdParam: string, user: AuthUser): Promise<{
        fromAgentId: string;
        targets: {
            agentIds: string[];
            roles: string[];
        };
        scope: {
            tenantId: string;
            sessionKey?: string | undefined;
            workflowId?: string | undefined;
            channelId?: string | undefined;
        };
        payload: {
            title: string;
            summary: string;
            prompt: string;
            acceptanceCriteria: string[];
            nextActions: string[];
            artifacts: string[];
            resourcePointers?: Record<string, {
                uri: string;
                integrityHash?: string | undefined;
                mimeType?: string | undefined;
                size?: number | undefined;
            }> | undefined;
            twipRef?: {
                twid: string;
                correlationId?: string | undefined;
                integrityHash?: string | undefined;
            } | undefined;
        };
        priority: "low" | "high" | "critical" | "normal";
        tags: string[];
        id: string;
        version: "1.0" | "1.1";
        createdAt: string;
        expiresAt: string;
        status: "pending" | "completed" | "rejected" | "received" | "claimed";
        cumulativeId?: {
            spec: "tnf/mcid/0.1";
            id: string;
            scope: {
                tenant_id: string;
                cron_namespace?: string | null | undefined;
                session_key?: string | null | undefined;
                workflow_id?: string | null | undefined;
                channel_id?: string | null | undefined;
            };
            lineage: {
                correlation_id: string;
                causation_id: string | null;
                trace_id?: string | null | undefined;
                handoff_packet_id?: string | null | undefined;
                twid?: string | null | undefined;
                task_id?: string | null | undefined;
                schedule_id?: string | null | undefined;
                schedule_run_id?: string | null | undefined;
            };
            federation?: {
                domain: string;
                route: string[];
                hop_count: number;
                gate_decisions: {
                    gate: string;
                    decision: "allow" | "deny" | "quarantine";
                    at: string;
                    reason?: string | undefined;
                }[];
            } | undefined;
            issued_at?: string | undefined;
        } | undefined;
        gateDecisions?: {
            gate: string;
            decision: "allow" | "deny" | "quarantine";
            at: string;
            reason?: string | undefined;
        }[] | undefined;
    }>;
    private resolveTenantId;
    private readTenantFromBody;
    private readAgentIdFromBody;
    private isPrivileged;
    private hasPermission;
    private assertCanPublish;
    private assertCanReadAgentInbox;
    private assertCanAcknowledge;
    private assertCanReadSession;
}
export {};
//# sourceMappingURL=agent-handoff.controller.d.ts.map