const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TypeScriptRepairScript {
  constructor() {
    this.backupDir = './syntax-repair-backup-' + new Date().toISOString().replace(/[:.]/g, '-');
    this.logFile = './repair-log.txt';
    this.repairStats = {
      filesProcessed: 0,
      filesFixed: 0,
      patternsFixed: 0,
      errors: []
    };
    
    // Create backup directory
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
    
    this.log('=== TypeScript Repair Script Started ===');
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log(logEntry);
    fs.appendFileSync(this.logFile, logEntry + '\n');
  }

  createBackup(filePath) {
    const backupPath = path.join(this.backupDir, filePath.replace(/\//g, '_'));
    const backupDir = path.dirname(backupPath);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    fs.copyFileSync(filePath, backupPath);
    this.log(`Backup created: ${backupPath}`);
  }

  applyRepairPatterns(content, filePath) {
    let fixedContent = content;
    let fixCount = 0;

    // Pattern 1: Fix import statements
    const importFixes = [
      // Missing 'from' keyword and quotes
      {
        pattern: /import\s+@([^'";]+)';/g,
        replacement: "import { /* TODO: specify imports */ } from '@$1';",
        description: "Fixed import statement missing 'from' keyword"
      },
      {
        pattern: /import\s+"@([^"]+)";/g,
        replacement: "import { /* TODO: specify imports */ } from \"@$1\";",
        description: "Fixed import statement missing 'from' keyword with double quotes"
      },
      {
        pattern: /import\s+([^'"\s]+)\s+from\s+'([^']+)';/g,
        replacement: "import $1 from '$2';",
        description: "Fixed basic import statement"
      }
    ];

    // Pattern 2: Fix concatenated keywords
    const keywordFixes = [
      {
        pattern: /asyncfunc/g,
        replacement: 'async func',
        description: "Fixed concatenated 'async func'"
      },
      {
        pattern: /awaitthis/g,
        replacement: 'await this',
        description: "Fixed concatenated 'await this'"
      },
      {
        pattern: /returnthis/g,
        replacement: 'return this',
        description: "Fixed concatenated 'return this'"
      },
      {
        pattern: /throwerror/g,
        replacement: 'throw error',
        description: "Fixed concatenated 'throw error'"
      },
      {
        pattern: /asyncgenerate/g,
        replacement: 'async generate',
        description: "Fixed concatenated 'async generate'"
      }
    ];

    // Pattern 3: Fix method signatures and function declarations
    const methodFixes = [
      {
        pattern: /asyncgenerateAccessToken\(/g,
        replacement: 'async generateAccessToken(',
        description: "Fixed async method declaration"
      },
      {
        pattern: /\)\s*:\s*Promise<[^>]+>\s*{\s*try\s*{/g,
        replacement: (match) => match.replace('{', '{\n    try {'),
        description: "Fixed method body formatting"
      }
    ];

    // Pattern 4: Fix string literals and template literals
    const stringFixes = [
      // Missing quotes in error messages
      {
        pattern: /this\.logger\.error\(([^,\)]*[^'"][^,\)]*),/g,
        replacement: "this.logger.error('$1',",
        description: "Fixed logger error message quotes"
      },
      // Fix malformed template literals
      {
        pattern: /refresh_token:\s*\${\s*([^}]+)\s*}/g,
        replacement: '`refresh_token:${$1}`',
        description: "Fixed template literal backticks"
      },
      {
        pattern: /([^`])\${\s*([^}]+)\s*}([^`])/g,
        replacement: '$1`${$2}`$3',
        description: "Fixed template literal expressions"
      },
      // Fix string concatenation issues
      {
        pattern: /'([^']*)\s*\+\s*([^']*)\s*\+\s*'([^']*)'/g,
        replacement: "'$1$2$3'",
        description: "Fixed string concatenation"
      }
    ];

    // Pattern 5: Fix decorators
    const decoratorFixes = [
      {
        pattern: /@Entity\(\);/g,
        replacement: '@Entity()',
        description: "Fixed Entity decorator"
      },
      {
        pattern: /@PrimaryGeneratedColumn\('uuid\)/g,
        replacement: "@PrimaryGeneratedColumn('uuid')",
        description: "Fixed PrimaryGeneratedColumn decorator quotes"
      },
      {
        pattern: /@Column\(\{\s*type:\s*([^,}]+)(?:,|\s*})/g,
        replacement: "@Column({ type: '$1'",
        description: "Fixed Column decorator type quotes"
      }
    ];

    // Pattern 6: Fix TypeScript syntax issues
    const syntaxFixes = [
      // Fix missing semicolons
      {
        pattern: /return\s+([^;]+)(?=\s*})/g,
        replacement: 'return $1;',
        description: "Added missing semicolons to return statements"
      },
      // Fix malformed type annotations
      {
        pattern: /:\s*([^;,}\s]+)"\s*;/g,
        replacement: ': $1;',
        description: "Fixed type annotation quotes"
      },
      // Fix missing closing braces
      {
        pattern: /\{\s*([^}]*)\s*(?=\n\s*[a-zA-Z@])/g,
        replacement: '{ $1 }',
        description: "Fixed missing closing braces"
      }
    ];

    // Apply all fix patterns
    const allFixes = [...importFixes, ...keywordFixes, ...methodFixes, ...stringFixes, ...decoratorFixes, ...syntaxFixes];
    
    for (const fix of allFixes) {
      const beforeCount = (fixedContent.match(fix.pattern) || []).length;
      if (beforeCount > 0) {
        fixedContent = fixedContent.replace(fix.pattern, fix.replacement);
        const afterCount = (fixedContent.match(fix.pattern) || []).length;
        const fixed = beforeCount - afterCount;
        if (fixed > 0) {
          fixCount += fixed;
          this.log(`  ${fix.description}: ${fixed} instances fixed in ${filePath}`);
        }
      }
    }

    // Additional specific fixes for common patterns
    // Fix malformed async function signatures
    fixedContent = fixedContent.replace(
      /async\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(\s*;/g,
      'async $1('
    );

    // Fix missing quotes in string literals
    fixedContent = fixedContent.replace(
      /:\s*([a-zA-Z][a-zA-Z0-9_]*)\s*}/g,
      ": '$1' }"
    );

    // Fix malformed template literals with missing backticks
    fixedContent = fixedContent.replace(
      /([^`])\$\{\s*([^}]+)\s*\}([^`])/g,
      '$1`${$2}`$3'
    );

    return { content: fixedContent, fixCount };
  }

  processFile(filePath) {
    try {
      this.repairStats.filesProcessed++;
      this.log(`Processing file: ${filePath}`);

      if (!fs.existsSync(filePath)) {
        this.log(`File not found: ${filePath}`);
        return false;
      }

      const originalContent = fs.readFileSync(filePath, 'utf8');
      
      // Create backup
      this.createBackup(filePath);

      // Apply repairs
      const { content: repairedContent, fixCount } = this.applyRepairPatterns(originalContent, filePath);

      if (fixCount > 0) {
        fs.writeFileSync(filePath, repairedContent, 'utf8');
        this.repairStats.filesFixed++;
        this.repairStats.patternsFixed += fixCount;
        this.log(`Fixed ${fixCount} patterns in ${filePath}`);
      } else {
        this.log(`No fixes needed for ${filePath}`);
      }

      return true;
    } catch (error) {
      const errorMsg = `Error processing ${filePath}: ${error.message}`;
      this.log(errorMsg);
      this.repairStats.errors.push(errorMsg);
      return false;
    }
  }

  findTypeScriptFiles(directory) {
    const tsFiles = [];
    
    function scanDirectory(dir) {
      try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            // Skip node_modules and other common directories
            if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(item)) {
              scanDirectory(fullPath);
            }
          } else if (item.endsWith('.ts') && !item.endsWith('.d.ts')) {
            tsFiles.push(fullPath);
          }
        }
      } catch (error) {
        console.log(`Error scanning directory ${dir}: ${error.message}`);
      }
    }
    
    scanDirectory(directory);
    return tsFiles;
  }

  async runRepairs() {
    this.log('Starting systematic TypeScript repairs...');

    // Test files first
    const testFiles = [
      'packages/core/src/temp_auth/TokenManager.ts',
      'packages/core/src/temp_models/Agent.ts'
    ];

    this.log('Processing test files first...');
    for (const file of testFiles) {
      this.processFile(file);
    }

    // Process all TypeScript files in packages/core/src
    this.log('Scanning for all TypeScript files...');
    const allTsFiles = this.findTypeScriptFiles('packages/core/src');
    
    this.log(`Found ${allTsFiles.length} TypeScript files to process`);

    // Process remaining files (excluding test files already processed)
    const remainingFiles = allTsFiles.filter(file => !testFiles.includes(file));
    
    for (const file of remainingFiles) {
      this.processFile(file);
    }

    this.generateReport();
  }

  generateReport() {
    const report = `
=== TypeScript Repair Script Report ===
Files Processed: ${this.repairStats.filesProcessed}
Files Fixed: ${this.repairStats.filesFixed}
Total Patterns Fixed: ${this.repairStats.patternsFixed}
Errors Encountered: ${this.repairStats.errors.length}

${this.repairStats.errors.length > 0 ? 'Errors:\n' + this.repairStats.errors.join('\n') : 'No errors encountered.'}

Backup Location: ${this.backupDir}
Log File: ${this.logFile}
=== End Report ===
    `;

    this.log(report);
    console.log('\nRepair script completed!');
    console.log(`See ${this.logFile} for detailed logs`);
    console.log(`Backups stored in: ${this.backupDir}`);
  }

  async testCompilation() {
    this.log('Testing TypeScript compilation...');
    try {
      // Test compilation of the core package
      execSync('cd packages/core && npx tsc --noEmit', { stdio: 'pipe' });
      this.log('TypeScript compilation successful!');
      return true;
    } catch (error) {
      const errorOutput = error.stdout ? error.stdout.toString() : error.message;
      this.log(`TypeScript compilation failed: ${errorOutput}`);
      return false;
    }
  }
}

// Run the repair script
async function main() {
  const repairScript = new TypeScriptRepairScript();
  
  try {
    await repairScript.runRepairs();
    
    // Test compilation after repairs
    console.log('\nTesting TypeScript compilation...');
    const compilationSuccess = await repairScript.testCompilation();
    
    if (compilationSuccess) {
      console.log('✅ All repairs completed successfully and TypeScript compilation passed!');
    } else {
      console.log('⚠️  Repairs completed but TypeScript compilation still has issues. Check the log for details.');
    }
  } catch (error) {
    console.error('Repair script failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = TypeScriptRepairScript;