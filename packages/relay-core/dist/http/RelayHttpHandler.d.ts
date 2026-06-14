import { StandaloneRedisClient } from '@the-new-fuse/infrastructure';
import http from 'http';
import { JWTAuthService } from '../auth/JWTAuthService.js';
import { RedisRelayBridge } from '../redis-relay-bridge.js';
import { Agent, BridgeOperatorContext, Channel } from '../types.js';
import { Logger } from '../utils/Logger.js';
interface IRelayServerCore {
    agents: Map<string, Agent>;
    channels: Map<string, Channel>;
    sockets: Map<string, WebSocket>;
    bridge: RedisRelayBridge | null;
    bridgeGateEnabled: boolean;
    pendingBridgeAgents: Map<string, {
        agent: Agent;
        socket: WebSocket;
        requestedAt: number;
    }>;
    approvedBridgeAgents: Set<string>;
    activityPersistenceEnabled: boolean;
    activityRedis: StandaloneRedisClient | null;
    activityUpstash: any;
    activityStreamKey: string;
    activityChannelPrefix: string;
    activityMaxLen: number;
    authService: JWTAuthService | null;
    socketRemoteAddresses: WeakMap<WebSocket, string | null>;
    approveBridgeAccess(agentId: string, operator: BridgeOperatorContext): boolean;
    denyBridgeAccess(agentId: string, reason: string | undefined, operator: BridgeOperatorContext): boolean;
    setBridgeGateEnabled(enabled: boolean, operator: BridgeOperatorContext): void;
    send(ws: WebSocket, message: any): void;
    emitRelayActivityEvent(eventType: string, content: string, metadata: Record<string, unknown>, operator: BridgeOperatorContext): void;
    readActivityStream(streamKey: string, count: number): Promise<Array<[string, string[]]>>;
    parseActivityFields(fields: Record<string, string>): any;
}
export declare class RelayHttpHandler {
    private core;
    private logger;
    private bridgeAutoApproveLoopback;
    private bridgeAutoApprovePlatforms;
    private bridgeAutoApproveAgentIds;
    constructor(core: IRelayServerCore, logger: Logger);
    handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void;
    private handleHealthEndpoint;
    private handleAgentsEndpoint;
    private handleChannelsEndpoint;
    private handleStatusEndpoint;
    private handleBridgePendingEndpoint;
    private handleBridgeApproveRequest;
    private handleBridgeDenyRequest;
    private handleBridgeToggleRequest;
    private handleActivityRecentEndpoint;
    private getPendingBridgeRequests;
}
export {};
//# sourceMappingURL=RelayHttpHandler.d.ts.map