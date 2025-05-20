import { ComponentAnalysis, FileAnalysis } from '../types.js';
export declare class AnalysisCoordinator {
    private componentAnalyses;
    private fileAnalyses;
    constructor(componentAnalyses: ComponentAnalysis[], fileAnalyses: FileAnalysis[]);
    getComponentAnalyses(): ComponentAnalysis[];
    getFileAnalyses(): FileAnalysis[];
}
