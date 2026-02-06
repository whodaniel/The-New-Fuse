#!/usr/bin/env node
/**
 * Script to convert CommonJS-compiled TypeScript files back to ES modules
 * These files were accidentally committed as compiled JS with .ts extensions
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SRC_DIR = path.join(__dirname, '../src');

function convertCommonJSToESM(content) {
  let fixed = content;

  // Remove the exports object initialization line
  fixed = fixed.replace(/^exports\.\w+ = exports\.\w+ = void 0;\n?/gm, '');

  // Remove module.exports assignments and convert to export
  fixed = fixed.replace(/^module\.exports = /gm, 'export default ');

  // Convert exports.ClassName = ClassName; to export { ClassName };
  fixed = fixed.replace(/^exports\.(\w+) = \1;?\n?/gm, '');

  // Remove export {} lines (artifacts)
  fixed = fixed.replace(/^export \{\}\n?/gm, '');

  // Remove source map comments
  fixed = fixed.replace(/^\/\/# sourceMappingURL=.*/gm, '');

  // Add export keyword to class/function declarations that were exported via exports.X
  const exportedNames = [];
  const exportsPattern = /exports\.(\w+) = /g;
  let match;
  while ((match = exportsPattern.exec(content)) !== null) {
    exportedNames.push(match[1]);
  }

  // Add export keyword to declarations
  exportedNames.forEach((name) => {
    fixed = fixed.replace(
      new RegExp(`^(class|function|const|let|var) ${name}\\b`, 'gm'),
      `export $1 ${name}`
    );
  });

  // Convert require() to import statements
  fixed = fixed.replace(
    /^(?:const|let|var) (\w+) = require\(['"]([^'"]+)['"]\);?/gm,
    "import $1 from '$2';"
  );

  // Convert named imports from CommonJS
  fixed = fixed.replace(
    /^(?:const|let|var) \{([^}]+)\} = require\(['"]([^'"]+)['"]\);?/gm,
    "import {$1} from '$2';"
  );

  // Clean up any remaining exports.X =
  fixed = fixed.replace(/^exports\.\w+ = .*$/gm, '');

  // Remove multiple blank lines
  fixed = fixed.replace(/\n{3,}/g, '\n\n');

  // Trim
  fixed = fixed.trim() + '\n';

  return fixed;
}

function findFilesWithCommonJS(dir) {
  const files = [];

  function traverse(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        traverse(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('exports.') || content.match(/^module\.exports/m)) {
          files.push(fullPath);
        }
      }
    }
  }

  traverse(dir);
  return files;
}

function main() {
  console.log('🔍 Scanning for CommonJS artifacts in TypeScript files...\n');

  const files = findFilesWithCommonJS(SRC_DIR);

  if (files.length === 0) {
    console.log('✅ No CommonJS artifacts found!');
    return;
  }

  console.log(`Found ${files.length} files with CommonJS artifacts:\n`);

  let fixedCount = 0;
  let errorCount = 0;

  for (const filePath of files) {
    const relativePath = path.relative(process.cwd(), filePath);

    try {
      const original = fs.readFileSync(filePath, 'utf8');
      const fixed = convertCommonJSToESM(original);

      if (fixed !== original) {
        fs.writeFileSync(filePath, fixed, 'utf8');
        console.log(`✅ Fixed: ${relativePath}`);
        fixedCount++;
      } else {
        console.log(`⏭️  Skipped (no changes): ${relativePath}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${relativePath}: ${error.message}`);
      errorCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Fixed: ${fixedCount}`);
  console.log(`   Errors: ${errorCount}`);
  console.log(`   Total: ${files.length}`);

  if (fixedCount > 0) {
    console.log('\n⚠️  Note: These files may still need manual type annotations.');
    console.log('   Run `pnpm run type-check` to see remaining issues.');
  }
}

main();
