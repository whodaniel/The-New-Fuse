#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

const workspaceRoot = process.cwd();

// Function to fix quote corruption in a file
function fixQuotesInFile(filePath) {
  try {
    let content = readFileSync(filePath, "utf8");
    let originalContent = content;

    // Basic quote fixes
    content = content.replace(/';'/g, "'");
    content = content.replace(/";"/g, '"');
    content = content.replace(/'';/g, "';");
    content = content.replace(/"";/g, '";');
    content = content.replace(/'''/g, "'");
    content = content.replace(/"""/g, '"');
    content = content.replace(/'''''/g, "'");
    content = content.replace(/"""""/g, '"');

    // Fix missing quotes in strings
    content = content.replace(/= test;/g, "= 'test';");
    content = content.replace(/NODE_ENV = test/g, "NODE_ENV = 'test'");
    content = content.replace(
      /JWT_SECRET=.*?test-secret;/g,
      "JWT_SECRET = 'test-secret';",
    );
    content = content.replace(
      /DATABASE_URL=.*?postgresql:.*?;/g,
      "DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/fuse_test';",
    );
    content = content.replace(
      /REDIS_URL = redis:.*?;/g,
      "REDIS_URL = 'redis://localhost:6379/1';",
    );

    // Fix import statements
    content = content.replace(
      /import\s+['"]([^'"]+)['"];\s*['"]/g,
      "import '$1';",
    );
    content = content.replace(/from\s+['"]([^'"]+)['"];\s*['"]/g, "from '$1';");

    // Fix semicolon issues
    content = content.replace(/,;/g, ",");
    content = content.replace(/;'/g, ";");
    content = content.replace(/;"/g, ";");

    if (content !== originalContent) {
      writeFileSync(filePath, content, "utf8");
      console.log(`Fixed quotes in: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Function to recursively process files
function processDirectory(dirPath) {
  try {
    const items = readdirSync(dirPath);

    for (const item of items) {
      const fullPath = join(dirPath, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip node_modules and other unnecessary directories
        if (
          !item.startsWith(".") &&
          item !== "node_modules" &&
          item !== "dist" &&
          item !== "build" &&
          item !== "coverage"
        ) {
          processDirectory(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = extname(item);
        if ([".ts", ".tsx", ".js", ".jsx"].includes(ext)) {
          fixQuotesInFile(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dirPath}:`, error.message);
  }
}

console.log("Starting comprehensive quote fix...");

// Process key directories
const dirsToProcess = ["apps", "packages"];

for (const dir of dirsToProcess) {
  const dirPath = join(workspaceRoot, dir);
  try {
    if (statSync(dirPath).isDirectory()) {
      console.log(`Processing ${dir}...`);
      processDirectory(dirPath);
    }
  } catch (error) {
    console.log(`Directory ${dir} not found, skipping...`);
  }
}

console.log("Quote fix completed!");
