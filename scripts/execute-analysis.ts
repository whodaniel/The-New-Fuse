import { ProjectAnalyzer } from './utils/analyzer.js';
import { writeFileSync } from 'fs';

async function executeAnalysisPhase(): any {
  console.log('🚀 Executing Deep Analysis Phase');
  
  const analyzer = new ProjectAnalyzer();
  
  // Run comprehensive analysis
  const analysis = await analyzer.analyzeProject({
    scanDuplicates: true,
    checkDocSync: true,
    findDeadCode: true,
    validateDeps: true,
    generateMetrics: true
  });

  // Generate detailed report
  const report = {
    timestamp: new Date().toISOString(),
    metrics: {
      totalComponents: analysis.components.length,
      duplicateCount: analysis.duplicates.size,
      deadCodeLines: analysis.deadCode.length,
      outOfSyncDocs: analysis.docSync.outOfSync.length,
      unusedDeps: analysis.dependencies.unused.length
    },
    details: {
      duplicates: Array.from(analysis.duplicates.entries()),
      deadCode: analysis.deadCode,
      docSync: analysis.docSync,
      dependencies: analysis.dependencies
    }
  };

  // Save analysis results
  writeFileSync('analysis-report.json', JSON.stringify(report, null, 2));
  
  console.log('📊 Analysis Complete:', report.metrics);
  return analysis;
}