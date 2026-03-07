#!/usr/bin/env node
/**
 * Living Documentation System - Stage 2: Classification
 *
 * Purpose: Classify all 2,192 discovered documentation files
 * Input: .documentation-system/raw_manifest.txt
 * Output: .documentation-system/classified-manifest.json
 *
 * Classification Taxonomy (6 Primary Categories):
 * 1. Primary Documentation (Architecture, Protocols, Guides)
 * 2. Project Management (Plans, Status, Handoffs)
 * 3. Code Documentation (READMEs, API docs, Comments)
 * 4. Development (Build, Testing, Deployment)
 * 5. Analysis & Artifacts (Audits, Investigations, Reports)
 * 6. Configuration (Package configs, Tool configs)
 */

import Anthropic from '@anthropic-ai/sdk';
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

interface ClassificationResult {
  category: DocumentCategory;
  tags: string[];
  priority: 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
  status: 'current' | 'outdated' | 'deprecated' | 'draft' | 'archived';
  qualityScore: number;
  completenessScore: number;
  reasoning: string;
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
const BATCH_SIZE = 10; // Process files in batches
const SAMPLE_SIZE = process.argv.includes('--sample') ? 100 : undefined;

// Classification taxonomy
const TAXONOMY = {
  'primary-docs': [
    'architecture',
    'protocols',
    'guides',
    'frameworks',
    'specifications',
    'standards',
  ],
  'project-management': ['plans', 'status', 'handoffs', 'retrospectives', 'roadmaps', 'proposals'],
  'code-docs': ['readme', 'api-docs', 'inline-comments', 'changelog', 'migration-guides'],
  development: ['build', 'testing', 'deployment', 'ci-cd', 'tooling', 'scripts'],
  analysis: ['audits', 'investigations', 'reports', 'metrics', 'benchmarks'],
  configuration: ['package-config', 'tool-config', 'environment', 'settings'],
};

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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
 * Classify a single document using AI
 */
async function classifyDocument(doc: DocumentMetadata): Promise<ClassificationResult> {
  const prompt = `You are a documentation classification expert. Analyze this file and classify it.

File Details:
- Path: ${doc.path}
- Type: ${doc.type}
- Size: ${doc.size} bytes
- Directory: ${doc.directory}
- Lines: ${doc.lines}

Classification Taxonomy:
${JSON.stringify(TAXONOMY, null, 2)}

Please classify this file according to:
1. Primary category (primary-docs, project-management, code-docs, development, analysis, configuration)
2. Subcategory (from the taxonomy above)
3. 5-10 semantic tags (keywords describing the content)
4. Priority (P0=critical, P1=high, P2=medium, P3=low, P4=optional)
5. Status (current, outdated, deprecated, draft, archived)
6. Quality score (0-100, based on likely completeness and clarity)
7. Completeness score (0-100, based on likely coverage of topic)

Consider:
- File path patterns (e.g., README.md = code-docs/readme)
- Directory context (e.g., .agent/ = project-management or primary-docs)
- File size (very small = likely incomplete)
- File type (json configs = configuration)

Return a JSON object with this structure:
{
  "category": {
    "primary": "category-name",
    "subcategory": "subcategory-name"
  },
  "tags": ["tag1", "tag2", ...],
  "priority": "P0-P4",
  "status": "current|outdated|deprecated|draft|archived",
  "qualityScore": 0-100,
  "completenessScore": 0-100,
  "reasoning": "brief explanation"
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022', // Fast and cost-effective for classification
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Extract JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error(`Error classifying ${doc.path}:`, error);
    // Return default classification on error
    return {
      category: {
        primary: 'configuration',
        subcategory: 'unknown',
      },
      tags: ['unclassified'],
      priority: 'P4',
      status: 'current',
      qualityScore: 0,
      completenessScore: 0,
      reasoning: 'Classification failed: ' + (error as Error).message,
    };
  }
}

/**
 * Classify documents in batches
 */
async function classifyBatch(docs: DocumentMetadata[]): Promise<DocumentMetadata[]> {
  const results: DocumentMetadata[] = [];

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    console.log(`[${i + 1}/${docs.length}] Classifying: ${doc.path}`);

    const classification = await classifyDocument(doc);

    results.push({
      ...doc,
      category: classification.category,
      subcategory: classification.category.subcategory,
      tags: classification.tags,
      priority: classification.priority,
      status: classification.status,
      qualityScore: classification.qualityScore,
      completenessScore: classification.completenessScore,
    });

    // Rate limiting: small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
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
  console.log('=== Living Documentation System - Classification ===\n');

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ERROR: ANTHROPIC_API_KEY environment variable not set');
    console.error('Please set your API key: export ANTHROPIC_API_KEY=your-key-here');
    process.exit(1);
  }

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

  const classified = await classifyBatch(documents);

  const elapsedSeconds = (Date.now() - startTime) / 1000;
  console.log(`\nClassification complete in ${elapsedSeconds.toFixed(1)}s`);
  console.log(`Average: ${(elapsedSeconds / classified.length).toFixed(2)}s per file\n`);

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
