import { describe, it, expect, beforeEach } from 'vitest';
import { ArchitectureAnalyzer } from '../analyzer/ArchitectureAnalyzer';
import { PackageInfo, FileType, PackageType } from '../scanner/FileSystemScanner';

describe('ArchitectureAnalyzer', () => {
  let analyzer: ArchitectureAnalyzer;
  let mockPackages: PackageInfo[];
  let mockApps: PackageInfo[];

  beforeEach(() => {
    mockPackages = [
      {
        name: '@test/ui-components',
        path: '/test/packages/ui-components',
        type: PackageType.Package,
        files: [
          {
            name: 'Button.tsx',
            path: '/test/packages/ui-components/Button.tsx',
            type: FileType.TypeScript,
            size: 1000,
            lastModified: new Date()
          }
        ],
        dependencies: ['react'],
        version: '1.0.0',
        hasPackageJson: true
      },
      {
        name: '@test/ui-consolidated',
        path: '/test/packages/ui-consolidated',
        type: PackageType.Package,
        files: [
          {
            name: 'Button.tsx',
            path: '/test/packages/ui-consolidated/Button.tsx',
            type: FileType.TypeScript,
            size: 1200,
            lastModified: new Date()
          }
        ],
        dependencies: ['react'],
        version: '1.0.0',
        hasPackageJson: true
      }
    ];

    mockApps = [
      {
        name: 'api',
        path: '/test/apps/api',
        type: PackageType.App,
        files: [
          {
            name: 'server.ts',
            path: '/test/apps/api/server.ts',
            type: FileType.TypeScript,
            size: 2000,
            lastModified: new Date()
          }
        ],
        dependencies: ['express'],
        version: '1.0.0',
        hasPackageJson: true
      }
    ];

    analyzer = new ArchitectureAnalyzer(mockPackages, mockApps);
  });

  it('should create analyzer instance', () => {
    expect(analyzer).toBeDefined();
  });

  it('should analyze package redundancy', async () => {
    const result = await analyzer.analyzePackageRedundancy();
    
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(mockPackages.length);
    
    // Check that each package has required properties
    for (const analysis of result) {
      expect(analysis.packageName).toBeDefined();
      expect(analysis.packagePath).toBeDefined();
      expect(analysis.functionality).toBeDefined();
      expect(typeof analysis.redundancyScore).toBe('number');
      expect(Array.isArray(analysis.consolidationCandidates)).toBe(true);
      expect(Array.isArray(analysis.similarPackages)).toBe(true);
      expect(analysis.recommendedAction).toBeDefined();
    }
  });

  it('should analyze application layer', async () => {
    const result = await analyzer.analyzeApplicationLayer();
    
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(mockApps.length);
    
    // Check that each application has required properties
    for (const analysis of result) {
      expect(analysis.applicationName).toBeDefined();
      expect(analysis.applicationPath).toBeDefined();
      expect(Array.isArray(analysis.routes)).toBe(true);
      expect(Array.isArray(analysis.middleware)).toBe(true);
      expect(Array.isArray(analysis.services)).toBe(true);
      expect(Array.isArray(analysis.authMethods)).toBe(true);
      expect(Array.isArray(analysis.databaseAccess)).toBe(true);
      expect(Array.isArray(analysis.redundancyWithOtherApps)).toBe(true);
      expect(analysis.consolidationRecommendation).toBeDefined();
    }
  });

  it('should analyze UI packages', async () => {
    const result = await analyzer.analyzeUIPackages();
    
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    
    // Should only analyze UI-related packages
    const uiPackageCount = mockPackages.filter(p => 
      p.name.includes('ui') || p.name.includes('component')
    ).length;
    expect(result.length).toBe(uiPackageCount);
    
    // Check that each UI package analysis has required properties
    for (const analysis of result) {
      expect(analysis.packageName).toBeDefined();
      expect(analysis.packagePath).toBeDefined();
      expect(Array.isArray(analysis.components)).toBe(true);
      expect(Array.isArray(analysis.styles)).toBe(true);
      expect(Array.isArray(analysis.utilities)).toBe(true);
      expect(Array.isArray(analysis.dependencies)).toBe(true);
      expect(Array.isArray(analysis.redundancyWithOtherUI)).toBe(true);
      expect(analysis.consolidationRecommendation).toBeDefined();
    }
  });

  it('should analyze database layer', async () => {
    const result = await analyzer.analyzeDatabaseLayer();
    
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    
    // Check that each database analysis has required properties
    for (const analysis of result) {
      expect(analysis.packageName).toBeDefined();
      expect(analysis.packagePath).toBeDefined();
      expect(Array.isArray(analysis.schemas)).toBe(true);
      expect(Array.isArray(analysis.models)).toBe(true);
      expect(Array.isArray(analysis.accessPatterns)).toBe(true);
      expect(Array.isArray(analysis.migrations)).toBe(true);
      expect(Array.isArray(analysis.redundancyWithOtherDB)).toBe(true);
      expect(analysis.consolidationRecommendation).toBeDefined();
    }
  });

  it('should perform complete architecture analysis', async () => {
    const result = await analyzer.analyzeArchitecture();
    
    expect(result).toBeDefined();
    expect(result.packageRedundancy).toBeDefined();
    expect(result.applicationLayer).toBeDefined();
    expect(result.uiPackages).toBeDefined();
    expect(result.databaseLayer).toBeDefined();
    expect(result.overallRecommendations).toBeDefined();
    expect(result.consolidationPlan).toBeDefined();
    
    // Check overall recommendations structure
    expect(Array.isArray(result.overallRecommendations)).toBe(true);
    for (const rec of result.overallRecommendations) {
      expect(rec.category).toBeDefined();
      expect(rec.priority).toBeDefined();
      expect(rec.title).toBeDefined();
      expect(rec.description).toBeDefined();
      expect(Array.isArray(rec.benefits)).toBe(true);
      expect(rec.estimatedEffort).toBeDefined();
      expect(Array.isArray(rec.dependencies)).toBe(true);
    }
    
    // Check consolidation plan structure
    expect(Array.isArray(result.consolidationPlan.phases)).toBe(true);
    expect(result.consolidationPlan.totalEstimatedEffort).toBeDefined();
    expect(Array.isArray(result.consolidationPlan.expectedBenefits)).toBe(true);
    expect(Array.isArray(result.consolidationPlan.risks)).toBe(true);
  });
});