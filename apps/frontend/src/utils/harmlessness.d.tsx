export declare enum ContentCategory {
    SAFE = "safe",
    MILD = "mild",
    MODERATE = "moderate",
    SEVERE = "severe"
}
export interface ScreeningResult {
    category: ContentCategory;
    issues: string[];
    recommendations: string[];
    metadata?: Record<string, any>;
}
export declare class HarmlessnessScreen {
    private readonly harmful_patterns;
    constructor();
    screen(content: string): ScreeningResult;
    private findMatches;
}
