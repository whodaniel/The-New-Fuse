#!/usr/bin/env node
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Run TypeScript to get errors
const tscOutput = spawnSync('node_modules/.bin/tsc', ['--noEmit'], { 
  encoding: 'utf8',
  stdio: 'pipe',
  shell: true
});

if (tscOutput.status === 0) {
  
  process.exit(0);
}

// Parse error output
const errorOutput = tscOutput.stderr || tscOutput.stdout;

// Save raw output for legacy scripts
fs.writeFileSync('typescript-errors.log', errorOutput);

// Parse and structure errors
const errors = errorOutput.split('\n')
  .filter(line => line.includes('error TS'))
  .map(line => {
    const match = line.match(/(.*):(\d+):(\d+) - error TS(\d+): (.*)/);
    if (match) {
      return {
        file: match[1],
        line: parseInt(match[2]),
        column: parseInt(match[3]),
        code: match[4],
        message: match[5]
      };
    }
    return null;
  })
  .filter(Boolean);

// Write structured error report
const report = {
  totalErrors: errors.length,
  errorsByFile: {}
};

errors.forEach(error => {
  if (!report.errorsByFile[error.file]) {
    report.errorsByFile[error.file] = {
      errors: [],
      count: 0
    };
  }
  report.errorsByFile[error.file].errors.push(error);
  report.errorsByFile[error.file].count++;
});

fs.writeFileSync('typescript-errors-report.json', JSON.stringify(report, null, 2));

