export interface MemoryProviderConfig {
    provider: string;
    enabled: boolean;
    config: Record<string, any>;
}
export interface MemoryProvider {
    name: string;
    description: string;
    requiresConfig: string[];
}
export declare class MemoryProviderService {
    private readonly configPath;
    private readonly tnfHome;
    private readonly providers;
    constructor();
    getProviders(): Promise<(MemoryProvider & {
        enabled: boolean;
        type: string;
    })[]>;
    setup(): Promise<MemoryProviderConfig>;
    getCurrentConfig(): MemoryProviderConfig;
    status(): Promise<void>;
    disableProvider(): Promise<MemoryProviderConfig>;
    reset(): Promise<void>;
    private saveConfig;
}
//# sourceMappingURL=MemoryProviderService.d.ts.map