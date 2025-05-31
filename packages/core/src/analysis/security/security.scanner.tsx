import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { SecurityVulnerability, SecuritySeverity, SecurityScanResult } from '@the-new-fuse/types';
import { Prisma } from '@the-new-fuse/database/client';

type RawVulnerabilityPattern = {
  pattern: string;
  severity: SecuritySeverity;
  description: string;
};

type RawVulnerabilityCount = {
  severity: SecuritySeverity;
  count: number;
};

type VulnerabilityCount = Record<SecuritySeverity, number>;

interface VulnerabilityFilters {
  severity?: SecuritySeverity[];
  dependency?: string;
  cve?: string;
}

@Injectable()
export class SecurityScanner {
  constructor(private readonly prisma: PrismaService) {}

  async scanProject(projectId: string): Promise<SecurityScanResult> {
    const vulnerabilities = await this.findVulnerabilities(projectId);
    const severityCounts = await this.getVulnerabilityCounts();

    return {
      vulnerabilities,
      totalVulnerabilities: vulnerabilities.length,
      severityCounts: {
        low: severityCounts[SecuritySeverity.LOW] || 0,
        medium: severityCounts[SecuritySeverity.MEDIUM] || 0,
        high: severityCounts[SecuritySeverity.HIGH] || 0,
        critical: severityCounts[SecuritySeverity.CRITICAL] || 0
      },
      scanTimestamp: new Date(),
      metadata: {
        scannedDependencies: 0,
        scanType: 'file',
        timestamp: new Date()
      }
    };
  }

  private async findVulnerabilities(projectId: string): Promise<SecurityVulnerability[]> {
    const dependencies = await this.getDependencies(projectId);
    const vulns: SecurityVulnerability[] = [];

    for (const dep of dependencies) {
      const depVulns = await this.checkDependencyVulnerabilities(dep);
      vulns.push(...depVulns);
    }

    return vulns;
  }

  private async getDependencies(projectId: string): Promise<Array<{ id: string; path: string }>> {
    const files = await this.prisma.$queryRaw<Array<{ id: string; path: string }>>`
      SELECT id, path FROM files WHERE project_id = ${projectId}
    `;

    return files;
  }

  private async checkDependencyVulnerabilities(dependency: { id: string; path: string }): Promise<SecurityVulnerability[]> {
    // Get file contents and metadata
    const file = await this.prisma.$queryRaw<{ id: string; path: string; content: string }[]>`
      SELECT id, path, content
      FROM files
      WHERE id = ${dependency.id}
    `;

    if (!file || file.length === 0) {
      return [];
    }

    // Run security checks
    const vulnerabilities = await this.runSecurityChecks(file[0].content);
    return vulnerabilities;
  }

  private async runSecurityChecks(content: string): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];
    const patterns = await this.prisma.$queryRaw<RawVulnerabilityPattern[]>`
      SELECT pattern, severity, description FROM vulnerability_patterns
    `;

    // Check for each pattern
    for (const pattern of patterns) {
      if (content.includes(pattern.pattern)) {
        vulnerabilities.push({
          id: crypto.randomUUID(),
          title: pattern.pattern,
          severity: pattern.severity,
          description: pattern.description,
          location: 'file',
          references: [],
          metadata: {},
          timestamp: new Date()
        });
      }
    }

    return vulnerabilities;
  }

  private async getVulnerabilityCounts(): Promise<VulnerabilityCount> {
    const counts: VulnerabilityCount = {
      [SecuritySeverity.LOW]: 0,
      [SecuritySeverity.MEDIUM]: 0,
      [SecuritySeverity.HIGH]: 0,
      [SecuritySeverity.CRITICAL]: 0
    };

    // Get vulnerability counts from database
    const results = await this.prisma.$queryRaw<RawVulnerabilityCount[]>`
      SELECT severity, COUNT(*) as count FROM vulnerabilities GROUP BY severity
    `;

    // Map results to counts
    results.forEach(result => {
      counts[result.severity] = result.count;
    });

    return counts;
  }

  async getVulnerabilityById(id: string): Promise<SecurityVulnerability | null> {
    const vuln = await this.prisma.$queryRaw<Array<SecurityVulnerability>>`
      SELECT *
      FROM vulnerabilities
      WHERE id = ${id}
      LIMIT 1
    `;

    return vuln[0] || null;
  }

  async getVulnerabilities(filters?: VulnerabilityFilters): Promise<SecurityVulnerability[]> {
    let where = '';
    const params: unknown[] = [];

    if (filters?.severity?.length) {
      where += ' AND severity IN (?)';
      params.push(filters.severity);
    }

    if (filters?.dependency) {
      where += ' AND affected_dependency = ?';
      params.push(filters.dependency);
    }

    if (filters?.cve) {
      where += ' AND cve = ?';
      params.push(filters.cve);
    }

    const vulns = await this.prisma.$queryRaw<SecurityVulnerability[]>`
      SELECT *
      FROM vulnerabilities
      WHERE 1=1 ${Prisma.raw(where)}
    `;

    return vulns.map(vuln => ({
      id: vuln.id,
      title: vuln.title,
      severity: vuln.severity,
      description: vuln.description,
      cvss: vuln.cvss,
      cve: vuln.cve,
      location: vuln.location,
      affectedDependency: vuln.affectedDependency,
      remediation: vuln.remediation,
      references: vuln.references,
      metadata: vuln.metadata,
      timestamp: vuln.timestamp
    }));
  }
}
