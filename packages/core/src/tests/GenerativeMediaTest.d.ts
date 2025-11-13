/**
 * Comprehensive Test Suite for Generative Media
 *
 * Tests all providers, media types, and functionality
 *
 * @module GenerativeMediaTest
 * @since 2025-10-06
 */
import { GenerativeMediaProviderRegistry, MediaType, MediaGenerationRequest } from '../services/GenerativeMediaProviderRegistry';
import { MediaProcessingPipeline } from '../services/MediaProcessingPipeline';
export interface TestResult {
    provider: string;
    mediaType: MediaType;
    success: boolean;
    duration: number;
    cost?: number;
    error?: string;
    outputUrl?: string;
    metadata?: any;
}
export interface TestSuite {
    name: string;
    tests: TestCase[];
}
export interface TestCase {
    name: string;
    provider?: string;
    mediaType: MediaType;
    request: MediaGenerationRequest;
    expectedOutputs: number;
    timeout: number;
    skipIfNoApiKey?: boolean;
}
export declare class GenerativeMediaTester {
    private registry;
    private pipeline?;
    private results;
    constructor(registry: GenerativeMediaProviderRegistry, pipeline?: MediaProcessingPipeline);
    /**
     * Run comprehensive test suite
     */
    runFullTestSuite(): Promise<{
        summary: {
            total: number;
            passed: number;
            failed: number;
            skipped: number;
            totalCost: number;
            averageDuration: number;
        };
        results: TestResult[];
        byProvider: Record<string, TestResult[]>;
        byMediaType: Record<string, TestResult[]>;
    }>;
    private runSpeedTest;
    private checkApiKey;
    private generateReport;
}
//# sourceMappingURL=GenerativeMediaTest.d.ts.map