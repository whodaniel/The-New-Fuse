export interface RedundancyReport {
    component: string;
    similarComponents: Array<{
        name: string;
        similarity: number;
        sharedFunctionality: string[];
    }>;
    consolidationSuggestions: string[];
}
export declare class RedundancyDetector {
    private signatures;
}
