#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const srcDir = './src';

// Comprehensive quote fixing patterns
const quoteFixPatterns = [
  // Missing closing quotes on imports
  { pattern: /from\s+['"]([^'"]+);/g, replacement: "from '$1';" },
  {
    pattern: /import\s+\{[^}]+\}\s+from\s+['"]([^'"]+);/g,
    replacement: (match, moduleName) => match.replace(/;$/, "';\n"),
  },

  // Fix object property quotes
  { pattern: /(\w+):(\w+)'/g, replacement: "$1: '$2'" },
  { pattern: /(\w+)':/g, replacement: "'$1':" },

  // Fix string arrays with corrupted quotes
  { pattern: /\[([^[\]]*)'([^[\]]*)'([^[\]]*)\]/g, replacement: "['$1', '$2']" },
  { pattern: /\[([^[\]]*)',\s*([^[\]]*)''/g, replacement: "['$1', '$2']" },
  { pattern: /\['([^']*)',\s*([^']*)''\]/g, replacement: "['$1', '$2']" },

  // Fix template literals and function signatures
  { pattern: /\(\s*data:\s*\{\s*([^}]+)\s*\}\s*'\)\s*=>/g, replacement: '(data: { $1 }) =>' },

  // Fix logger.debug with corrupted strings
  { pattern: /logger\.debug\('([^']*),\s*\{/g, replacement: "logger.debug('$1', {" },
  { pattern: /\}\s*'\);/g, replacement: '});' },

  // Fix function parameters with corrupted syntax
  {
    pattern: /async\s+use\(\):\s*Promise<void>\s*\{([^}]+):\s*Promise<void>/g,
    replacement: 'async use($1): Promise<void>',
  },

  // Fix missing quotes in headers access
  { pattern: /req\.headers\['([^']+)\]/g, replacement: "req.headers['$1']" },
  { pattern: /req\.headers\['([^']+),/g, replacement: "req.headers['$1']," },

  // Fix split function calls
  { pattern: /\.split\('([^']*)\):\s*null;/g, replacement: ".split('$1');" },

  // Fix property access with corrupted quotes
  { pattern: /req\['([^']+)'\]\s*=\s*([^;]+);/g, replacement: "req['$1'] = $2;" },

  // Fix type annotations with corrupted quotes
  {
    pattern: /status'([^']*)'([^']*)'([^']*)'([^;]*);/g,
    replacement: "status: '$1' | '$2' | '$3';",
  },

  // Fix authentication array
  {
    pattern: /tags:\s*\[\s*authentication',\s*middleware''\]/g,
    replacement: "tags: ['authentication', 'middleware']",
  },
  {
    pattern: /tags:\s*\[\s*'authentication,\s*middleware',\s*([^']+)''\]/g,
    replacement: "tags: ['authentication', 'middleware', '$1']",
  },

  // Fix metrics prefixes
  { pattern: /metricsPrefix\s*\|\|\s*metrics:;/g, replacement: "metricsPrefix || 'metrics';" },

  // Fix session validation
  { pattern: /sessionId\(([^)]+)\)\):\s*void\s*\{/g, replacement: 'sessionId: ($1),' },

  // Fix return statements with wrong syntax
  { pattern: /return\s+null;\s*\}\s*const/g, replacement: 'return null;\n  }\n\n  const' },

  // Fix corrupted method definitions
  {
    pattern:
      /private\s+async\s+validateSession\(\):\s*Promise<void>\s*\{([^}]*)\s*req:\s*Request,/g,
    replacement: 'private async validateSession(req: Request): Promise<AuthSession | null> {',
  },
];

function fixQuotesInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let originalContent = content;
    let fixCount = 0;

    // Apply all patterns
    for (const { pattern, replacement } of quoteFixPatterns) {
      const beforeLength = content.length;
      content = content.replace(pattern, replacement);
      const afterLength = content.length;
      if (beforeLength !== afterLength) {
        fixCount++;
      }
    }

    // Additional manual fixes for complex patterns

    // Fix import statements with missing quotes
    content = content.replace(
      /import\s*\{\s*([^}]+)\s*\}\s*from\s*'([^']+);/g,
      "import { $1 } from '$2';",
    );
    content = content.replace(
      /import\s*\{\s*([^}]+)\s*\}\s*from\s*"([^"]+);/g,
      'import { $1 } from "$2";',
    );

    // Fix winston import specifically
    content = content.replace(/from\s*'winston;/g, "from 'winston';");

    // Fix corrupted object properties in security files
    content = content.replace(
      /activityType:rate_limit_exceeded'/g,
      "activityType: 'rate_limit_exceeded'",
    );
    content = content.replace(/type:system'/g, "type: 'system'");
    content = content.replace(/type:application'/g, "type: 'application'");
    content = content.replace(/metric:cpu_usage'/g, "metric: 'cpu_usage'");
    content = content.replace(/metric:error_rate'/g, "metric: 'error_rate'");
    content = content.replace(/severity:warning'/g, "severity: 'warning'");

    // Fix array syntax
    content = content.replace(
      /\[\s*authentication',\s*middleware''\]/g,
      "['authentication', 'middleware']",
    );
    content = content.replace(
      /\[\s*'authentication,\s*middleware',\s*error''\]/g,
      "['authentication', 'middleware', 'error']",
    );
    content = content.replace(
      /\[\s*'authentication,\s*middleware',\s*ip_mismatch''\]/g,
      "['authentication', 'middleware', 'ip_mismatch']",
    );

    // Fix event listener syntax
    content = content.replace(
      /\(\s*data:\s*\{\s*ip:\s*string;\s*path:\s*string\s*\}'\s*\)\s*=>/g,
      '(data: { ip: string; path: string }) =>',
    );

    // Fix logger.debug calls
    content = content.replace(
      /logger\.debug\('Processing ([^']*),\s*\{/g,
      "logger.debug('Processing $1', {",
    );
    content = content.replace(/\}\s*'\);/g, '});');

    // Fix corrupted method signatures
    content = content.replace(
      /async\s+use\(\):\s*Promise<void>\s*\{req:\s*Request,\s*res:\s*Response,\s*next:\s*NextFunction\):\s*Promise<void>/g,
      'async use(req: Request, res: Response, next: NextFunction): Promise<void>',
    );

    // Fix header access
    content = content.replace(/req\.headers\['user-agent\]/g, "req.headers['user-agent']");

    // Fix split calls
    content = content.replace(/authHeader\.split\('([^']*)\):\s*null;/g, "authHeader.split('$1');");

    // Fix return type corruption
    content = content.replace(/\):\s*Request\):\s*string\s*\|\s*null\s*\{/g, '): string | null {');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed quotes in ${filePath} (${fixCount} patterns applied)`);
      return fixCount;
    }

    return 0;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return 0;
  }
}

function walkDirectory(dir) {
  let totalFixes = 0;

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      totalFixes += walkDirectory(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      totalFixes += fixQuotesInFile(filePath);
    }
  }

  return totalFixes;
}

console.log('🔧 Starting comprehensive security quote fixes...');
const totalFixes = walkDirectory(srcDir);
console.log(`✅ Completed! Applied ${totalFixes} quote fixes across all TypeScript files.`);
