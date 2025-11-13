/**
 * Content Safety Service
 *
 * Content moderation and safety filtering for generative media
 *
 * @module ContentSafetyService
 * @since 2025-10-06
 */
import { MediaType, MediaGenerationRequest } from './GenerativeMediaProviderRegistry';
export interface SafetyCheck {
    id: string;
    timestamp: Date;
    content: string;
    contentType: 'prompt' | 'output';
    mediaType: MediaType;
    result: SafetyResult;
    provider: string;
    userId?: string;
}
export interface SafetyResult {
    safe: boolean;
    confidence: number;
    categories: SafetyCategory[];
    blockedReasons?: string[];
    warnings?: string[];
    suggestedAlternatives?: string[];
}
export interface SafetyCategory {
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    description: string;
}
export interface SafetyPolicy {
    id: string;
    name: string;
    enabled: boolean;
    strictness: 'permissive' | 'moderate' | 'strict';
    categories: {
        adult_content: boolean;
        violence: boolean;
        hate_speech: boolean;
        harassment: boolean;
        illegal_activities: boolean;
        self_harm: boolean;
        dangerous_content: boolean;
        deceptive_content: boolean;
        spam: boolean;
        copyright_violation: boolean;
    };
    customRules: SafetyRule[];
    exemptions: {
        userIds?: string[];
        mediaTypes?: MediaType[];
        providers?: string[];
    };
}
export interface SafetyRule {
    id: string;
    name: string;
    pattern: string | RegExp;
    action: 'block' | 'warn' | 'flag';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
}
export declare class ContentSafetyService {
    private policies;
    private safetyChecks;
    private moderationProviders;
    constructor();
    /**
     * Check content safety before generation
     */
    checkPromptSafety(request: MediaGenerationRequest, userId?: string): Promise<SafetyResult>;
    /**
     * Check generated content safety
     */
    checkOutputSafety(outputUrl: string, mediaType: MediaType, providerId: string, userId?: string): Promise<SafetyResult>;
    /**
     * Create or update safety policy
     */
    updatePolicy(policy: Partial<SafetyPolicy> & {
        id: string;
    }): Promise<SafetyPolicy>;
    /**
     * Get safety statistics
     */
    getSafetyStats(period?: 'today' | 'week' | 'month'): {
        totalChecks: number;
        blockedContent: number;
        warningContent: number;
        safeContent: number;
        blockRate: number;
        topCategories: Array<{
            category: string;
            count: number;
        }>;
        byMediaType: Record<string, {
            total: number;
            blocked: number;
        }>;
    };
    /**
     * Add custom safety rule
     */
    addCustomRule(policyId: string, rule: Omit<SafetyRule, 'id'>): SafetyRule;
    /**
     * Get flagged content for review
     */
    getFlaggedContent(limit?: number): SafetyCheck[];
    private getApplicablePolicy;
    private checkCustomRules;
    private moderateImage;
    private moderateVideo;
    private moderateAudio;
    private combineResults;
    private recordSafetyCheck;
    private getChecksForPeriod;
    private setupDefaultPolicies;
    private setupModerationProviders;
    private generateId;
}
//# sourceMappingURL=ContentSafetyService.d.ts.map