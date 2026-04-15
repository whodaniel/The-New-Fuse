#!/usr/bin/env node
/**
 * TNF Relay Server - Standalone WebSocket Relay
 * Part of @the-new-fuse/relay-core package
 *
 * Usage:
 *   pnpm run relay         # Start on default port 3000
 *   PORT=3002 pnpm run relay  # Start on custom port
 *
 * Endpoints:
 *   WebSocket: ws://localhost:3000/ws
 *   Health:    http://localhost:3000/health
 *   Agents:    http://localhost:3000/agents
 *   Channels:  http://localhost:3000/channels
 */
import { EventEmitter } from 'events';
import { type TnfAgentLifecycleStatus } from './contracts/lifecycle';
import type { OrchestrationTask } from './protocol/task-protocol';
interface Agent {
    id: string;
    canonicalEntityId?: string | null;
    operationalHandle: string;
    runtimeSessionId?: string | null;
    aliases: string[];
    name: string;
    platform: string;
    status: TnfAgentLifecycleStatus;
    capabilities: string[];
    channels: string[];
    connectedAt: number;
    lastSeen: number;
    metadata?: Record<string, unknown>;
}
interface Channel {
    id: string;
    name: string;
    description: string;
    createdBy: string;
    createdAt: number;
    isPrivate: boolean;
    members: string[];
}
interface BridgeOperatorContext {
    actor: string;
    remoteAddress?: string | null;
    userAgent?: string | null;
    reason?: string | null;
}
export declare class TNFRelayServer extends EventEmitter {
    private server;
    private wss;
    private agents;
    private sockets;
    private channels;
    private agentChannels;
    private heartbeatInterval;
    private port;
    private bridge;
    private bridgeSubscribedAgents;
    private pendingBridgeAgents;
    private approvedBridgeAgents;
    private bridgeGateEnabled;
    private authService;
    private stallDetector;
    private logger;
    private conversationManagers;
    private subscriptionRegistry;
    private activityRedis;
    private activityUpstash;
    private activityRedisConnectPromise;
    private activityPersistenceEnabled;
    private activityPersistenceRequired;
    private readonly activityStreamKey;
    private readonly activityChannelPrefix;
    private readonly activityMaxLen;
    constructor(port?: number);
    private handleHttpRequest;
    /**
     * Handle POST /bridge/approve - Approve an agent for bridge access
     */
    private handleBridgeApproveRequest;
    /**
     * Handle POST /bridge/deny - Deny an agent bridge access
     */
    private handleBridgeDenyRequest;
    /**
     * Handle POST /bridge/toggle - Toggle bridge gate on/off
     */
    private handleBridgeToggleRequest;
    private handleActivityRecentEndpoint;
    private getOrCreateConversationManager;
    private setupWebSocket;
    private handleMessage;
    private shouldPersistActivityMessage;
    private persistActivityMessage;
    private parseActivityFields;
    private ensureActivityPersistenceReady;
    private handleAgentDisconnect;
    private send;
    private handleBridgeEgress;
    dispatchTask(task: OrchestrationTask, channelId: string): void;
    private persistTaskDispatch;
    private broadcastToChannel;
    private broadcast;
    private toChannelDisplayName;
    private ensureChannelExists;
    private syncAgentChannelMembership;
    private syncBridgeSubscriptions;
    private ensureBridgeSubscription;
    private emitRelayActivityEvent;
    private persistRelayActivityTimelineEvent;
    /**
     * Approve an agent for bridge access (operator action)
     */
    approveBridgeAccess(agentId: string, operator?: BridgeOperatorContext): boolean;
    /**
     * Deny an agent bridge access (operator action)
     */
    denyBridgeAccess(agentId: string, reason?: string, operator?: BridgeOperatorContext): boolean;
    /**
     * Get list of pending bridge access requests
     */
    getPendingBridgeRequests(): Array<{
        agentId: string;
        name: string;
        platform: string;
        requestedAt: number;
    }>;
    /**
     * Toggle bridge gate on/off
     */
    setBridgeGateEnabled(enabled: boolean, operator?: BridgeOperatorContext): void;
    /**
     * Approve an agent for bridge access (operator action)
     */
    approveBridgeAccess(agentId: string): boolean;
    /**
     * Deny an agent bridge access (operator action)
     */
    denyBridgeAccess(agentId: string, reason?: string): boolean;
    /**
     * Get list of pending bridge access requests
     */
    getPendingBridgeRequests(): Array<{
        agentId: string;
        name: string;
        platform: string;
        requestedAt: number;
    }>;
    /**
     * Toggle bridge gate on/off
     */
    setBridgeGateEnabled(enabled: boolean): void;
    /**
     * Send a recovery message to wake up stalled conversations
     */
    private sendRecoveryMessage;
    private createDefaultChannel;
    private startHeartbeatMonitor;
    start(): Promise<void>;
    stop(): Promise<void>;
    getAgents(): Agent[];
    getChannels(): Channel[];
    getAgent(id: string): Agent | undefined;
    getChannel(id: string): Channel | undefined;
}
export default TNFRelayServer;
//# sourceMappingURL=standalone-relay.d.ts.map