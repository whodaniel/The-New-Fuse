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
    addComponent(componentName: string, functionalities: string[]): void;
    detectRedundancy(threshold?: number): RedundancyReport[];
    private findSimilarComponents;
    private calculateSimilarity;
    private getSharedFunctionality;
    private generateSuggestions;
}
//# sourceMappingURL=RedundancyDetector.d.ts.map