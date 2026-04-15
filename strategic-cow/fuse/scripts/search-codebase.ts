#!/usr/bin/env npx ts-node
/**
 * Semantic Code Search CLI
 *
 * Search the vectorized codebase using natural language
 *
 * Usage:
 *   npx ts-node scripts/search-codebase.ts "query"
 *
 * Examples:
 *   npx ts-node scripts/search-codebase.ts "authentication middleware"
 *   npx ts-node scripts/search-codebase.ts "database connection handling"
 *   npx ts-node scripts/search-codebase.ts "error handling patterns"
 */

import { CodebaseSearch } from '../packages/core-vector-db/src/codebase-search';

async function main() {
  const query = process.argv[2];

  if (!query) {
    console.log('Usage: npx ts-node scripts/search-codebase.ts "your search query"');
    console.log('Example: npx ts-node scripts/search-codebase.ts "find rate limiting logic"');
    process.exit(1);
  }

  console.log('═'.repeat(60));
  console.log('🔍 SEMANTIC CODE SEARCH');
  console.log('═'.repeat(60));
  console.log(`Query: "${query}"`);
  console.log('─'.repeat(60));

  const search = new CodebaseSearch();

  try {
    const startTime = Date.now();
    const results = await search.semanticSearch(query, 10);
    const duration = Date.now() - startTime;

    if (results.length === 0) {
      console.log('No results found.');
    } else {
      console.log(`Found ${results.length} results in ${duration}ms:\n`);

      results.forEach((result, index) => {
        const similarity = (result.similarity * 100).toFixed(1);
        console.log(`${index + 1}. [${similarity}%] ${result.entityName}`);
        console.log(`   Type: ${result.entityType}`);
        console.log(`   File: ${result.filePath}`);
        if (result.startLine) {
          console.log(`   Line: ${result.startLine}`);
        }
        console.log(`   Preview: ${result.content.substring(0, 100).replace(/\n/g, ' ')}...`);
        console.log('');
      });
    }

    console.log('─'.repeat(60));
    console.log(`⏱️  Search completed in ${duration}ms`);
  } catch (error) {
    console.error('❌ Search failed:', error);
    process.exit(1);
  } finally {
    await search.disconnect();
  }
}

main();
