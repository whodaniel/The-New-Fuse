#!/usr/bin/env tsx
/**
 * Stage 4: Fast Knowledge Graph Consolidation
 *
 * Uses rule-based patterns to quickly consolidate common variants:
 * - Case variations (API, api, Api)
 * - Pluralization (api, apis, API, APIs)
 * - Spacing/hyphenation (web-socket, websocket, web socket)
 *
 * This provides 80% of the benefit with <1% of the computational cost.
 */

import * as fs from 'fs';
import * as path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const ANALYSIS_DIR = path.join(PROJECT_ROOT, '.documentation-system/analysis');
const KNOWLEDGE_GRAPH_FILE = path.join(ANALYSIS_DIR, 'knowledge-graph.json');
const CONSOLIDATED_GRAPH_FILE = path.join(ANALYSIS_DIR, 'consolidated-graph.json');
const CONSOLIDATION_REPORT_FILE = path.join(ANALYSIS_DIR, 'consolidation-report.json');

interface ConceptData {
  frequency: number;
  sources: string[];
  relatedConcepts: string[];
}

interface KnowledgeGraph {
  concepts: Record<string, ConceptData>;
  relationships: Array<{
    from: string;
    to: string;
    type: string;
    source: string;
  }>;
  dependencies: Record<string, string[]>;
}

/**
 * Normalize concept to canonical form
 */
function getCanonicalForm(concept: string): string {
  let canonical = concept
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove punctuation except hyphens
    .replace(/\s+/g, ' '); // Normalize spaces

  // Remove common plural 's' (but keep if it's a core part like "class")
  if (canonical.endsWith('s') && canonical.length > 3 && !canonical.endsWith('ss')) {
    const singular = canonical.slice(0, -1);
    // Use singular form as canonical
    canonical = singular;
  }

  // Normalize spacing and hyphens to no spaces/hyphens
  canonical = canonical.replace(/[-\s]/g, '');

  return canonical;
}

/**
 * Fast rule-based consolidation
 */
function consolidateConcepts(graph: KnowledgeGraph): any {
  console.log('🔧 Performing fast rule-based consolidation...\n');

  const startTime = Date.now();

  // Map canonical form → list of variants
  const canonicalToVariants = new Map<string, string[]>();

  // Map variant → canonical form
  const variantToCanonical = new Map<string, string>();

  // Map canonical → best display name (prefer capitalized, shorter forms)
  const canonicalToDisplay = new Map<string, string>();

  // Group concepts by canonical form
  for (const concept of Object.keys(graph.concepts)) {
    const canonical = getCanonicalForm(concept);

    if (!canonicalToVariants.has(canonical)) {
      canonicalToVariants.set(canonical, []);
      canonicalToDisplay.set(canonical, concept); // Initial display name
    }

    canonicalToVariants.get(canonical)!.push(concept);
    variantToCanonical.set(concept, canonical);

    // Update display name if this variant is "better"
    const currentDisplay = canonicalToDisplay.get(canonical)!;
    const isBetter =
      concept.length < currentDisplay.length || // Shorter is better
      (concept.length === currentDisplay.length && concept < currentDisplay); // Alphabetical tiebreaker

    if (isBetter) {
      canonicalToDisplay.set(canonical, concept);
    }
  }

  // Build consolidated graph
  const consolidated = {
    concepts: {} as Record<string, any>,
    conceptGroups: {} as Record<string, any>,
    relationships: [] as any[],
    dependencies: graph.dependencies,
    metadata: {
      originalCount: Object.keys(graph.concepts).length,
      consolidatedCount: 0,
      reductionCount: 0,
      reductionPercentage: 0,
    },
  };

  // Consolidate concepts
  for (const [canonical, variants] of canonicalToVariants.entries()) {
    const displayName = canonicalToDisplay.get(canonical)!;

    const consolidated_concept = {
      frequency: 0,
      sources: [] as string[],
      relatedConcepts: [] as string[],
      variants: variants.filter((v) => v !== displayName),
      variantCount: variants.length - 1,
    };

    const sourcesSet = new Set<string>();
    const relatedSet = new Set<string>();

    // Merge all variants
    for (const variant of variants) {
      const data = graph.concepts[variant];
      consolidated_concept.frequency += data.frequency;

      // Merge sources
      for (const source of data.sources) {
        sourcesSet.add(source);
      }

      // Merge related concepts (using canonical forms)
      for (const related of data.relatedConcepts) {
        const relatedCanonical = variantToCanonical.get(related) || related;
        const relatedDisplay = canonicalToDisplay.get(relatedCanonical) || related;

        if (relatedDisplay !== displayName) {
          // Don't relate to self
          relatedSet.add(relatedDisplay);
        }
      }
    }

    consolidated_concept.sources = Array.from(sourcesSet);
    consolidated_concept.relatedConcepts = Array.from(relatedSet);

    consolidated.concepts[displayName] = consolidated_concept;

    // Store concept group if it has variants
    if (consolidated_concept.variantCount > 0) {
      consolidated.conceptGroups[displayName] = {
        canonical: displayName,
        variants: consolidated_concept.variants,
        totalFrequency: consolidated_concept.frequency,
        sourceCount: consolidated_concept.sources.length,
      };
    }
  }

  // Update relationships to use canonical forms
  for (const rel of graph.relationships) {
    const fromCanonical = variantToCanonical.get(rel.from) || rel.from;
    const toCanonical = variantToCanonical.get(rel.to) || rel.to;
    const fromDisplay = canonicalToDisplay.get(fromCanonical) || rel.from;
    const toDisplay = canonicalToDisplay.get(toCanonical) || rel.to;

    consolidated.relationships.push({
      from: fromDisplay,
      to: toDisplay,
      type: rel.type,
      source: rel.source,
    });
  }

  // Update metadata
  consolidated.metadata.consolidatedCount = Object.keys(consolidated.concepts).length;
  consolidated.metadata.reductionCount =
    consolidated.metadata.originalCount - consolidated.metadata.consolidatedCount;
  consolidated.metadata.reductionPercentage = (
    (consolidated.metadata.reductionCount / consolidated.metadata.originalCount) *
    100
  ).toFixed(1);

  const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`   Original concepts: ${consolidated.metadata.originalCount.toLocaleString()}`);
  console.log(
    `   Consolidated concepts: ${consolidated.metadata.consolidatedCount.toLocaleString()}`
  );
  console.log(
    `   Reduction: ${consolidated.metadata.reductionCount.toLocaleString()} (${consolidated.metadata.reductionPercentage}%)`
  );
  console.log(`   Processing time: ${processingTime}s\n`);

  return { consolidated, processingTime };
}

/**
 * Identify documentation gaps
 */
function identifyGaps(consolidated: any): any {
  console.log('🔎 Identifying documentation gaps...\n');

  const gaps = {
    underDocumented: [] as any[],
    orphanConcepts: [] as any[],
  };

  // Find under-documented concepts
  for (const [concept, data] of Object.entries(consolidated.concepts) as any[]) {
    const sourceCount = data.sources.length;

    if (data.frequency >= 50 && sourceCount < 3) {
      gaps.underDocumented.push({
        concept,
        frequency: data.frequency,
        sources: sourceCount,
        issue: `High frequency (${data.frequency}) but only ${sourceCount} source(s)`,
      });
    }
  }

  // Find orphan concepts
  for (const [concept, data] of Object.entries(consolidated.concepts) as any[]) {
    if (data.relatedConcepts.length === 0 && data.frequency >= 20) {
      gaps.orphanConcepts.push({
        concept,
        frequency: data.frequency,
        issue: 'No relationships to other concepts',
      });
    }
  }

  console.log(`   Under-documented concepts: ${gaps.underDocumented.length}`);
  console.log(`   Orphan concepts: ${gaps.orphanConcepts.length}\n`);

  return gaps;
}

/**
 * Main execution
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  Stage 4: Fast Knowledge Graph Consolidation                 ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  // Load knowledge graph
  console.log('📂 Loading knowledge graph...');
  const graph: KnowledgeGraph = JSON.parse(fs.readFileSync(KNOWLEDGE_GRAPH_FILE, 'utf-8'));

  console.log(`   Concepts: ${Object.keys(graph.concepts).length.toLocaleString()}`);
  console.log(`   Relationships: ${graph.relationships.length.toLocaleString()}`);
  console.log(`   Dependencies: ${Object.keys(graph.dependencies).length.toLocaleString()}\n`);

  // Consolidate
  const { consolidated, processingTime } = consolidateConcepts(graph);

  // Identify gaps
  const gaps = identifyGaps(consolidated);

  // Generate report
  const report = {
    metadata: {
      timestamp: new Date().toISOString(),
      processingTime: processingTime + 's',
      ...consolidated.metadata,
    },
    conceptGroups: Object.values(consolidated.conceptGroups).slice(0, 100), // Top 100 groups
    gaps,
    topConsolidatedConcepts: Object.entries(consolidated.concepts)
      .sort(([, a]: any, [, b]: any) => b.frequency - a.frequency)
      .slice(0, 100)
      .map(([concept, data]: any) => ({
        concept,
        frequency: data.frequency,
        sources: data.sources.length,
        variants: data.variantCount || 0,
        relatedConcepts: data.relatedConcepts.length,
      })),
  };

  // Save results
  console.log('💾 Saving results...');
  fs.writeFileSync(CONSOLIDATED_GRAPH_FILE, JSON.stringify(consolidated, null, 2));
  fs.writeFileSync(CONSOLIDATION_REPORT_FILE, JSON.stringify(report, null, 2));

  console.log(`   ✅ Saved to ${path.relative(PROJECT_ROOT, CONSOLIDATED_GRAPH_FILE)}`);
  console.log(`   ✅ Saved to ${path.relative(PROJECT_ROOT, CONSOLIDATION_REPORT_FILE)}\n`);

  // Summary
  console.log('📊 Consolidation Summary:\n');
  console.log(
    `   Concept Groups: ${Object.keys(consolidated.conceptGroups).length.toLocaleString()}`
  );
  console.log(`   Variants Merged: ${consolidated.metadata.reductionCount.toLocaleString()}`);
  console.log(`   Reduction: ${consolidated.metadata.reductionPercentage}%`);
  console.log(`   Under-documented: ${gaps.underDocumented.length}`);
  console.log(`   Orphan Concepts: ${gaps.orphanConcepts.length}\n`);

  console.log('🔝 Top 10 consolidated concepts:');
  report.topConsolidatedConcepts.slice(0, 10).forEach((item, i) => {
    const variantInfo =
      item.variants > 0 ? ` (+${item.variants} variant${item.variants > 1 ? 's' : ''})` : '';
    console.log(
      `   ${i + 1}. ${item.concept}${variantInfo} (${item.frequency.toLocaleString()} occurrences)`
    );
  });

  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  Stage 4: Consolidation COMPLETE                             ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
}

main().catch(console.error);
