export interface Node {
    id: string;
    address: string;
    healthy: boolean;
    connections: number;
    weight?: number;
    responseTime?: number;
}
export type BalancingStrategy = 'round-robin' | 'least-connections' | 'weighted-random' | 'fastest-response';
export declare class LoadBalancer {
    private readonly logger;
    private nodes;
    private strategy;
    private currentIndex;
    constructor();
    addNode(node: Omit<Node, 'healthy' | 'connections'>): Node;
    removeNode(id: string): boolean;
    setStrategy(strategy: BalancingStrategy): void;
    getNextNode(): Promise<Node | null>;
    releaseNode(nodeId: string): void;
    updateNodeHealth(nodeId: string, healthy: boolean): void;
    private getWeightedRandomNode;
}
//# sourceMappingURL=LoadBalancer.d.ts.map