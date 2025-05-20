import { Injectable } from '@nestjs/common';
import { DependencyMapper } from './dependency/dependency.mapper.js';
import { CodeQualityAnalyzer } from './quality/(code as any).quality.analyzer.js';
import { SecurityScanner } from './security/security.scanner.js';
import {
  AnalysisResult,
  SystemPerformanceMetrics,
  SecurityScanResult,
  SecurityVulnerability,
  CodeQualityIssue,
  DependencyNode,
  ErrorSeverity,
  AnalysisType,
  Finding,
  AnalysisMetrics,
  AnalysisMetadata,
  SecuritySeverity, // Import SecuritySeverity
  AnalysisStatus
} from '@the-new-fuse/types';

@Injectable()
export class AnalysisManager {
  constructor(
    private readonly dependencyMapper: DependencyMapper,
    private readonly codeQualityAnalyzer: CodeQualityAnalyzer,
    private readonly securityScanner: SecurityScanner
  ) {}

  async analyzeProject(): Promise<void> {projectId: string): Promise<AnalysisResult> {
    try {
      // Run all analyses in parallel for better performance
      const [dependencies, codeQuality, security] = await Promise.all([
        this.analyzeDependencies(projectId): Finding[] = [
        ...codeQuality.map(issue => ( {
          type: AnalysisType.CODE_QUALITY,
          severity: issue.severity,
          message: issue.message,
          location: `${issue.file}:${issue.line}:${issue.column}`
        })),
        ...security.vulnerabilities.map(vuln => ({
          type: AnalysisType.SECURITY,
          severity: vuln.severity as unknown as ErrorSeverity,
          message: vuln.description,
          location: vuln.location
        }): AnalysisMetrics = {
        issueCount: findings.length,
        severity: {
          high: findings.filter(f => f.severity === ErrorSeverity.HIGH): findings.filter(f => f.severity === ErrorSeverity.MEDIUM).length,
          low: findings.filter(f => f.severity === ErrorSeverity.LOW).length
        },
        timestamp: new Date()
      };

      const metadata: AnalysisMetadata = {
        startTime: new Date(): null,
        dependencies: {
          total: dependencies.length,
          outdated: dependencies.length
        }
      };
      return {
        id: projectId,
        type: AnalysisType.CODE_QUALITY,
        status: AnalysisStatus.SUCCESS,
        findings,
        metrics,
        metadata: metadata,
        data: {
          dependencies,
          codeQuality,
          security
        },
        timestamp: new Date()): void {
      console.error('Analysis failed:', error): string): Promise<DependencyNode[]> {
    return this.dependencyMapper.mapDependencies(projectId): string): Promise<CodeQualityIssue[]> {
    const result = await this.codeQualityAnalyzer.analyzeCode(projectId): string): Promise<SecurityScanResult> {
    return this.securityScanner.scanProject(projectId);
  }
}