#!/usr/bin/env tsx
/**
 * Stage 4: Knowledge Graph Consolidation
 *
 * Refines the raw concept extraction by:
 * 1. Detecting duplicate/similar concepts (e.g., "API", "api", "APIs")
 * 2. Resolving terminology conflicts
 * 3. Identifying documentation gaps
 * 4. Generating merge recommendations
 * 5. Creating consolidated knowledge graph
 *
 * Input: knowledge-graph.json (93,089 concepts)
 * Output: consolidated-graph.json (refined concepts with merge groups)
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

interface ConceptGroup {
  canonical: string;
  variants: string[];
  totalFrequency: number;
  sources: Set<string>;
  reason: string;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity ratio (0-1) between two strings
 */
function similarityRatio(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  const distance = levenshteinDistance(a, b);
  return 1 - distance / maxLen;
}

/**
 * Normalize concept for comparison
 */
function normalizeConcept(concept: string): string {
  return concept
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Check if two concepts are similar enough to merge
 */
function areSimilar(a: string, b: string): { similar: boolean; reason: string } {
  const normA = normalizeConcept(a);
  const normB = normalizeConcept(b);

  // Exact match after normalization
  if (normA === normB) {
    return { similar: true, reason: 'exact-match-normalized' };
  }

  // Pluralization (e.g., "API" vs "APIs")
  if (normA === normB + 's' || normA + 's' === normB) {
    return { similar: true, reason: 'pluralization' };
  }

  // Common suffixes (e.g., "testing" vs "test")
  const suffixes = ['ing', 'ed', 'er', 'ly', 'tion', 'sion'];
  for (const suffix of suffixes) {
    if (normA === normB + suffix || normA + suffix === normB) {
      return { similar: true, reason: `suffix-${suffix}` };
    }
  }

  // Hyphenation/spacing variations (e.g., "web-socket" vs "websocket")
  const compactA = normA.replace(/[-\s]/g, '');
  const compactB = normB.replace(/[-\s]/g, '');
  if (compactA === compactB) {
    return { similar: true, reason: 'spacing-hyphenation' };
  }

  // Abbreviation match (if one is 2-4 chars and starts the other)
  if (normA.length <= 4 && normB.startsWith(normA)) {
    return { similar: true, reason: 'abbreviation' };
  }
  if (normB.length <= 4 && normA.startsWith(normB)) {
    return { similar: true, reason: 'abbreviation' };
  }

  // High similarity via Levenshtein (threshold: 85%)
  const similarity = similarityRatio(normA, normB);
  if (similarity >= 0.85 && Math.abs(normA.length - normB.length) <= 3) {
    return { similar: true, reason: `levenshtein-${(similarity * 100).toFixed(0)}%` };
  }

  return { similar: false, reason: 'not-similar' };
}

/**
 * Group similar concepts together (optimized with bucketing)
 */
function groupSimilarConcepts(concepts: Record<string, ConceptData>): Map<string, ConceptGroup> {
  const conceptKeys = Object.keys(concepts);
  const groups = new Map<string, ConceptGroup>();
  const processed = new Set<string>();

  console.log('🔍 Analyzing concept similarities (optimized)...\n');

  // Optimization: Bucket concepts by normalized first 3 characters
  // This reduces O(n²) to O(n²/buckets)
  const buckets = new Map<string, string[]>();

  for (const concept of conceptKeys) {
    const normalized = normalizeConcept(concept);
    const bucketKey = normalized.substring(0, 3);

    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, []);
    }
    buckets.get(bucketKey)!.push(concept);
  }

  console.log(`   Created ${buckets.size} buckets for efficient comparison\n`);

  let groupCount = 0;
  let variantCount = 0;
  let comparisons = 0;

  // Process each bucket independently
  for (const [bucketKey, bucketConcepts] of buckets.entries()) {
    for (let i = 0; i < bucketConcepts.length; i++) {
      const concept = bucketConcepts[i];

      if (processed.has(concept)) continue;

      const group: ConceptGroup = {
        canonical: concept,
        variants: [],
        totalFrequency: concepts[concept].frequency,
        sources: new Set(concepts[concept].sources),
        reason: 'primary',
      };

      // Only compare within same bucket and adjacent buckets
      const adjacentBuckets = [bucketKey];

      // Add adjacent buckets (e.g., "api" bucket also checks "ap", "a", "api2")
      if (bucketKey.length >= 1) {
        adjacentBuckets.push(bucketKey.substring(0, 2));
        adjacentBuckets.push(bucketKey.substring(0, 1));
      }

      for (const adjBucket of adjacentBuckets) {
        const adjConcepts = buckets.get(adjBucket) || [];

        for (const other of adjConcepts) {
          if (other === concept || processed.has(other)) continue;

          comparisons++;
          const { similar, reason } = areSimilar(concept, other);

          if (similar) {
            group.variants.push(other);
            group.totalFrequency += concepts[other].frequency;
            concepts[other].sources.forEach((s) => group.sources.add(s));
            processed.add(other);
            variantCount++;
          }
        }
      }

      processed.add(concept);

      // Only store groups with variants (not singletons)
      if (group.variants.length > 0) {
        groups.set(concept, group);
        groupCount++;

        // Progress indicator
        if (groupCount % 100 === 0) {
          console.log(
            `   Found ${groupCount} groups, ${variantCount} variants (${comparisons.toLocaleString()} comparisons)...`
          );
        }
      }
    }
  }

  console.log(`\n✅ Grouped ${variantCount} variants into ${groupCount} groups`);
  console.log(
    `   Total comparisons: ${comparisons.toLocaleString()} (vs ${((conceptKeys.length * conceptKeys.length) / 2).toLocaleString()} without bucketing)\n`
  );

  return groups;
}

/**
 * Identify documentation gaps
 */
function identifyGaps(graph: KnowledgeGraph, conceptGroups: Map<string, ConceptGroup>): any {
  console.log('🔎 Identifying documentation gaps...\n');

  const gaps = {
    underDocumented: [] as Array<{
      concept: string;
      frequency: number;
      sources: number;
      issue: string;
    }>,
    orphanConcepts: [] as Array<{
      concept: string;
      frequency: number;
      issue: string;
    }>,
    brokenDependencies: [] as Array<{
      file: string;
      missingDeps: string[];
    }>,
  };

  // Find under-documented concepts (high frequency but few sources)
  for (const [concept, data] of Object.entries(graph.concepts)) {
    const uniqueSources = new Set(data.sources).size;
    const avgRefsPerSource = data.frequency / uniqueSources;

    if (data.frequency >= 50 && uniqueSources < 3) {
      gaps.underDocumented.push({
        concept,
        frequency: data.frequency,
        sources: uniqueSources,
        issue: `High frequency (${data.frequency}) but only ${uniqueSources} source(s)`,
      });
    }
  }

  // Find orphan concepts (no relationships)
  for (const [concept, data] of Object.entries(graph.concepts)) {
    if (data.relatedConcepts.length === 0 && data.frequency >= 20) {
      gaps.orphanConcepts.push({
        concept,
        frequency: data.frequency,
        issue: 'No relationships to other concepts',
      });
    }
  }

  // Find broken dependencies
  const allFiles = new Set<string>();
  for (const sources of Object.values(graph.concepts).map((c) => c.sources)) {
    sources.forEach((s) => allFiles.add(s));
  }

  for (const [file, deps] of Object.entries(graph.dependencies)) {
    const missingDeps = deps.filter((dep) => {
      // Check if dependency exists as a file in our graph
      const depNormalized = dep.replace(/^\.\//, '').replace(/^\//, '');
      return !Array.from(allFiles).some((f) => f.endsWith(depNormalized));
    });

    if (missingDeps.length > 0) {
      gaps.brokenDependencies.push({
        file,
        missingDeps,
      });
    }
  }

  console.log(`   Under-documented concepts: ${gaps.underDocumented.length}`);
  console.log(`   Orphan concepts: ${gaps.orphanConcepts.length}`);
  console.log(`   Broken dependencies: ${gaps.brokenDependencies.length}\n`);

  return gaps;
}

/**
 * Generate consolidated knowledge graph
 */
function generateConsolidatedGraph(
  originalGraph: KnowledgeGraph,
  conceptGroups: Map<string, ConceptGroup>
): any {
  console.log('🔧 Generating consolidated graph...\n');

  const consolidated = {
    concepts: {} as Record<
      string,
      {
        frequency: number;
        sources: string[];
        relatedConcepts: string[];
        variants?: string[];
        variantCount?: number;
      }
    >,
    conceptGroups: {} as Record<
      string,
      {
        canonical: string;
        variants: string[];
        totalFrequency: number;
        sourceCount: number;
      }
    >,
    relationships: originalGraph.relationships,
    dependencies: originalGraph.dependencies,
  };

  // Create concept map with canonical forms
  const variantToCanonical = new Map<string, string>();

  // Build variant mapping
  for (const [canonical, group] of conceptGroups.entries()) {
    variantToCanonical.set(canonical, canonical);
    for (const variant of group.variants) {
      variantToCanonical.set(variant, canonical);
    }
  }

  // Consolidate concepts
  for (const [concept, data] of Object.entries(originalGraph.concepts)) {
    const canonical = variantToCanonical.get(concept) || concept;

    if (!consolidated.concepts[canonical]) {
      consolidated.concepts[canonical] = {
        frequency: 0,
        sources: [],
        relatedConcepts: [],
        variants: [],
        variantCount: 0,
      };
    }

    const target = consolidated.concepts[canonical];
    target.frequency += data.frequency;

    // Merge sources
    const existingSources = new Set(target.sources);
    for (const source of data.sources) {
      if (!existingSources.has(source)) {
        target.sources.push(source);
      }
    }

    // Merge related concepts (using canonical forms)
    for (const related of data.relatedConcepts) {
      const canonicalRelated = variantToCanonical.get(related) || related;
      if (!target.relatedConcepts.includes(canonicalRelated)) {
        target.relatedConcepts.push(canonicalRelated);
      }
    }

    // Track variants
    if (concept !== canonical && !target.variants!.includes(concept)) {
      target.variants!.push(concept);
      target.variantCount!++;
    }
  }

  // Store concept groups
  for (const [canonical, group] of conceptGroups.entries()) {
    consolidated.conceptGroups[canonical] = {
      canonical,
      variants: group.variants,
      totalFrequency: group.totalFrequency,
      sourceCount: group.sources.size,
    };
  }

  const originalCount = Object.keys(originalGraph.concepts).length;
  const consolidatedCount = Object.keys(consolidated.concepts).length;
  const reduction = originalCount - consolidatedCount;
  const reductionPct = ((reduction / originalCount) * 100).toFixed(1);

  console.log(`   Original concepts: ${originalCount.toLocaleString()}`);
  console.log(`   Consolidated concepts: ${consolidatedCount.toLocaleString()}`);
  console.log(`   Reduction: ${reduction.toLocaleString()} (${reductionPct}%)\n`);

  return consolidated;
}

/**
 * Main execution
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  Stage 4: Knowledge Graph Consolidation                      ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  // Load knowledge graph
  console.log('📂 Loading knowledge graph...');
  const graph: KnowledgeGraph = JSON.parse(fs.readFileSync(KNOWLEDGE_GRAPH_FILE, 'utf-8'));

  const conceptCount = Object.keys(graph.concepts).length;
  const relationshipCount = graph.relationships.length;
  const dependencyCount = Object.keys(graph.dependencies).length;

  console.log(`   Concepts: ${conceptCount.toLocaleString()}`);
  console.log(`   Relationships: ${relationshipCount.toLocaleString()}`);
  console.log(`   Dependencies: ${dependencyCount.toLocaleString()}\n`);

  const startTime = Date.now();

  // Step 1: Group similar concepts
  const conceptGroups = groupSimilarConcepts(graph.concepts);

  // Step 2: Identify gaps
  const gaps = identifyGaps(graph, conceptGroups);

  // Step 3: Generate consolidated graph
  const consolidated = generateConsolidatedGraph(graph, conceptGroups);

  // Step 4: Generate report
  const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);

  const report = {
    metadata: {
      timestamp: new Date().toISOString(),
      processingTime: processingTime + 's',
      originalConceptCount: conceptCount,
      consolidatedConceptCount: Object.keys(consolidated.concepts).length,
      reductionCount: conceptCount - Object.keys(consolidated.concepts).length,
      reductionPercentage: (
        ((conceptCount - Object.keys(consolidated.concepts).length) / conceptCount) *
        100
      ).toFixed(1),
    },
    conceptGroups: Array.from(conceptGroups.entries()).map(([canonical, group]) => ({
      canonical,
      variants: group.variants,
      totalFrequency: group.totalFrequency,
      sourceCount: group.sources.size,
    })),
    gaps,
    topConsolidatedConcepts: Object.entries(consolidated.concepts)
      .sort(([, a], [, b]) => b.frequency - a.frequency)
      .slice(0, 50)
      .map(([concept, data]) => ({
        concept,
        frequency: data.frequency,
        sources: data.sources.length,
        variants: data.variants?.length || 0,
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
  console.log(`   Concept Groups Created: ${conceptGroups.size.toLocaleString()}`);
  console.log(`   Variants Merged: ${report.metadata.reductionCount.toLocaleString()}`);
  console.log(`   Reduction: ${report.metadata.reductionPercentage}%`);
  console.log(`   Under-documented: ${gaps.underDocumented.length}`);
  console.log(`   Orphan Concepts: ${gaps.orphanConcepts.length}`);
  console.log(`   Broken Dependencies: ${gaps.brokenDependencies.length}`);
  console.log(`   Processing Time: ${processingTime}s\n`);

  console.log('🔝 Top 10 consolidated concepts:');
  report.topConsolidatedConcepts.slice(0, 10).forEach((item, i) => {
    const variantInfo = item.variants > 0 ? ` (+${item.variants} variants)` : '';
    console.log(`   ${i + 1}. ${item.concept}${variantInfo} (${item.frequency} occurrences)`);
  });

  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  Stage 4: Consolidation COMPLETE                             ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
}

main().catch(console.error);
