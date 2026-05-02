#!/usr/bin/env npx ts-node
/**
 * Codebase Vectorization CLI
 *
 * Vectorizes the entire codebase for semantic search
 *
 * Usage:
 *   npx ts-node scripts/vectorize-codebase.ts [path]
 *
 * Examples:
 *   npx ts-node scripts/vectorize-codebase.ts                    # Vectorize current directory
 *   npx ts-node scripts/vectorize-codebase.ts /path/to/project   # Vectorize specific path
 */

import * as path from 'path';
import { CodebaseVectorizer } from '../packages/core-vector-db/src/codebase-vectorizer';

async function main() {
  const targetPath = process.argv[2] || process.cwd();
  const absolutePath = path.resolve(targetPath);

  console.log('═'.repeat(60));
  console.log('🧠 CODEBASE VECTORIZATION SYSTEM');
  console.log('═'.repeat(60));
  console.log(`📁 Target: ${absolutePath}`);
  console.log(`⏰ Started: ${new Date().toISOString()}`);
  console.log('─'.repeat(60));

  const vectorizer = new CodebaseVectorizer();

  try {
    const startTime = Date.now();

    await vectorizer.vectorizeCodebase(absolutePath);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('─'.repeat(60));
    console.log(`✅ Vectorization complete!`);
    console.log(`⏱️  Duration: ${duration}s`);
    console.log('═'.repeat(60));
  } catch (error) {
    console.error('❌ Vectorization failed:', error);
    process.exit(1);
  } finally {
    await vectorizer.disconnect();
  }
}

main();
