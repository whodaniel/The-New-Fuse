import { CodebaseAnalyzer } from './index';
import * as path from 'path';

async function runDemo() {
  console.log('Running codebase analysis demo...');
  
  // Analyze just the tools/codebase-analysis directory to test functionality
  const analyzer = new CodebaseAnalyzer(path.join(__dirname, '..'));
  
  try {
    const result = await analyzer.analyzeCodebase();
    
    console.log('\n=== DEMO RESULTS ===');
    console.log(`Total packages: ${result.summary.totalPackages}`);
    console.log(`Total files: ${result.summary.totalFiles}`);
    console.log(`Functional packages: ${result.summary.functionalPackages}`);
    console.log(`Stub packages: ${result.summary.stubPackages}`);
    console.log(`Overall completeness: ${result.summary.overallCompleteness}%`);
    
    console.log('\n=== FILE SYSTEM MAP ===');
    console.log(`Root files: ${result.fileSystemMap.rootFiles.length}`);
    console.log(`Packages found: ${result.fileSystemMap.packages.length}`);
    console.log(`Apps found: ${result.fileSystemMap.apps.length}`);
    
    console.log('\n=== DEPENDENCY ANALYSIS ===');
    console.log(`Dependency nodes: ${result.dependencyGraph.nodes.length}`);
    console.log(`Dependency edges: ${result.dependencyGraph.edges.length}`);
    console.log(`Circular dependencies: ${result.dependencyGraph.circularDependencies.length}`);
    console.log(`Version conflicts: ${result.dependencyGraph.conflicts.length}`);
    
    console.log('\n=== IMPLEMENTATION ANALYSIS ===');
    result.implementationReports.forEach((report: any) => {
      console.log(`${report.packageName}: ${report.completenessScore}% complete (${report.overallStatus})`);
      if (report.recommendations.length > 0) {
        console.log(`  Recommendations: ${report.recommendations.join(', ')}`);
      }
    });
    
    console.log('\nDemo completed successfully!');
  } catch (error) {
    console.error('Demo failed:', error);
  }
}

runDemo();