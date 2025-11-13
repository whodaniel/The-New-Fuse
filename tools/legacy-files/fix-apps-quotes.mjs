#!/usr/bin/env node

import fs from "fs";
import path from "path";

const appsDir = "./apps";
let fixedFiles = 0;
let totalFixes = 0;

function applyQuoteFixes(content) {
  let fixed = content;
  let fixCount = 0;

  // Basic quote corruption patterns
  const patterns = [
    // Import statement fixes
    [/import\s+'([^']+)';?"/g, "import '$1';"],
    [/import\s+"([^"]+)";?'/g, 'import "$1";'],
    [/import\s+([^'"]+)"/g, "import '$1';"],
    [/import\s+([^'"]+)'/g, "import '$1';"],
    [/from\s+'([^']+)";/g, "from '$1';"],
    [/from\s+"([^"]+)';/g, 'from "$1";'],

    // String literal fixes
    [/'([^']*)"([^"]*)'([^']*)/g, "'$1$2$3'"],
    [/"([^"]*)'([^']*)"([^"]*)/g, '"$1$2$3"'],
    [/([^\\])'''/g, "$1'"],
    [/([^\\])"""/g, '$1"'],
    [/^'''/g, "'"],
    [/^"""/g, '"'],

    // Template literal fixes
    [/`([^`]*)'([^']*)`/g, "`$1$2`"],
    [/`([^`]*)"([^"]*)`/g, "`$1$2`"],

    // Object property fixes
    [/(\w+):\s*([^'",\}\]]+)';/g, "$1: '$2';"],
    [/(\w+):\s*([^'",\}\]]+)";/g, '$1: "$2";'],

    // Function parameter fixes
    [/\(\s*([^)]*)'([^']*)\s*\)/g, "($1$2)"],
    [/\(\s*([^)]*)"([^"]*)\s*\)/g, "($1$2)"],

    // Array element fixes
    [/\[\s*([^,\]]*)'([^']*)\s*\]/g, "[$1$2]"],
    [/\[\s*([^,\]]*)"([^"]*)\s*\]/g, "[$1$2]"],

    // More specific patterns
    [/status:\s*active\s*,/g, "status: 'active',"],
    [/status:\s*inactive\s*,/g, "status: 'inactive',"],
    [/status:\s*error\s*,/g, "status: 'error',"],
    [/return\s*instance"/g, "return instance;"],
    [/return\s*([^;'"]+)"/g, "return $1;"],
    [/throw\s+new\s+Error\(([^)]+)\)"/g, "throw new Error($1);"],

    // Fix hanging quotes and semicolons
    [/([^'";])\s*'\s*$/gm, "$1"],
    [/([^'";])\s*"\s*$/gm, "$1"],
    [/;\s*'/g, ";"],
    [/;\s*"/g, ";"],
    [/'\s*;/g, ";"],
    [/"\s*;/g, ";"],

    // Fix export/class declarations
    [/@Injectable\(\)\s*;/g, "@Injectable()"],
    [/export\s+class\s+([^{]+)\s*"/g, "export class $1"],
    [/export\s+interface\s+([^{]+)\s*"/g, "export interface $1"],

    // Fix type annotations
    [/:\s*([^,\}>\);]+)\s*";/g, ": $1;"],
    [/:\s*([^,\}>\);]+)\s*';/g, ": $1;"],

    // Fix method signatures
    [/async\s+([^(]+)\(([^)]*)\):\s*([^{]+)\s*"/g, "async $1($2): $3"],
    [/([^:]+)\(([^)]*)\):\s*([^{]+)\s*"/g, "$1($2): $3"],
  ];

  patterns.forEach(([pattern, replacement]) => {
    const newFixed = fixed.replace(pattern, replacement);
    if (newFixed !== fixed) {
      fixCount++;
      fixed = newFixed;
    }
  });

  return { content: fixed, fixes: fixCount };
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const { content: fixedContent, fixes } = applyQuoteFixes(content);

    if (fixes > 0) {
      fs.writeFileSync(filePath, fixedContent, "utf-8");
      fixedFiles++;
      totalFixes += fixes;
      console.log(`Fixed ${fixes} issues in ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

function processDirectory(dirPath) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (
        entry.isDirectory() &&
        !entry.name.startsWith(".") &&
        entry.name !== "node_modules"
      ) {
        processDirectory(fullPath);
      } else if (
        entry.isFile() &&
        (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))
      ) {
        processFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error.message);
  }
}

console.log("Starting comprehensive quote fix for apps directory...");
processDirectory(appsDir);
console.log(
  `\nComplete! Fixed ${totalFixes} issues across ${fixedFiles} files.`,
);
