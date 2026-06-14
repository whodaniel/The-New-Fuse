export declare enum UserType {
    HUMAN = "human",
    AI_AGENT = "ai_agent",
    UNKNOWN = "unknown"
}
export type FrequencyCategory = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
export type VariabilityCategory = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
export type ComplexityCategory = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
export interface UserSignals {
    headers?: Record<string, string>;
    userAgent?: string;
    authMethod?: 'api_key' | 'oauth' | 'password';
    requestStructure: 'simple' | 'medium' | 'complex';
    requestFrequency: FrequencyCategory;
    requestVariability: VariabilityCategory;
    complexity: ComplexityCategory;
}
export declare class UserTypeDetectionService {
    detectUserType(signals: UserSignals): UserType;
    calculateRequestFrequency(timestamps: number[]): FrequencyCategory;
    calculateRequestVariability(requests: any[]): VariabilityCategory;
    calculateComplexity(request: any): ComplexityCategory;
}
//# sourceMappingURL=UserTypeDetectionService.d.ts.map