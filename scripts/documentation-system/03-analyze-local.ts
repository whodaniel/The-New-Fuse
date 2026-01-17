#!/usr/bin/env tsx
/**
 * Stage 3: Local Concept Extraction System
 *
 * Alternative to federated analysis - uses local processing with intelligent
 * pattern matching and semantic analysis to extract concepts, relationships,
 * and dependencies from documentation files.
 *
 * This system processes files in priority order (P0 → P1 → P2 → P3 → P4)
 * and builds a comprehensive knowledge graph.
 */

import * as fs from 'fs';
import * as path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const DOCS_SYSTEM_DIR = path.join(PROJECT_ROOT, '.documentation-system');
const CLASSIFIED_MANIFEST = path.join(DOCS_SYSTEM_DIR, 'classified-manifest.json');
const ANALYSIS_DIR = path.join(DOCS_SYSTEM_DIR, 'analysis');
const OUTPUT_FILE = path.join(ANALYSIS_DIR, 'concept-extraction-results.json');
const KNOWLEDGE_GRAPH_FILE = path.join(ANALYSIS_DIR, 'knowledge-graph.json');

// Concept extraction patterns
const CONCEPT_PATTERNS = {
  // Technical terms and protocols
  protocols: /(?:protocol|framework|specification|standard|convention)[\s-]+(\w+(?:[-\s]\w+)*)/gi,

  // Architecture patterns
  architectures: /(?:architecture|pattern|design|approach|model|system)[\s:]+(\w+(?:[-\s]\w+)*)/gi,

  // Agent and service names
  agents: /(?:agent|service|component|module|package)[\s-:]+(\w+(?:[-\s]\w+)*)/gi,

  // Process and workflow terms
  processes:
    /(?:process|workflow|pipeline|sequence|cycle|phase|stage|step)[\s-:]+(\w+(?:[-\s]\w+)*)/gi,

  // Technology stack
  technologies:
    /(?:using|uses|built with|powered by|based on|implements)[\s:]+(\w+(?:[-\s]\w+)*)/gi,

  // Acronyms (2-6 capital letters)
  acronyms: /\b([A-Z]{2,6})\b/g,

  // Capitalized terms (potential concepts)
  capitalizedTerms: /(?:^|\s)([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,3})/g,

  // Code identifiers
  codeIdentifiers: /`([a-zA-Z_][\w-]*)`/g,

  // File references
  fileReferences:
    /(?:see|refer to|defined in|documented in|found in)[\s:]+([^\s,;.]+\.(?:md|ts|js|json|yaml|yml))/gi,
};

// Relationship indicators
const RELATIONSHIP_PATTERNS = {
  uses: /(?:uses|utilizes|leverages|employs|relies on)\s+([^\s,;.]+)/gi,
  implements: /(?:implements|realizes|fulfills)\s+([^\s,;.]+)/gi,
  extends: /(?:extends|builds upon|based on|derived from)\s+([^\s,;.]+)/gi,
  coordinates: /(?:coordinates with|orchestrates|manages|controls)\s+([^\s,;.]+)/gi,
  contains: /(?:contains|includes|comprises|consists of)\s+([^\s,;.]+)/gi,
  dependsOn: /(?:depends on|requires|needs|prerequisite)\s+([^\s,;.]+)/gi,
  references: /(?:references|refers to|mentions|cites)\s+([^\s,;.]+)/gi,
};

// Common stopwords to filter out
const STOPWORDS = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'but',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'by',
  'from',
  'as',
  'is',
  'was',
  'are',
  'were',
  'been',
  'be',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'should',
  'could',
  'may',
  'might',
  'must',
  'can',
  'this',
  'that',
  'these',
  'those',
  'it',
  'its',
  'they',
  'their',
  'them',
  'we',
  'our',
  'you',
  'your',
]);

interface ConceptExtractionResult {
  file: string;
  concepts: string[];
  relationships: Array<{
    from: string;
    to: string;
    type: string;
  }>;
  dependencies: string[];
  metadata: {
    category: any;
    priority: string;
    tags: string[];
    size: number;
  };
}

interface KnowledgeGraph {
  concepts: Map<
    string,
    {
      frequency: number;
      sources: string[];
      relatedConcepts: Set<string>;
    }
  >;
  relationships: Array<{
    from: string;
    to: string;
    type: string;
    source: string;
  }>;
  dependencies: Map<string, Set<string>>;
}

/**
 * Extract concepts from text content
 */
function extractConcepts(content: string, filePath: string): string[] {
  const concepts = new Set<string>();

  // Apply all concept patterns
  for (const [category, pattern] of Object.entries(CONCEPT_PATTERNS)) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const concept = match[1]?.trim();
      if (concept && concept.length > 2 && concept.length < 50) {
        // Clean and normalize
        const normalized = concept
          .replace(/[^\w\s-]/g, '')
          .trim()
          .toLowerCase();

        // Filter stopwords
        const words = normalized.split(/\s+/);
        if (!words.every((w) => STOPWORDS.has(w))) {
          concepts.add(normalized);
        }
      }
    }
  }

  // Extract from headers (## Header)
  const headerMatches = content.matchAll(/^#{1,6}\s+(.+)$/gm);
  for (const match of headerMatches) {
    const header = match[1].trim().toLowerCase();
    if (header.length > 2 && header.length < 100) {
      concepts.add(header);
    }
  }

  // Extract from bold text (**text**)
  const boldMatches = content.matchAll(/\*\*([^*]+)\*\*/g);
  for (const match of boldMatches) {
    const bold = match[1].trim().toLowerCase();
    if (bold.length > 2 && bold.length < 50) {
      concepts.add(bold);
    }
  }

  return Array.from(concepts);
}

/**
 * Extract relationships between concepts
 */
function extractRelationships(
  content: string,
  concepts: string[]
): Array<{ from: string; to: string; type: string }> {
  const relationships: Array<{ from: string; to: string; type: string }> = [];

  for (const [relType, pattern] of Object.entries(RELATIONSHIP_PATTERNS)) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const target = match[1]?.trim().toLowerCase();
      if (target && concepts.includes(target)) {
        // Find source concept in nearby context
        const context = content.substring(
          Math.max(0, match.index! - 100),
          Math.min(content.length, match.index! + 100)
        );

        for (const concept of concepts) {
          if (context.toLowerCase().includes(concept) && concept !== target) {
            relationships.push({
              from: concept,
              to: target,
              type: relType,
            });
          }
        }
      }
    }
  }

  return relationships;
}

/**
 * Extract file dependencies
 */
function extractDependencies(content: string): string[] {
  const dependencies = new Set<string>();

  // Pattern 1: Markdown links
  const linkMatches = content.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g);
  for (const match of linkMatches) {
    const link = match[2];
    if (link.match(/\.(?:md|ts|js|json|yaml|yml)$/)) {
      dependencies.add(link);
    }
  }

  // Pattern 2: File references
  const fileMatches = content.matchAll(CONCEPT_PATTERNS.fileReferences);
  for (const match of fileMatches) {
    const file = match[1];
    if (file) {
      dependencies.add(file);
    }
  }

  // Pattern 3: Import/require statements (if code files)
  const importMatches = content.matchAll(/(?:import|require)\s*\(['"](.*?)['"]\)/g);
  for (const match of importMatches) {
    dependencies.add(match[1]);
  }

  return Array.from(dependencies);
}

/**
 * Analyze a single file
 */
async function analyzeFile(filePath: string, metadata: any): Promise<ConceptExtractionResult> {
  try {
    const fullPath = path.join(PROJECT_ROOT, filePath);
    const content = fs.readFileSync(fullPath, 'utf-8');

    const concepts = extractConcepts(content, filePath);
    const relationships = extractRelationships(content, concepts);
    const dependencies = extractDependencies(content);

    return {
      file: filePath,
      concepts,
      relationships,
      dependencies,
      metadata: {
        category: metadata.category,
        priority: metadata.priority,
        tags: metadata.tags || [],
        size: content.length,
      },
    };
  } catch (error) {
    console.error(`Error analyzing ${filePath}:`, error);
    return {
      file: filePath,
      concepts: [],
      relationships: [],
      dependencies: [],
      metadata: {
        category: metadata.category,
        priority: metadata.priority,
        tags: metadata.tags || [],
        size: 0,
      },
    };
  }
}

/**
 * Build knowledge graph from analysis results
 */
function buildKnowledgeGraph(results: ConceptExtractionResult[]): any {
  // Use Map to avoid prototype pollution with reserved words like "constructor"
  const conceptsMap = new Map<
    string,
    {
      frequency: number;
      sources: string[];
      relatedConcepts: string[];
    }
  >();

  const relationships: Array<{
    from: string;
    to: string;
    type: string;
    source: string;
  }> = [];

  const dependenciesMap = new Map<string, string[]>();

  // Process concepts
  for (const result of results) {
    // Skip if result is malformed
    if (!result || !result.file || !result.concepts) {
      continue;
    }

    for (const concept of result.concepts) {
      if (!concept || typeof concept !== 'string') continue;

      if (!conceptsMap.has(concept)) {
        conceptsMap.set(concept, {
          frequency: 0,
          sources: [],
          relatedConcepts: [],
        });
      }

      const conceptData = conceptsMap.get(concept)!;
      conceptData.frequency++;
      conceptData.sources.push(result.file);
    }

    // Process relationships
    for (const rel of result.relationships) {
      relationships.push({
        ...rel,
        source: result.file,
      });

      // Ensure concepts exist before adding related concepts
      if (!conceptsMap.has(rel.from)) {
        conceptsMap.set(rel.from, {
          frequency: 0,
          sources: [],
          relatedConcepts: [],
        });
      }
      if (!conceptsMap.has(rel.to)) {
        conceptsMap.set(rel.to, {
          frequency: 0,
          sources: [],
          relatedConcepts: [],
        });
      }

      // Add to related concepts
      const fromConcept = conceptsMap.get(rel.from)!;
      if (!fromConcept.relatedConcepts.includes(rel.to)) {
        fromConcept.relatedConcepts.push(rel.to);
      }
    }

    // Process dependencies
    if (result.dependencies.length > 0) {
      dependenciesMap.set(result.file, result.dependencies);
    }
  }

  // Convert Maps back to objects for JSON serialization
  const concepts: Record<string, any> = {};
  for (const [key, value] of conceptsMap.entries()) {
    concepts[key] = value;
  }

  const dependencies: Record<string, string[]> = {};
  for (const [key, value] of dependenciesMap.entries()) {
    dependencies[key] = value;
  }

  return {
    concepts,
    relationships,
    dependencies,
  };
}

/**
 * Main execution
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  Stage 3: Local Concept Extraction System                    ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  // Ensure analysis directory exists
  if (!fs.existsSync(ANALYSIS_DIR)) {
    fs.mkdirSync(ANALYSIS_DIR, { recursive: true });
  }

  // Load classified manifest
  console.log('📂 Loading classified manifest...');
  const manifest = JSON.parse(fs.readFileSync(CLASSIFIED_MANIFEST, 'utf-8'));

  // Get files to analyze (prioritize P0 and P1)
  const filesToAnalyze = manifest.files.filter(
    (f: any) => f.priority === 'P0' || f.priority === 'P1'
  );

  console.log(`📊 Files to analyze: ${filesToAnalyze.length}`);
  console.log(
    `   - P0 (Critical): ${filesToAnalyze.filter((f: any) => f.priority === 'P0').length}`
  );
  console.log(`   - P1 (High): ${filesToAnalyze.filter((f: any) => f.priority === 'P1').length}\n`);

  // Analyze files
  const results: ConceptExtractionResult[] = [];
  const startTime = Date.now();

  console.log('🔍 Analyzing files...\n');

  for (let i = 0; i < filesToAnalyze.length; i++) {
    const file = filesToAnalyze[i];
    const result = await analyzeFile(file.path, file);
    results.push(result);

    // Progress indicator
    if ((i + 1) % 50 === 0 || i === filesToAnalyze.length - 1) {
      const progress = (((i + 1) / filesToAnalyze.length) * 100).toFixed(1);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(
        `   Progress: ${i + 1}/${filesToAnalyze.length} (${progress}%) - ${elapsed}s elapsed`
      );
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n✅ Analysis complete in ${totalTime}s\n`);

  // Build knowledge graph
  console.log('🕸️  Building knowledge graph...');
  const knowledgeGraph = buildKnowledgeGraph(results);

  // Calculate statistics
  const totalConcepts = Object.keys(knowledgeGraph.concepts).length;
  const totalRelationships = knowledgeGraph.relationships.length;
  const totalDependencies = Object.keys(knowledgeGraph.dependencies).length;

  const topConcepts = Object.entries(knowledgeGraph.concepts)
    .sort(([, a], [, b]) => b.frequency - a.frequency)
    .slice(0, 20);

  console.log(`   - Unique concepts: ${totalConcepts}`);
  console.log(`   - Relationships: ${totalRelationships}`);
  console.log(`   - File dependencies: ${totalDependencies}\n`);

  console.log('🔝 Top 20 concepts:');
  topConcepts.forEach(([concept, data], i) => {
    console.log(`   ${i + 1}. ${concept} (${data.frequency} occurrences)`);
  });

  // Save results
  console.log('\n💾 Saving results...');

  const output = {
    metadata: {
      timestamp: new Date().toISOString(),
      filesAnalyzed: results.length,
      totalConcepts,
      totalRelationships,
      totalDependencies,
      processingTime: totalTime + 's',
    },
    results,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  fs.writeFileSync(KNOWLEDGE_GRAPH_FILE, JSON.stringify(knowledgeGraph, null, 2));

  console.log(`   ✅ Saved to ${path.relative(PROJECT_ROOT, OUTPUT_FILE)}`);
  console.log(`   ✅ Saved to ${path.relative(PROJECT_ROOT, KNOWLEDGE_GRAPH_FILE)}`);

  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  Stage 3: Concept Extraction COMPLETE                        ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
}

main().catch(console.error);
