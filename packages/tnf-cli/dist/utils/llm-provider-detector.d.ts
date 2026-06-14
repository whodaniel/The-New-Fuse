/**
 * Dynamic LLM Provider Detector
 *
 * Inspects environment for API keys, verifies connectivity,
 * and selects the best available provider with working models.
 *
 * Protocol: Inspect → Verify → Select
 */
export interface ProviderInfo {
    name: string;
    envKey: string;
    baseUrl: string;
    hasKey: boolean;
    reachable: boolean;
    models: string[];
    selectedModel?: string;
    priority: number;
}
export interface DetectionResult {
    selected: ProviderInfo | null;
    available: ProviderInfo[];
    errors: string[];
}
/**
 * Detect available providers from environment
 */
export declare function detectProviders(): Promise<DetectionResult>;
/**
 * Get best model for a provider
 */
export declare function getBestModel(providerName: string): string;
/**
 * Report detection results
 */
export declare function reportDetection(result: DetectionResult): void;
//# sourceMappingURL=llm-provider-detector.d.ts.map