#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// Fix common syntax patterns in TypeScript files
function fixSyntaxErrors(content, filePath) {
  let fixed = content;
  let changes = [];

  // Fix corrupted import statements
  const beforeImports = fixed;
  fixed = fixed.replace(/import\s+([^'";]+)[';]+/g, (match, importPath) => {
    if (match.includes("'") && !match.match(/';$/)) {
      return match.replace(/[';]+$/, "';");
    }
    if (match.includes('"') && !match.match(/";$/)) {
      return match.replace(/[";]+$/, '";');
    }
    return match;
  });

  // Fix broken import statements like 'import fs';'
  fixed = fixed.replace(/import\s+(\w+)[';]+\s*$/gm, "import $1 from '$1';");
  fixed = fixed.replace(/import\s+\.\w*[^'";]*[';]+/g, (match) => {
    const path = match.match(/\.\S+/)?.[0];
    if (path) {
      return `import '${path}';`;
    }
    return match;
  });

  if (fixed !== beforeImports) {
    changes.push("Fixed import statements");
  }

  // Fix unterminated string literals
  const beforeStrings = fixed;
  fixed = fixed.replace(/(['"]).+?[';]*\s*$/gm, (match) => {
    const quote = match[0];
    if (
      match.includes(quote + ";") ||
      match.includes(quote + "'") ||
      match.includes(quote + '"')
    ) {
      return match.replace(/[';]*$/, quote + ";");
    }
    return match;
  });

  if (fixed !== beforeStrings) {
    changes.push("Fixed unterminated string literals");
  }

  // Fix template literal syntax errors
  const beforeTemplates = fixed;
  fixed = fixed.replace(/\`[^`]*\`[`;"';]*$/gm, (match) => {
    return match.replace(/[`;"';]*$/, "`;");
  });

  if (fixed !== beforeTemplates) {
    changes.push("Fixed template literal syntax");
  }

  // Fix object and array syntax errors
  const beforeObjects = fixed;
  fixed = fixed.replace(/,;/g, ",");
  fixed = fixed.replace(/;;/g, ";");
  fixed = fixed.replace(/\}\}[`"';]*$/gm, "}");

  if (fixed !== beforeObjects) {
    changes.push("Fixed object/array syntax");
  }

  // Fix function parameter syntax
  const beforeParams = fixed;
  fixed = fixed.replace(/\([^)]*,;\s*\)/g, (match) => {
    return match.replace(/,;\s*\)/, ")");
  });

  if (fixed !== beforeParams) {
    changes.push("Fixed function parameters");
  }

  // Fix enum syntax errors
  const beforeEnums = fixed;
  fixed = fixed.replace(/=\s*['"]([^'"]*)[';]+$/gm, '= "$1"');

  if (fixed !== beforeEnums) {
    changes.push("Fixed enum syntax");
  }

  return { content: fixed, changes };
}

// Find TypeScript files with highest error counts
function findTSFiles(dir) {
  const files = [];

  function traverse(currentDir) {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (
          entry.isDirectory() &&
          !entry.name.startsWith(".") &&
          entry.name !== "node_modules"
        ) {
          traverse(fullPath);
        } else if (
          entry.isFile() &&
          entry.name.endsWith(".ts") &&
          !entry.name.endsWith(".d.ts")
        ) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not read directory ${currentDir}`);
    }
  }

  traverse(dir);
  return files;
}

// Main execution
const coreDir =
  "/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/packages/core/src";
const tsFiles = findTSFiles(coreDir);

console.log(
  `🔍 Found ${tsFiles.length} TypeScript files. Fixing syntax errors...`,
);

let totalFixed = 0;
let totalChanges = 0;

for (const file of tsFiles) {
  try {
    const content = fs.readFileSync(file, "utf8");
    const result = fixSyntaxErrors(content, file);

    if (result.changes.length > 0) {
      fs.writeFileSync(file, result.content);
      console.log(
        `✅ Fixed ${path.relative(coreDir, file)}: ${result.changes.join(", ")}`,
      );
      totalFixed++;
      totalChanges += result.changes.length;
    }
  } catch (error) {
    console.warn(`⚠️  Could not process ${file}: ${error.message}`);
  }
}

console.log(
  `\n🎉 Completed! Fixed ${totalFixed} files with ${totalChanges} total changes.`,
);
console.log("🔄 Running type check to verify fixes...");

try {
  execSync("bun run type-check", {
    cwd: "/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/packages/core",
    stdio: "inherit",
  });
  console.log("✅ Type check passed!");
} catch (error) {
  console.log("❌ Some type errors remain. Check output above.");
}
