#!/usr/bin/env ts-node
/**
 * Sequential File Ingestion CLI
 *
 * Usage:
 *   # From command line arguments
 *   ts-node ingest-files.ts file1.md file2.md file3.md
 *
 *   # From a list file
 *   ts-node ingest-files.ts --list filelist.txt
 *
 *   # Pipe a list
 *   echo "file1.md\nfile2.md" | ts-node ingest-files.ts --stdin
 *
 *   # Output task plan only (no execution)
 *   ts-node ingest-files.ts --plan file1.md file2.md
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as readline from 'readline';

interface FileIngestionItem {
  path: string;
  priority?: number;
}

interface FileIngestionResult {
  path: string;
  success: boolean;
  content?: string;
  error?: string;
  sizeBytes?: number;
  processingTimeMs?: number;
}

async function parseArgs(): Promise<{
  files: string[];
  listFile?: string;
  useStdin: boolean;
  planOnly: boolean;
  outputJson: boolean;
}> {
  const args = process.argv.slice(2);
  const result = {
    files: [] as string[],
    listFile: undefined as string | undefined,
    useStdin: false,
    planOnly: false,
    outputJson: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--list' || arg === '-l') {
      result.listFile = args[++i];
    } else if (arg === '--stdin' || arg === '-') {
      result.useStdin = true;
    } else if (arg === '--plan' || arg === '-p') {
      result.planOnly = true;
    } else if (arg === '--json' || arg === '-j') {
      result.outputJson = true;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else if (!arg.startsWith('-')) {
      result.files.push(arg);
    }
  }

  return result;
}

function printHelp(): void {
  console.log(`
Sequential File Ingestion CLI

Usage:
  ingest-files [options] [files...]

Options:
  --list, -l <file>    Read file paths from a list file (one per line)
  --stdin, -          Read file paths from stdin
  --plan, -p          Output task plan without executing
  --json, -j          Output results as JSON
  --help, -h          Show this help message

Examples:
  ingest-files doc1.md doc2.md doc3.md
  ingest-files --list myfiles.txt
  cat filelist.txt | ingest-files --stdin
  ingest-files --plan doc1.md doc2.md  # Just show the plan
`);
}

async function readStdin(): Promise<string[]> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  const lines: string[] = [];

  for await (const line of rl) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      lines.push(trimmed);
    }
  }

  return lines;
}

async function processFile(filePath: string): Promise<FileIngestionResult> {
  const startTime = Date.now();

  try {
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(process.cwd(), filePath);

    const stats = await fs.stat(absolutePath);
    const content = await fs.readFile(absolutePath, 'utf-8');

    return {
      path: filePath,
      success: true,
      content,
      sizeBytes: stats.size,
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      path: filePath,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      processingTimeMs: Date.now() - startTime,
    };
  }
}

function generateTaskPlan(files: string[]): void {
  console.log('\n📋 TASK PLAN');
  console.log('═'.repeat(50));
  console.log(`Total files: ${files.length}\n`);

  files.forEach((file, index) => {
    console.log(`  ${index + 1}. [PENDING] Read: ${path.basename(file)}`);
    console.log(`     Path: ${file}`);
  });

  console.log('\n' + '═'.repeat(50));
}

async function main(): Promise<void> {
  const args = await parseArgs();
  let files: string[] = [];

  // Gather file list
  if (args.useStdin) {
    files = await readStdin();
  } else if (args.listFile) {
    const content = await fs.readFile(args.listFile, 'utf-8');
    files = content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'));
  } else {
    files = args.files;
  }

  if (files.length === 0) {
    console.error('Error: No files specified');
    printHelp();
    process.exit(1);
  }

  // Plan only mode
  if (args.planOnly) {
    if (args.outputJson) {
      console.log(
        JSON.stringify(
          {
            type: 'INGESTION_PLAN',
            files: files.map((f, i) => ({ path: f, sequence: i })),
            totalCount: files.length,
          },
          null,
          2
        )
      );
    } else {
      generateTaskPlan(files);
    }
    return;
  }

  // Execute ingestion
  console.log('\n🔄 Sequential File Ingestion');
  console.log('═'.repeat(50));
  console.log(`Processing ${files.length} files...\n`);

  const results: FileIngestionResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const progress = `[${i + 1}/${files.length}]`;

    process.stdout.write(`${progress} Processing: ${path.basename(file)}...`);

    const result = await processFile(file);
    results.push(result);

    if (result.success) {
      console.log(` ✓ (${result.sizeBytes} bytes, ${result.processingTimeMs}ms)`);
    } else {
      console.log(` ✗ Error: ${result.error}`);
    }

    // Small delay between files
    if (i < files.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  // Summary
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log('\n' + '═'.repeat(50));
  console.log(`✅ Completed: ${successful}/${files.length}`);
  if (failed > 0) {
    console.log(`❌ Failed: ${failed}`);
  }

  if (args.outputJson) {
    console.log('\nResults:');
    console.log(
      JSON.stringify(
        results.map((r) => ({
          path: r.path,
          success: r.success,
          sizeBytes: r.sizeBytes,
          processingTimeMs: r.processingTimeMs,
          error: r.error,
          contentLength: r.content?.length,
        })),
        null,
        2
      )
    );
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
