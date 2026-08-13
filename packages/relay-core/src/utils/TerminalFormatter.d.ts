// @ts-nocheck
/**
 * Terminal Formatter for TNF Relay Server
 *
 * Provides structured, colorized console output for relay events.
 * Inspired by the Fuse Connect landing page's terminal demo aesthetic.
 *
 * All functions are pure formatters — they return formatted strings
 * and write to stdout. They do NOT mutate state.
 */
export declare const relay: {
    /**
     * Print the enhanced startup banner.
     * Call this INSTEAD OF the existing box-drawing banner in `start()`.
     */
    banner(opts: {
        port: number;
        redisBridge: boolean;
        activityPersistence: boolean;
        stallDetection: boolean;
        jwtAuth: boolean;
    }): void;
    agentRegistered(name: string, id: string, platform: string, authenticated: boolean): void;
    agentDisconnected(agentId: string): void;
    agentTimeout(agentId: string): void;
    newConnection(remoteAddress: string | undefined): void;
    channelCreated(name: string, id: string, createdBy: string): void;
    channelJoined(name: string, channelId: string): void;
    channelDeleted(channelId: string): void;
    channelPaused(channelId: string): void;
    channelResumed(channelId: string): void;
    messageRouted(type: string, from: string, to?: string, channel?: string): void;
    protocolMessage(type: string, agentId: string | null): void;
    phaseChanged(conversationId: string, from: string, to: string): void;
    conversationStalled(channelId: string): void;
    conversationRecovered(channelId: string): void;
    conversationTerminated(channelId: string): void;
    stallDetectorStarted(): void;
    redisBridgeConnected(): void;
    activityPersistenceEnabled(streamKey: string): void;
    taskDispatched(taskId: string, channelId: string): void;
    autoCreatedChannel(name: string): void;
    serverStopped(): void;
    shutdownRequested(): void;
    error(context: string, message: string): void;
};
export default relay;
//# sourceMappingURL=TerminalFormatter.d.ts.map