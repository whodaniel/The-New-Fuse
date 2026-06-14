export interface DiscoveredAgent {
    id: string;
    name: string;
    capabilities: string[];
}
export declare function useA2ADiscovery(): {
    discoveredAgents: DiscoveredAgent[];
    discoverAgents: (criteria?: any) => Promise<void>;
};
//# sourceMappingURL=useA2ADiscovery.d.ts.map