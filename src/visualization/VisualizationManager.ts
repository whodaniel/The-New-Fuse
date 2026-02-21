import { AnalysisResults, AnalysisType, Finding } from '@the-new-fuse/types';
import { Graph as GraphologyGraph } from 'graphology';

// Export interfaces for the types that were causing "private name" errors
export interface ProjectVisualizer {
  visualizeProject(projectPath: string): Promise<GraphologyGraph>;
  createVisualization(data: any): GraphologyGraph;
  exportToFormat(graph: GraphologyGraph, format: string): string;
}

// Re-export Graph type to avoid private name errors
export type Graph = GraphologyGraph;

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
    const graph = new GraphologyGraph();

    // Add nodes for each analysis result
    results.results.forEach((analysis) => {
      const nodeId = analysis.id;
      graph.addNode(nodeId, {
        type: analysis.type,
        metrics: analysis.metrics
      });

      // Add edges for dependency findings
      if (analysis.type === AnalysisType.DEPENDENCY) {
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