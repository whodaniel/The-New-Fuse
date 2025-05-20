import { executeAnalysisPhase } from './execute-analysis.js';
import { AdvancedComponentMerger } from './utils/advanced-merger.js';
import { EnhancedDocSyncer } from './utils/doc-sync.js';
import { EnhancedTreeShaker } from './utils/enhanced-treeshaker.js';

async function executeConsolidation(): any {
  try {
    // Phase 1: Analysis
    console.log('📊 Starting Analysis Phase...'); // eslint-disable-line no-console
    const analysis = await executeAnalysisPhase();

    // Phase 2: Merge
    console.log('🔄 Starting Advanced Merge Phase...'); // eslint-disable-line no-console
    const merger = new AdvancedComponentMerger();
    const _mergeResults = await merger.mergeComponents(analysis.components); // Prefix unused variable

    // Phase 3: Documentation
    console.log('📚 Starting Documentation Sync...'); // eslint-disable-line no-console
    const docSyncer = new EnhancedDocSyncer();
    await docSyncer.syncAll();

    // Phase 4: Tree Shaking
    console.log('🌳 Starting Tree Shaking...'); // eslint-disable-line no-console
    const shaker = new EnhancedTreeShaker();
    await shaker.shake();

    console.log('✅ Consolidation Complete!'); // eslint-disable-line no-console
  } catch (error) {
    console.error('❌ Consolidation failed:', error); // eslint-disable-line no-console
    throw error;
  }
}

// Execute consolidation
executeConsolidation().catch(error => {
  console.error('Error during consolidation execution:', error); // eslint-disable-line no-console
});
