export declare enum ContentCategory {
    SAFE = "safe",
    MILD = "mild",
    MODERATE = "moderate",
    SEVERE = "severe"
}
export declare class HarmlessnessScreen {
    constructor();
    screen(content: any): {
        category: ContentCategory;
        issues: string[];
        recommendations: string[];
        metadata: {
            timestamp: string;
            contentLength: any;
            matchCounts: {
                severe: number;
                moderate: number;
                mild: number;
            };
        };
    };
    findMatches(content: any, patterns: any): any[];
}
