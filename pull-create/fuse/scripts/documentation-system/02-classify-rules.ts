#!/usr/bin/env node
/**
 * Living Documentation System - Stage 2: Classification (Rule-Based)
 *
 * Purpose: Classify all 2,192 discovered documentation files using rule-based heuristics
 * Input: .documentation-system/raw_manifest.txt
 * Output: .documentation-system/classified-manifest.json
 *
 * This version uses pattern matching and heuristics instead of AI calls
 * for faster, more cost-effective classification.
 */

import * as fs from 'fs';
import * as path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Type definitions
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

interface ClassifiedManifest {
  metadata: {
    generated: string;
    totalFiles: number;
    classified: number;
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
    byStatus: Record<string, number>;
  };
  files: DocumentMetadata[];
}

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const RAW_MANIFEST = path.join(PROJECT_ROOT, '.documentation-system/raw_manifest.txt');
const OUTPUT_FILE = path.join(PROJECT_ROOT, '.documentation-system/classified-manifest.json');
const SAMPLE_SIZE = process.argv.includes('--sample') ? 100 : undefined;

/**
 * Classification rules based on patterns
 */
const CLASSIFICATION_RULES = [
  // Primary Documentation
  {
    pattern: /PROTOCOL|FRAMEWORK|GUIDE|ARCHITECTURE|SPECIFICATION/i,
    category: { primary: 'primary-docs' as const, subcategory: 'protocols' },
    priority: 'P0' as const,
    tags: ['protocol', 'framework', 'architecture'],
  },
  {
    pattern: /ALIGNMENT|SEQUENCING|ORCHESTRATION/i,
    category: { primary: 'primary-docs' as const, subcategory: 'frameworks' },
    priority: 'P0' as const,
    tags: ['framework', 'orchestration', 'alignment'],
  },
  {
    pattern: /\.agent\/.*\.(md|txt)$/,
    category: { primary: 'project-management' as const, subcategory: 'handoffs' },
    priority: 'P1' as const,
    tags: ['agent', 'handoff', 'coordination'],
  },
  {
    pattern: /MASTER.*PLAN|ROADMAP|STRATEGY/i,
    category: { primary: 'project-management' as const, subcategory: 'plans' },
    priority: 'P0' as const,
    tags: ['plan', 'roadmap', 'strategy'],
  },
  {
    pattern: /SESSION|HANDOFF|STATUS|SUMMARY/i,
    category: { primary: 'project-management' as const, subcategory: 'status' },
    priority: 'P1' as const,
    tags: ['status', 'session', 'handoff'],
  },
  {
    pattern: /README\.md$/i,
    category: { primary: 'code-docs' as const, subcategory: 'readme' },
    priority: 'P2' as const,
    tags: ['readme', 'documentation', 'getting-started'],
  },
  {
    pattern: /CHANGELOG|MIGRATION/i,
    category: { primary: 'code-docs' as const, subcategory: 'changelog' },
    priority: 'P3' as const,
    tags: ['changelog', 'migration', 'history'],
  },
  {
    pattern: /package\.json$/,
    category: { primary: 'configuration' as const, subcategory: 'package-config' },
    priority: 'P3' as const,
    tags: ['package', 'dependencies', 'npm'],
  },
  {
    pattern: /tsconfig|\.json$/,
    category: { primary: 'configuration' as const, subcategory: 'tool-config' },
    priority: 'P4' as const,
    tags: ['config', 'tooling', 'typescript'],
  },
  {
    pattern: /\.yaml$|\.yml$/,
    category: { primary: 'configuration' as const, subcategory: 'environment' },
    priority: 'P3' as const,
    tags: ['config', 'yaml', 'environment'],
  },
  {
    pattern: /test|spec/i,
    category: { primary: 'development' as const, subcategory: 'testing' },
    priority: 'P3' as const,
    tags: ['testing', 'quality', 'automation'],
  },
  {
    pattern: /build|deploy|ci|cd/i,
    category: { primary: 'development' as const, subcategory: 'deployment' },
    priority: 'P2' as const,
    tags: ['deployment', 'build', 'ci-cd'],
  },
  {
    pattern: /AUDIT|INVESTIGATION|ANALYSIS|REPORT/i,
    category: { primary: 'analysis' as const, subcategory: 'audits' },
    priority: 'P2' as const,
    tags: ['audit', 'analysis', 'investigation'],
  },
];

/**
 * Parse raw manifest file into structured data
 */
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

/**
 * Extract tags from file path
 */
function extractTags(filePath: string): string[] {
  const tags: string[] = [];
  const parts = filePath.split('/');

  // Add directory-based tags
  if (parts.includes('.agent')) tags.push('agent');
  if (parts.includes('.gemini')) tags.push('gemini');
  if (parts.includes('docs')) tags.push('documentation');
  if (parts.includes('packages')) tags.push('package');
  if (parts.includes('apps')) tags.push('application');
  if (parts.includes('scripts')) tags.push('script');

  // Add filename-based tags
  const filename = parts[parts.length - 1];
  if (filename.includes('protocol')) tags.push('protocol');
  if (filename.includes('api')) tags.push('api');
  if (filename.includes('guide')) tags.push('guide');
  if (filename.includes('security')) tags.push('security');

  return tags;
}

/**
 * Calculate quality score based on file characteristics
 */
function calculateQualityScore(doc: DocumentMetadata): number {
  let score = 50; // Base score

  // Size-based scoring
  if (doc.size > 10000)
    score += 20; // Large files likely comprehensive
  else if (doc.size > 5000) score += 10;
  else if (doc.size < 500) score -= 20; // Very small files likely incomplete

  // Line count scoring
  if (doc.lines > 200) score += 10;
  else if (doc.lines < 10) score -= 10;

  // Type-based scoring
  if (doc.type === 'md') score += 10; // Markdown usually well-structured

  // Recency scoring (files modified in last 30 days)
  const thirtyDaysAgo = Date.now() / 1000 - 30 * 24 * 60 * 60;
  if (doc.modified > thirtyDaysAgo) score += 10;

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate completeness score
 */
function calculateCompletenessScore(doc: DocumentMetadata): number {
  let score = 50; // Base score

  // Size indicates completeness
  if (doc.size > 20000) score += 30;
  else if (doc.size > 10000) score += 20;
  else if (doc.size > 5000) score += 10;
  else if (doc.size < 1000) score -= 20;

  // Line count
  if (doc.lines > 500) score += 15;
  else if (doc.lines > 200) score += 10;
  else if (doc.lines < 50) score -= 15;

  return Math.max(0, Math.min(100, score));
}

/**
 * Determine document status based on modification time
 */
function determineStatus(
  modified: number
): 'current' | 'outdated' | 'deprecated' | 'draft' | 'archived' {
  const now = Date.now() / 1000;
  const daysSinceModified = (now - modified) / (24 * 60 * 60);

  if (daysSinceModified < 7) return 'current';
  if (daysSinceModified < 30) return 'current';
  if (daysSinceModified < 90) return 'current';
  if (daysSinceModified < 180) return 'outdated';
  return 'archived';
}

/**
 * Classify a single document using rule-based heuristics
 */
function classifyDocument(doc: DocumentMetadata): DocumentMetadata {
  // Try each rule in order
  for (const rule of CLASSIFICATION_RULES) {
    if (rule.pattern.test(doc.path)) {
      const baseTags = extractTags(doc.path);
      const allTags = [...new Set([...rule.tags, ...baseTags])];

      return {
        ...doc,
        category: rule.category,
        subcategory: rule.category.subcategory,
        tags: allTags,
        priority: rule.priority,
        status: determineStatus(doc.modified),
        qualityScore: calculateQualityScore(doc),
        completenessScore: calculateCompletenessScore(doc),
      };
    }
  }

  // Default classification for unmatched files
  const baseTags = extractTags(doc.path);
  return {
    ...doc,
    category: { primary: 'configuration', subcategory: 'unknown' },
    subcategory: 'unknown',
    tags: baseTags.length > 0 ? baseTags : ['unclassified'],
    priority: 'P4',
    status: determineStatus(doc.modified),
    qualityScore: calculateQualityScore(doc),
    completenessScore: calculateCompletenessScore(doc),
  };
}

/**
 * Generate statistics for classified manifest
 */
function generateStats(files: DocumentMetadata[]) {
  const byCategory: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  const byStatus: Record<string, number> = {};

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
  });

  return { byCategory, byPriority, byStatus };
}

/**
 * Main classification process
 */
async function main() {
  console.log('=== Living Documentation System - Classification (Rule-Based) ===\n');

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
  console.log('Starting classification...\n');
  const startTime = Date.now();

  const classified = documents.map((doc, i) => {
    if ((i + 1) % 100 === 0) {
      console.log(`Progress: ${i + 1}/${documents.length} files classified`);
    }
    return classifyDocument(doc);
  });

  const elapsedSeconds = (Date.now() - startTime) / 1000;
  console.log(`\nClassification complete in ${elapsedSeconds.toFixed(1)}s`);
  console.log(`Average: ${((elapsedSeconds / classified.length) * 1000).toFixed(2)}ms per file\n`);

  // Generate statistics
  const stats = generateStats(classified);

  // Create output manifest
  const manifest: ClassifiedManifest = {
    metadata: {
      generated: new Date().toISOString(),
      totalFiles: classified.length,
      classified: classified.filter((f) => f.category).length,
      byCategory: stats.byCategory,
      byPriority: stats.byPriority,
      byStatus: stats.byStatus,
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
      console.log(`  ${cat}: ${count} (${pct}%)`);
    });

  console.log('\nBy Priority:');
  Object.entries(stats.byPriority)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([pri, count]) => {
      const pct = ((count / classified.length) * 100).toFixed(1);
      console.log(`  ${pri}: ${count} (${pct}%)`);
    });

  console.log('\nBy Status:');
  Object.entries(stats.byStatus)
    .sort((a, b) => b[1] - a[1])
    .forEach(([status, count]) => {
      const pct = ((count / classified.length) * 100).toFixed(1);
      console.log(`  ${status}: ${count} (${pct}%)`);
    });

  console.log('\n=== Stage 2 Complete ===');
  console.log(`Next: Stage 3 - Analysis (Extract concepts from ${classified.length} files)\n`);
}

// Run main process
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
