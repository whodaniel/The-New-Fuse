import { Injectable } from '@nestjs/common';

export interface DependencyInfo {
  name: string;
  version: string;
  type?: 'direct' | 'dev' | 'peer';
  description?: string;
  vulnerabilities?: VulnerabilityInfo[];
}

export interface VulnerabilityInfo {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation?: string;
}

@Injectable()
export class DependencyMapper {
  mapToDependencyInfo(dependency: any): DependencyInfo {
    return {
      name: dependency.name || 'unknown',
      version: dependency.version || '0.0.0',
      type: dependency.type || 'direct',
      description: dependency.description,
      vulnerabilities: dependency.vulnerabilities?.map(this.mapToVulnerabilityInfo) || [],
    };
  }

  private mapToVulnerabilityInfo(vulnerability: any): VulnerabilityInfo {
    return {
      id: vulnerability.id || `vuln_${Date.now()}`,
      severity: vulnerability.severity || 'medium',
      title: vulnerability.title || 'Unknown vulnerability',
      description: vulnerability.description || 'No description available',
      recommendation: vulnerability.recommendation,
    };
  }

  mapDependencyArray(dependencies: any[]): DependencyInfo[] {
    return dependencies.map(dep => this.mapToDependencyInfo(dep));
  }
}
