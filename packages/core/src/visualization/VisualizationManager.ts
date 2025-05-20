import { ProjectVisualizer } from './fileVisualizer.js';
import { AnalysisResults, AnalysisType, Finding, AnalysisResult } from '@the-new-fuse/types';
import { Graph } from 'graphology';

export enum Severity {
  DEPENDENCY_ISSUE = 'DEPENDENCY_ISSUE'
}

export class VisualizationManager {
  constructor(private readonly visualizer: ProjectVisualizer) {}

  async generateVisualizations(results: AnalysisResults): Promise<{
    graph: Graph;
    summary: typeof results.summary;
    metrics: string;
  }> {
    const graph = new Graph();

    // Add nodes for each analysis result
    results.results.forEach((analysis) => {
      const nodeId = analysis.id;
      graph.addNode(nodeId, {
        type: analysis.type,
        metrics: analysis.metrics
      });

      // Add edges for dependency findings
      if (analysis.type === AnalysisType.DEPENDENCY && analysis.findings) {
        analysis.findings
          .filter((finding: Finding) => finding.location)
          .forEach((finding: Finding) => {
            if (finding.location) {
              graph.addNode(finding.location);
              graph.addEdge(nodeId, finding.location, {
                type: 'dependency',
                severity: finding.severity
              });
            }
          });
      }
    });

    return {
      graph,
      summary: results.summary,
      metrics: this.visualizeMetrics(results)
    };
  }

  private visualizeMetrics(results: AnalysisResults): string {
    // Create a visualization of the metrics
    const metrics = results.results.map((result) => ({
      id: result.id,
      metrics: result.metrics
    }));
    return JSON.stringify(metrics, null, 2);
  }
}