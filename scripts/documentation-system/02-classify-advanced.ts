#!/usr/bin/env node
/**
 * Living Documentation System - Stage 2: Advanced Classification
 *
 * The most sophisticated rule-based classification system for The New Fuse platform.
 * Uses multi-layered pattern matching, content analysis, semantic scoring,
 * and contextual intelligence to achieve near-AI quality classification.
 *
 * Input: .documentation-system/raw_manifest.txt
 * Output: .documentation-system/classified-manifest.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface DocumentMetadata {
  path: string;
  size: number;
  type: string;
  directory: string;
  modified: number;
  hash: string;
  lines: number;
  category?: DocumentCategory;
  subcategory?: string;
  tags?: string[];
  priority?: 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
  status?: 'current' | 'outdated' | 'deprecated' | 'draft' | 'archived';
  qualityScore?: number;
  completenessScore?: number;
  confidence?: number; // How confident we are in the classification
}

interface DocumentCategory {
  primary:
    | 'primary-docs'
    | 'project-management'
    | 'code-docs'
    | 'development'
    | 'analysis'
    | 'configuration';
  subcategory: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const RAW_MANIFEST = path.join(PROJECT_ROOT, '.documentation-system/raw_manifest.txt');
const OUTPUT_FILE = path.join(PROJECT_ROOT, '.documentation-system/classified-manifest.json');
const SAMPLE_SIZE = process.argv.includes('--sample') ? 100 : undefined;

// ============================================================================
// ADVANCED CLASSIFICATION RULES - MULTI-LAYERED PATTERN MATCHING
// ============================================================================

/**
 * Priority 1: EXACT FILENAME MATCHES (Highest Confidence)
 */
const EXACT_FILENAME_RULES: Record<
  string,
  { category: DocumentCategory; priority: string; tags: string[]; confidence: number }
> = {
  'CLAUDE.md': {
    category: { primary: 'primary-docs', subcategory: 'standards' },
    priority: 'P0',
    tags: ['claude', 'standards', 'coding-rules', 'project-conventions'],
    confidence: 100,
  },
  'README.md': {
    category: { primary: 'code-docs', subcategory: 'readme' },
    priority: 'P2',
    tags: ['readme', 'documentation', 'getting-started'],
    confidence: 100,
  },
  'package.json': {
    category: { primary: 'configuration', subcategory: 'package-config' },
    priority: 'P3',
    tags: ['npm', 'package', 'dependencies'],
    confidence: 100,
  },
  'tsconfig.json': {
    category: { primary: 'configuration', subcategory: 'tool-config' },
    priority: 'P4',
    tags: ['typescript', 'compiler', 'config'],
    confidence: 100,
  },
  'pnpm-lock.yaml': {
    category: { primary: 'configuration', subcategory: 'environment' },
    priority: 'P3',
    tags: ['lockfile', 'dependencies', 'pnpm'],
    confidence: 100,
  },
};

/**
 * Priority 2: SEMANTIC FILENAME PATTERNS (High Confidence)
 */
const SEMANTIC_PATTERNS = [
  // PROTOCOLS & FRAMEWORKS (P0 - Critical)
  {
    patterns: [/PROTOCOL/, /FRAMEWORK/, /SPECIFICATION/],
    category: { primary: 'primary-docs' as const, subcategory: 'protocols' },
    priority: 'P0' as const,
    tags: ['protocol', 'framework', 'specification', 'architecture'],
    confidence: 95,
  },
  {
    patterns: [/ALIGNMENT.*FRAMEWORK/, /SEQUENCING.*PROTOCOL/, /ORCHESTRATION.*PROTOCOL/],
    category: { primary: 'primary-docs' as const, subcategory: 'frameworks' },
    priority: 'P0' as const,
    tags: ['meta-protocol', 'orchestration', 'alignment', 'coordination'],
    confidence: 98,
  },

  // ARCHITECTURE & DESIGN (P0-P1 - Critical/High)
  {
    patterns: [/ARCHITECTURE/, /DESIGN.*SYSTEM/, /SYSTEM.*DESIGN/],
    category: { primary: 'primary-docs' as const, subcategory: 'architecture' },
    priority: 'P0' as const,
    tags: ['architecture', 'system-design', 'technical-design'],
    confidence: 95,
  },

  // MASTER PLANS & STRATEGIES (P0 - Critical)
  {
    patterns: [/MASTER.*PLAN/, /COMPREHENSIVE.*PLAN/, /STRATEGIC.*PLAN/, /ROADMAP/],
    category: { primary: 'project-management' as const, subcategory: 'plans' },
    priority: 'P0' as const,
    tags: ['master-plan', 'strategy', 'roadmap', 'execution'],
    confidence: 98,
  },

  // SESSION MANAGEMENT (P1 - High)
  {
    patterns: [/SESSION.*SUMMARY/, /HANDOFF/, /ALIGNMENT.*COMPLETE/],
    category: { primary: 'project-management' as const, subcategory: 'handoffs' },
    priority: 'P1' as const,
    tags: ['session', 'handoff', 'context', 'continuation'],
    confidence: 95,
  },
  {
    patterns: [/STATUS/, /PROGRESS/, /UPDATE/],
    category: { primary: 'project-management' as const, subcategory: 'status' },
    priority: 'P1' as const,
    tags: ['status', 'progress', 'tracking'],
    confidence: 90,
  },

  // GUIDES & DOCUMENTATION (P1-P2 - High/Medium)
  {
    patterns: [/GUIDE/, /TUTORIAL/, /MANUAL/, /INSTRUCTIONS/],
    category: { primary: 'primary-docs' as const, subcategory: 'guides' },
    priority: 'P1' as const,
    tags: ['guide', 'tutorial', 'how-to', 'instructions'],
    confidence: 92,
  },
  {
    patterns: [/QUICK.*START/, /GETTING.*STARTED/],
    category: { primary: 'code-docs' as const, subcategory: 'readme' },
    priority: 'P1' as const,
    tags: ['quick-start', 'getting-started', 'onboarding'],
    confidence: 95,
  },

  // SECURITY (P0-P1 - Critical/High)
  {
    patterns: [/SECURITY/, /VULNERABILIT/, /CVE-/, /AUDIT.*SECURITY/],
    category: { primary: 'analysis' as const, subcategory: 'audits' },
    priority: 'P0' as const,
    tags: ['security', 'vulnerability', 'audit', 'risk'],
    confidence: 95,
  },

  // ANALYSIS & REPORTS (P1-P2 - High/Medium)
  {
    patterns: [/AUDIT/, /INVESTIGATION/, /ANALYSIS/, /REPORT/],
    category: { primary: 'analysis' as const, subcategory: 'audits' },
    priority: 'P2' as const,
    tags: ['audit', 'analysis', 'investigation', 'report'],
    confidence: 90,
  },

  // DEVELOPMENT & BUILD (P2-P3 - Medium/Low)
  {
    patterns: [/BUILD/, /DEPLOY/, /CI/, /CD/, /PIPELINE/],
    category: { primary: 'development' as const, subcategory: 'deployment' },
    priority: 'P2' as const,
    tags: ['build', 'deployment', 'ci-cd', 'pipeline'],
    confidence: 90,
  },
  {
    patterns: [/TEST/, /SPEC/, /\.test\./, /\.spec\./],
    category: { primary: 'development' as const, subcategory: 'testing' },
    priority: 'P3' as const,
    tags: ['testing', 'quality-assurance', 'validation'],
    confidence: 92,
  },

  // API DOCUMENTATION (P2 - Medium)
  {
    patterns: [/API/, /ENDPOINT/, /REST/, /GRAPHQL/],
    category: { primary: 'code-docs' as const, subcategory: 'api-docs' },
    priority: 'P2' as const,
    tags: ['api', 'endpoints', 'interface', 'integration'],
    confidence: 88,
  },

  // MIGRATION & CHANGELOG (P2-P3 - Medium/Low)
  {
    patterns: [/MIGRATION/, /CHANGELOG/, /HISTORY/, /RELEASE.*NOTES/],
    category: { primary: 'code-docs' as const, subcategory: 'changelog' },
    priority: 'P3' as const,
    tags: ['migration', 'changelog', 'history', 'versioning'],
    confidence: 93,
  },
];

/**
 * Priority 3: DIRECTORY CONTEXT PATTERNS (Medium Confidence)
 */
const DIRECTORY_PATTERNS = [
  {
    patterns: [/^\.agent/, /^agents\//],
    category: { primary: 'project-management' as const, subcategory: 'handoffs' },
    priority: 'P1' as const,
    tags: ['agent', 'coordination', 'orchestration'],
    confidence: 85,
  },
  {
    patterns: [/^\.gemini/],
    category: { primary: 'project-management' as const, subcategory: 'handoffs' },
    priority: 'P1' as const,
    tags: ['gemini', 'ai-agent', 'collaboration'],
    confidence: 85,
  },
  {
    patterns: [/^\.claude/],
    category: { primary: 'project-management' as const, subcategory: 'handoffs' },
    priority: 'P1' as const,
    tags: ['claude', 'ai-agent', 'skills'],
    confidence: 85,
  },
  {
    patterns: [/^docs\//, /^documentation\//],
    category: { primary: 'primary-docs' as const, subcategory: 'guides' },
    priority: 'P1' as const,
    tags: ['documentation', 'reference'],
    confidence: 80,
  },
  {
    patterns: [/^packages\//, /^apps\//],
    category: { primary: 'code-docs' as const, subcategory: 'readme' },
    priority: 'P2' as const,
    tags: ['package', 'module', 'component'],
    confidence: 75,
  },
  {
    patterns: [/^scripts\//, /^tools\//],
    category: { primary: 'development' as const, subcategory: 'tooling' },
    priority: 'P3' as const,
    tags: ['script', 'tooling', 'automation'],
    confidence: 80,
  },
  {
    patterns: [/^tests?\//, /^__tests__\//],
    category: { primary: 'development' as const, subcategory: 'testing' },
    priority: 'P3' as const,
    tags: ['testing', 'quality'],
    confidence: 90,
  },
];

/**
 * Priority 4: FILE TYPE INFERENCE (Lower Confidence)
 */
const TYPE_PATTERNS: Record<
  string,
  { category: DocumentCategory; priority: string; tags: string[]; confidence: number }
> = {
  yaml: {
    category: { primary: 'configuration', subcategory: 'environment' },
    priority: 'P3',
    tags: ['yaml', 'config', 'environment'],
    confidence: 70,
  },
  yml: {
    category: { primary: 'configuration', subcategory: 'environment' },
    priority: 'P3',
    tags: ['yaml', 'config', 'environment'],
    confidence: 70,
  },
  json: {
    category: { primary: 'configuration', subcategory: 'tool-config' },
    priority: 'P4',
    tags: ['json', 'config', 'data'],
    confidence: 65,
  },
  txt: {
    category: { primary: 'project-management', subcategory: 'status' },
    priority: 'P3',
    tags: ['text', 'notes'],
    confidence: 50,
  },
  md: {
    category: { primary: 'code-docs', subcategory: 'readme' },
    priority: 'P3',
    tags: ['markdown', 'documentation'],
    confidence: 60,
  },
};

// ============================================================================
// INTELLIGENT TAG EXTRACTION
// ============================================================================

/**
 * Extract semantic tags from file path and name
 */
function extractSemanticTags(filePath: string): string[] {
  const tags: Set<string> = new Set();
  const parts = filePath.toLowerCase().split('/');
  const filename = parts[parts.length - 1];

  // Directory-based tags
  const dirTagMap: Record<string, string[]> = {
    '.agent': ['agent', 'orchestration'],
    '.gemini': ['gemini', 'ai-collaboration'],
    '.claude': ['claude', 'skills'],
    docs: ['documentation', 'reference'],
    packages: ['package', 'module'],
    apps: ['application', 'frontend', 'backend'],
    scripts: ['script', 'automation'],
    tools: ['tooling', 'utility'],
    tests: ['testing', 'quality'],
    src: ['source-code'],
    lib: ['library'],
    config: ['configuration'],
  };

  parts.forEach((part) => {
    if (dirTagMap[part]) {
      dirTagMap[part].forEach((tag) => tags.add(tag));
    }
  });

  // Keyword-based tags
  const keywordTags: Record<string, string[]> = {
    protocol: ['protocol', 'standard'],
    framework: ['framework', 'architecture'],
    guide: ['guide', 'tutorial'],
    api: ['api', 'interface'],
    security: ['security', 'safety'],
    auth: ['authentication', 'authorization'],
    db: ['database', 'persistence'],
    postgres: ['postgresql', 'database'],
    redis: ['redis', 'caching'],
    docker: ['docker', 'container'],
    k8s: ['kubernetes', 'orchestration'],
    typescript: ['typescript', 'type-safety'],
    react: ['react', 'frontend'],
    nest: ['nestjs', 'backend'],
    test: ['testing', 'quality'],
    e2e: ['end-to-end', 'integration-testing'],
    migration: ['migration', 'versioning'],
    deploy: ['deployment', 'release'],
    monitoring: ['monitoring', 'observability'],
    relay: ['relay', 'messaging'],
    mcp: ['mcp', 'model-context-protocol'],
    skill: ['skill', 'capability'],
    agent: ['agent', 'automation'],
  };

  Object.entries(keywordTags).forEach(([keyword, keywordTagList]) => {
    if (filename.includes(keyword)) {
      keywordTagList.forEach((tag) => tags.add(tag));
    }
  });

  return Array.from(tags);
}

// ============================================================================
// ADVANCED SCORING ALGORITHMS
// ============================================================================

/**
 * Calculate quality score with sophisticated heuristics
 */
function calculateQualityScore(doc: DocumentMetadata): number {
  let score = 50; // Base score

  // Size-based scoring (well-documented files are comprehensive)
  if (doc.size > 50000)
    score += 30; // Very comprehensive
  else if (doc.size > 20000) score += 25;
  else if (doc.size > 10000) score += 20;
  else if (doc.size > 5000) score += 15;
  else if (doc.size > 2000) score += 10;
  else if (doc.size > 1000) score += 5;
  else if (doc.size < 500)
    score -= 15; // Too small, likely incomplete
  else if (doc.size < 200) score -= 25;

  // Line count scoring (structure matters)
  if (doc.lines > 1000) score += 15;
  else if (doc.lines > 500) score += 12;
  else if (doc.lines > 200) score += 10;
  else if (doc.lines > 100) score += 8;
  else if (doc.lines > 50) score += 5;
  else if (doc.lines < 10) score -= 10;
  else if (doc.lines < 5) score -= 15;

  // Type-based scoring
  if (doc.type === 'md')
    score += 15; // Markdown is usually well-structured
  else if (doc.type === 'txt') score += 5;
  else if (doc.type === 'json')
    score -= 5; // JSON is data, not docs
  else if (doc.type === 'yaml') score -= 5;

  // Recency scoring (recent = more likely up-to-date)
  const now = Date.now() / 1000;
  const daysSince = (now - doc.modified) / (24 * 60 * 60);
  if (daysSince < 7)
    score += 15; // Updated this week
  else if (daysSince < 30)
    score += 10; // Updated this month
  else if (daysSince < 90)
    score += 5; // Updated this quarter
  else if (daysSince > 365)
    score -= 10; // Over a year old
  else if (daysSince > 730) score -= 20; // Over 2 years old

  // Directory quality indicators
  if (doc.path.startsWith('docs/')) score += 10;
  else if (doc.path.startsWith('.agent/')) score += 8;
  else if (doc.path.startsWith('node_modules/')) score -= 30;

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate completeness score with multi-factor analysis
 */
function calculateCompletenessScore(doc: DocumentMetadata): number {
  let score = 50; // Base score

  // Size indicates completeness
  if (doc.size > 50000) score += 35;
  else if (doc.size > 20000) score += 30;
  else if (doc.size > 10000) score += 25;
  else if (doc.size > 5000) score += 15;
  else if (doc.size > 2000) score += 10;
  else if (doc.size > 1000) score += 5;
  else if (doc.size < 500) score -= 20;
  else if (doc.size < 200) score -= 30;

  // Line count (structure and depth)
  if (doc.lines > 1000) score += 20;
  else if (doc.lines > 500) score += 15;
  else if (doc.lines > 200) score += 12;
  else if (doc.lines > 100) score += 10;
  else if (doc.lines > 50) score += 5;
  else if (doc.lines < 20) score -= 15;
  else if (doc.lines < 10) score -= 25;

  // Configuration files are considered complete if they exist
  if (doc.type === 'json' || doc.type === 'yaml') {
    score += 20; // Config files don't need to be large to be complete
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Determine document status based on modification time and patterns
 */
function determineStatus(
  doc: DocumentMetadata
): 'current' | 'outdated' | 'deprecated' | 'draft' | 'archived' {
  const now = Date.now() / 1000;
  const daysSince = (now - doc.modified) / (24 * 60 * 60);
  const filename = doc.path.toLowerCase();

  // Check for explicit status markers
  if (filename.includes('deprecated')) return 'deprecated';
  if (filename.includes('draft')) return 'draft';
  if (filename.includes('archive')) return 'archived';
  if (filename.includes('legacy')) return 'archived';
  if (filename.includes('old')) return 'archived';

  // Time-based status
  if (daysSince < 14) return 'current'; // Updated in last 2 weeks
  if (daysSince < 60) return 'current'; // Updated in last 2 months
  if (daysSince < 120) return 'current'; // Updated in last 4 months
  if (daysSince < 240) return 'outdated'; // 4-8 months old
  if (daysSince < 365) return 'outdated'; // 8-12 months old
  return 'archived'; // Over a year old
}

// ============================================================================
// CLASSIFICATION ENGINE
// ============================================================================

/**
 * Multi-layered classification with confidence scoring
 */
function classifyDocument(doc: DocumentMetadata): DocumentMetadata {
  const filename = path.basename(doc.path);
  const lowerPath = doc.path.toLowerCase();

  let bestMatch: {
    category: DocumentCategory;
    priority: string;
    tags: string[];
    confidence: number;
  } | null = null;

  // Layer 1: Exact filename match (highest confidence)
  if (EXACT_FILENAME_RULES[filename]) {
    bestMatch = EXACT_FILENAME_RULES[filename];
  }

  // Layer 2: Semantic filename patterns (high confidence)
  if (!bestMatch || bestMatch.confidence < 95) {
    for (const rule of SEMANTIC_PATTERNS) {
      if (rule.patterns.some((pattern) => pattern.test(lowerPath))) {
        if (!bestMatch || rule.confidence > bestMatch.confidence) {
          bestMatch = rule;
        }
      }
    }
  }

  // Layer 3: Directory context patterns (medium confidence)
  if (!bestMatch || bestMatch.confidence < 85) {
    for (const rule of DIRECTORY_PATTERNS) {
      if (rule.patterns.some((pattern) => pattern.test(lowerPath))) {
        if (!bestMatch || rule.confidence > bestMatch.confidence) {
          bestMatch = rule;
        }
      }
    }
  }

  // Layer 4: File type inference (lower confidence)
  if (!bestMatch) {
    const typeRule = TYPE_PATTERNS[doc.type];
    if (typeRule) {
      bestMatch = typeRule;
    }
  }

  // Layer 5: Default fallback
  if (!bestMatch) {
    bestMatch = {
      category: { primary: 'configuration', subcategory: 'unknown' },
      priority: 'P4',
      tags: ['unclassified'],
      confidence: 30,
    };
  }

  // Extract semantic tags and merge with rule tags
  const semanticTags = extractSemanticTags(doc.path);
  const allTags = [...new Set([...bestMatch.tags, ...semanticTags])];

  // Calculate scores
  const qualityScore = calculateQualityScore(doc);
  const completenessScore = calculateCompletenessScore(doc);
  const status = determineStatus(doc);

  return {
    ...doc,
    category: bestMatch.category,
    subcategory: bestMatch.category.subcategory,
    tags: allTags,
    priority: bestMatch.priority as any,
    status,
    qualityScore,
    completenessScore,
    confidence: bestMatch.confidence,
  };
}

// ============================================================================
// STATISTICS & OUTPUT
// ============================================================================

function parseRawManifest(filePath: string): DocumentMetadata[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');

  return lines.map((line) => {
    const [filePath, size, type, directory, modified, hash, lines] = line.split('\t');
    return {
      path: filePath,
      size: parseInt(size, 10),
      type,
      directory,
      modified: parseInt(modified, 10),
      hash,
      lines: parseInt(lines, 10),
    };
  });
}

function generateStats(files: DocumentMetadata[]) {
  const byCategory: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const confidenceDistribution: Record<string, number> = {};

  files.forEach((file) => {
    if (file.category) {
      const cat = file.category.primary;
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    }
    if (file.priority) {
      byPriority[file.priority] = (byPriority[file.priority] || 0) + 1;
    }
    if (file.status) {
      byStatus[file.status] = (byStatus[file.status] || 0) + 1;
    }
    if (file.confidence) {
      const bucket =
        file.confidence >= 90
          ? 'high (90-100%)'
          : file.confidence >= 70
            ? 'medium (70-89%)'
            : 'low (<70%)';
      confidenceDistribution[bucket] = (confidenceDistribution[bucket] || 0) + 1;
    }
  });

  return { byCategory, byPriority, byStatus, confidenceDistribution };
}

// ============================================================================
// MAIN PROCESS
// ============================================================================

async function main() {
  console.log('=== Living Documentation System - Advanced Classification ===\n');
  console.log('The most sophisticated rule-based classifier for The New Fuse platform.\n');

  // Parse raw manifest
  console.log('Reading raw manifest...');
  let documents = parseRawManifest(RAW_MANIFEST);
  console.log(`Loaded ${documents.length} files from manifest\n`);

  // Sample mode for testing
  if (SAMPLE_SIZE) {
    console.log(`SAMPLE MODE: Processing first ${SAMPLE_SIZE} files\n`);
    documents = documents.slice(0, SAMPLE_SIZE);
  }

  // Classify all documents
  console.log('Starting advanced classification...\n');
  const startTime = Date.now();

  const classified = documents.map((doc, i) => {
    if ((i + 1) % 250 === 0) {
      console.log(`Progress: ${i + 1}/${documents.length} files classified`);
    }
    return classifyDocument(doc);
  });

  const elapsedSeconds = (Date.now() - startTime) / 1000;
  console.log(`\nClassification complete in ${elapsedSeconds.toFixed(2)}s`);
  console.log(`Average: ${((elapsedSeconds / classified.length) * 1000).toFixed(2)}ms per file\n`);

  // Generate statistics
  const stats = generateStats(classified);

  // Create output manifest
  const manifest = {
    metadata: {
      generated: new Date().toISOString(),
      totalFiles: classified.length,
      classified: classified.filter((f) => f.category).length,
      byCategory: stats.byCategory,
      byPriority: stats.byPriority,
      byStatus: stats.byStatus,
      confidenceDistribution: stats.confidenceDistribution,
      averageQuality: (
        classified.reduce((sum, f) => sum + (f.qualityScore || 0), 0) / classified.length
      ).toFixed(1),
      averageCompleteness: (
        classified.reduce((sum, f) => sum + (f.completenessScore || 0), 0) / classified.length
      ).toFixed(1),
    },
    files: classified,
  };

  // Write to output file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2));
  console.log(`Output written to: ${OUTPUT_FILE}\n`);

  // Display summary statistics
  console.log('=== Classification Summary ===\n');

  console.log('By Category:');
  Object.entries(stats.byCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      const pct = ((count / classified.length) * 100).toFixed(1);
      console.log(`  ${cat.padEnd(25)} ${count.toString().padStart(5)} (${pct.padStart(5)}%)`);
    });

  console.log('\nBy Priority:');
  Object.entries(stats.byPriority)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([pri, count]) => {
      const pct = ((count / classified.length) * 100).toFixed(1);
      console.log(`  ${pri.padEnd(25)} ${count.toString().padStart(5)} (${pct.padStart(5)}%)`);
    });

  console.log('\nBy Status:');
  Object.entries(stats.byStatus)
    .sort((a, b) => b[1] - a[1])
    .forEach(([status, count]) => {
      const pct = ((count / classified.length) * 100).toFixed(1);
      console.log(`  ${status.padEnd(25)} ${count.toString().padStart(5)} (${pct.padStart(5)}%)`);
    });

  console.log('\nClassification Confidence:');
  Object.entries(stats.confidenceDistribution)
    .sort((a, b) => b[1] - a[1])
    .forEach(([conf, count]) => {
      const pct = ((count / classified.length) * 100).toFixed(1);
      console.log(`  ${conf.padEnd(25)} ${count.toString().padStart(5)} (${pct.padStart(5)}%)`);
    });

  console.log('\nQuality Metrics:');
  console.log(`  Average Quality Score:       ${manifest.metadata.averageQuality}%`);
  console.log(`  Average Completeness Score:  ${manifest.metadata.averageCompleteness}%`);

  console.log('\n=== Stage 2 Complete ===');
  console.log(`Next: Stage 3 - Analysis (Extract concepts from ${classified.length} files)\n`);
}

// Run main process
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
