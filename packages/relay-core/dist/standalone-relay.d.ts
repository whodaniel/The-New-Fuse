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
import type { OrchestrationTask } from './protocol/task-protocol';
interface Agent {
    id: string;
    name: string;
    platform: string;
    status: 'active' | 'idle' | 'offline';
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
    private authService;
    private stallDetector;
    private conversationManagers;
    private subscriptionRegistry;
    private activityRedis;
    private activityRedisConnectPromise;
    private activityPersistenceEnabled;
    private activityPersistenceRequired;
    private readonly activityStreamKey;
    private readonly activityChannelPrefix;
    private readonly activityMaxLen;
    constructor(port?: number);
    private handleHttpRequest;
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
    private broadcastToChannel;
    private broadcast;
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