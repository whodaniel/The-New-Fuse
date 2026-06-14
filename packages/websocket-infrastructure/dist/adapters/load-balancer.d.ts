export declare class WebSocketLoadBalancer {
    private readonly logger;
    private serverHealth;
    private userToServer;
    getServerForUser(userId: string): string | undefined;
    assignUserToServer(userId: string, serverId: string): void;
    removeUserFromServer(userId: string): void;
    markServerHealthy(serverId: string): void;
    markServerUnhealthy(serverId: string): void;
    isServerHealthy(serverId: string): boolean;
    getHealthyServers(): string[];
    generateNginxConfig(): string;
    generateHAProxyConfig(): string;
    getStats(): {
        totalServers: number;
        healthyServers: number;
        activeUsers: number;
        serverHealth: {
            [k: string]: boolean;
        };
    };
}
//# sourceMappingURL=load-balancer.d.ts.map