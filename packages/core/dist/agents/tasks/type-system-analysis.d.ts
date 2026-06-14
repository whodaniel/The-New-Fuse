interface Solution {
    priority: 'low' | 'medium' | 'high';
    effort: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
    description: string;
    implementation?: string[];
}
interface Priority {
    immediate: Solution[];
    shortTerm: Solution[];
    longTerm: Solution[];
}
interface TypeSystemAnalysis {
    currentIssues: string[];
    proposedSolutions: Solution[];
    implementationPriority: Priority;
}
declare const typeSystemAnalysis: TypeSystemAnalysis;
export default typeSystemAnalysis;
export { TypeSystemAnalysis, Solution, Priority };
//# sourceMappingURL=type-system-analysis.d.ts.map