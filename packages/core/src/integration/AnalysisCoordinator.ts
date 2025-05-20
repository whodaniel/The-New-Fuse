import { ComponentAnalysis, FileAnalysis } from '../types.js';

export class AnalysisCoordinator implements AIModel {
  private componentAnalyses: ComponentAnalysis[];
  private fileAnalyses: FileAnalysis[];

  constructor(componentAnalyses: ComponentAnalysis[], fileAnalyses: FileAnalysis[]) {
    this.componentAnalyses = componentAnalyses;
    this.fileAnalyses = fileAnalyses;
  }

  getComponentAnalyses(): ComponentAnalysis[] {
    return this.componentAnalyses;
  }

  getFileAnalyses(): FileAnalysis[] {
    return this.fileAnalyses;
  }

  // Additional methods for coordinating analysis
}
