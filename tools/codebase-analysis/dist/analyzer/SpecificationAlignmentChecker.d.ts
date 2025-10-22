export interface SpecificationFeature {
    id: string;
    title: string;
    description: string;
    requirements: string[];
    specPath: string;
    category: 'requirement' | 'design' | 'task';
}
export interface ImplementationMapping {
    feature: SpecificationFeature;
    implementationFiles: string[];
    implementationStatus: 'implemented' | 'partial' | 'missing';
    implementationScore: number;
    gaps: string[];
}
export interface SpecificationAlignment {
    specifiedButNotImplemented: ImplementationMapping[];
    implementedButNotSpecified: {
        file: string;
        functionality: string;
        suggestedSpecCategory: string;
    }[];
    alignedFeatures: ImplementationMapping[];
    overallAlignmentScore: number;
    recommendations: string[];
}
export declare class SpecificationAlignmentChecker {
    private rootPath;
    private specsPath;
    private scanner;
    constructor(rootPath?: string);
    checkSpecificationAlignment(): Promise<SpecificationAlignment>;
    private parseAllSpecifications;
    private parseRequirementsFile;
    private parseDesignFile;
    private parseTasksFile;
    private extractRequirementsFromTaskDetails;
    private mapSpecificationsToImplementations;
    private findImplementationFiles;
    private extractKeywordsFromSpec;
    private assessImplementationStatus;
    private calculateImplementationScore;
    private identifyImplementationGaps;
    private findUnspecifiedImplementations;
    private extractFunctionalityFromFile;
    private isSpecified;
    private suggestSpecCategory;
    private calculateAlignment;
    private generateAlignmentRecommendations;
    private fileExists;
}
//# sourceMappingURL=SpecificationAlignmentChecker.d.ts.map