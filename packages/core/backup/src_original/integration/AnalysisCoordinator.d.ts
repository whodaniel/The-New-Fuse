import { ComponentAnalysis, FileAnalysis } from '../types/;';
export declare class AnalysisCoordinator {
    private componentAnalyses;
    private fileAnalyses;
    constructor(componentAnalyses: ComponentAnalysis[], fileAnalyses: FileAnalysis[]);
    getComponentAnalyses(): ComponentAnalysis[];
    getFileAnalyses(): FileAnalysis[];
}
