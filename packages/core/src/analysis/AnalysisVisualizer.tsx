import { Injectable } from '@nestjs/common';
import { Logger } from '@the-new-fuse/utils';
import { AnalysisResult, AnalysisType, SystemPerformanceMetrics } from '@the-new-fuse/types';

interface VisualizationOptions {
  format?: 'json' | 'html' | 'svg';
  includeMetadata?: boolean;
  colorScheme?: string;
  width?: number;
  height?: number;
}

interface VisualizationData {
  type?: string;
  title?: string;
  description?: string;
  metrics?: Record<string, unknown>;
  findings?: Array<{
    severity: string;
    message: string;
    location?: string;
  }>;
  visualElements?: Array<{
    type: string;
    data: unknown;
  }>;
  nodes: Array<{
    id: string;
    label: string;
    type: string;
    metrics?: Record<string, unknown>;
  }>;
  edges: Array<{
    source: string;
    target: string;
    type: string;
    weight?: number;
  }>;
  metadata?: Record<string, unknown>;
}

interface DependencyMapper {
  getComponents(): Promise<Component[]>;
  getDependencies(): Promise<Dependency[]>;
}

interface Component {
  id: string;
  name: string;
  type: string;
  metadata: Record<string, unknown>;
  metrics?: Record<string, unknown>;
}

interface Dependency {
  source: string;
  target: string;
  type: string;
  metadata: Record<string, unknown>;
  weight?: number;
}

@Injectable()
export class AnalysisVisualizer {
  private readonly logger = new Logger(AnalysisVisualizer.name);

  constructor(private readonly dependencyMapper: DependencyMapper) {}

  async visualize(
    analysisResult: AnalysisResult,
    options: VisualizationOptions = {}
  ): Promise<string> {
    try {
      this.logger.debug('Starting visualization', { analysisType: analysisResult.type, format: options.format });

      const visualizationData = await this.createVisualizationDataForAnalysis(analysisResult);

      switch (options.format) {
        case 'json':
          return this.generateJsonVisualization(visualizationData, options);
        case 'html':
          return this.generateHtmlVisualization(visualizationData, options);
        case 'svg':
          return this.generateSvgVisualization(visualizationData, options);
        default:
          // Default to json if format is not specified or unsupported
          if (!options.format) {
             this.logger.warn('No visualization format specified, defaulting to json');
             return this.generateJsonVisualization(visualizationData, options);
          }
          throw new Error(`Unsupported visualization format: ${options.format}`);
      }
    } catch (error: unknown) {
      this.logger.error('Visualization failed:', { error: error as Error });
      throw error; // Re-throw the error after logging
    }
  }

  private async createVisualizationDataForAnalysis(analysisResult: AnalysisResult): Promise<VisualizationData> {
    switch (analysisResult.type) {
      case AnalysisType.DEPENDENCY:
        return this.createDependencyVisualization(analysisResult);
      case AnalysisType.SECURITY:
        return this.createSecurityVisualization(analysisResult);
      case AnalysisType.PERFORMANCE:
        return this.createPerformanceVisualization(analysisResult);
      case AnalysisType.CODE_QUALITY:
        return this.createCodeQualityVisualization(analysisResult);
      default:
        throw new Error(`Unsupported analysis type: ${analysisResult.type}`);
    }
  }

  private createVisualizationData(
    type: string,
    title: string,
    description: string,
    metrics: Record<string, unknown> | undefined,
    findings: Array<{
      severity: string;
      message: string;
      location?: string;
    }>,
    visualElements: Array<{
      type: string;
      data: unknown;
    }>,
    nodes: Array<{
      id: string;
      label: string;
      type: string;
      metrics?: Record<string, unknown>;
    }> = [],
    edges: Array<{
      source: string;
      target: string;
      type: string;
      weight?: number;
    }> = [],
    metadata: Record<string, unknown> = {}
  ): VisualizationData {
    return {
      type,
      title,
      description,
      metrics,
      findings,
      visualElements,
      nodes,
      edges,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        analysisType: type
      }
    };
  }

  private async createDependencyVisualization(analysisResult: AnalysisResult): Promise<VisualizationData> {
    // Assuming analysisResult.data contains the raw data needed for dependency visualization
    // This part needs to be implemented based on the actual structure of analysisResult.data
    // For now, returning a placeholder structure
    const components: Component[] = []; // Fetch or derive components from analysisResult.data
    const dependencies: Dependency[] = []; // Fetch or derive dependencies from analysisResult.data

    const nodes = components.map(component => ({
      id: component.id,
      label: component.name,
      type: component.type,
      metrics: component.metrics
    }));

    const edges = dependencies.map(dependency => ({
      source: dependency.source,
      target: dependency.target,
      type: dependency.type,
      weight: dependency.weight
    }));

    return this.createVisualizationData(
      'dependency',
      'Dependency Analysis',
      'This visualization shows the dependencies between components.',
      analysisResult.metrics,
      analysisResult.findings || [],
      [],
      nodes,
      edges
    );
  }

  private async createSecurityVisualization(analysisResult: AnalysisResult): Promise<VisualizationData> {
     // Assuming analysisResult.data contains the raw data needed for security visualization
    // This part needs to be implemented based on the actual structure of analysisResult.data
    // For now, returning a placeholder structure
    const securityScan = analysisResult.data; // Or extract from analysisResult.data

    const sections = [
      this.visualizeSecurityIssues(securityScan),
    ];

    const visualElements = [
      {
        type: 'text',
        data: sections.join('\n\n')
      }
    ];

    return this.createVisualizationData(
      'security',
      'Security Analysis',
      'This visualization shows security findings and vulnerabilities.',
      analysisResult.metrics,
      analysisResult.findings || [],
      visualElements
    );
  }

  private async createPerformanceVisualization(analysisResult: AnalysisResult): Promise<VisualizationData> {
    // Assuming analysisResult.data contains the raw data needed for performance visualization
    // This part needs to be implemented based on the actual structure of analysisResult.data
    // For now, returning a placeholder structure
    const performanceMetrics = analysisResult.data as SystemPerformanceMetrics; // Or extract from analysisResult.data

    const sections = [
      this.visualizePerformanceMetrics(performanceMetrics),
    ];

     const visualElements = [
      {
        type: 'text',
        data: sections.join('\n\n')
      }
    ];


    return this.createVisualizationData(
      'performance',
      'Performance Analysis',
      'This visualization shows performance metrics and bottlenecks.',
      analysisResult.metrics || {},
      analysisResult.findings || [],
      visualElements
    );
  }

  private async createCodeQualityVisualization(analysisResult: AnalysisResult): Promise<VisualizationData> {
    // Assuming analysisResult.data contains the raw data needed for code quality visualization
    // This part needs to be implemented based on the actual structure of analysisResult.data
    // For now, returning a placeholder structure
    const issues = analysisResult.data as unknown[]; // Or extract from analysisResult.data

    const sections = [
      this.visualizeCodeQuality(issues),
    ];

     const visualElements = [
      {
        type: 'text',
        data: sections.join('\n\n')
      }
    ];

    return this.createVisualizationData(
      'code-quality',
      'Code Quality Analysis',
      'This visualization shows code quality metrics and issues.',
      analysisResult.metrics,
      analysisResult.findings || [],
      visualElements
    );
  }


  private visualizePerformanceMetrics(metrics: SystemPerformanceMetrics): string {
    return `
Performance Metrics:
------------------
CPU Usage: ${metrics.cpuUsage !== undefined ? metrics.cpuUsage + '%' : 'N/A'}
Memory Usage: ${metrics.memoryUsage !== undefined ? metrics.memoryUsage + 'MB' : 'N/A'}
Throughput: ${metrics.throughput !== undefined ? metrics.throughput + ' req/s' : 'N/A'}
Error Rate: ${metrics.errorRate !== undefined ? metrics.errorRate + '%' : 'N/A'}
Request Count: ${metrics.requestCount !== undefined ? metrics.requestCount : 'N/A'}
`;
  }

  private visualizeSecurityIssues(securityScan: any): string { // Use 'any' for now due to unknown structure
    if (!securityScan?.vulnerabilities?.length) {
      return 'No security issues found.';
    }

    return `
Security Issues:
--------------
${securityScan.vulnerabilities.map((vuln: any) => ` // Use 'any' for now
- ${vuln.severity}: ${vuln.title}
  Description: ${vuln.description}
  Location: ${vuln.location || 'N/A'}
  Fix: ${vuln.remediation || 'N/A'}
`).join('\n')}
`;
  }

  private visualizeCodeQuality(issues: any[]): string { // Use 'any' for now
    if (!issues?.length) {
      return 'No code quality issues found.';
    }

    return `
Code Quality Issues:
-----------------
${issues.map((issue: any) => ` // Use 'any' for now
- ${issue.severity}: ${issue.type}
  Description: ${issue.description}
  Location: ${issue.location}
  Rule: ${issue.rule}
  ${issue.fix ? `Fix: ${issue.fix}` : ''}
`).join('\n')}
`;
  }

   private visualizeDependencies(dependencies: any[]): string { // Use 'any' for now
    if (!dependencies?.length) {
      return 'No dependencies found.';
    }

    return `
Dependencies:
-----------
${dependencies.map((dep: any) => ` // Use 'any' for now
- ${dep.name}@${dep.version}
  Dependencies: ${dep.dependencies.join(', ') || 'None'}
`).join('\n')}
`;
  }


  private generateJsonVisualization(data: VisualizationData, _options: VisualizationOptions): string {
    return JSON.stringify(data, null, 2);
  }

  private generateHtmlVisualization(data: VisualizationData, _options: VisualizationOptions): string {
    // Basic HTML structure - needs proper implementation
    return `<html><body><h1>${data.title}</h1><pre>${JSON.stringify(data, null, 2)}</pre></body></html>`;
  }

  private generateSvgVisualization(_data: VisualizationData, _options: VisualizationOptions): string {
    // SVG implementation is complex and requires a library or detailed logic
    throw new Error('SVG visualization not implemented yet');
  }
}
