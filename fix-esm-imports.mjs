import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PACKAGES = [
  "types", "database", "api-types", "utils", "common", "infrastructure", 
  "ap2-protocol", "a2a-core", "core-error-handling", "core-monitoring", 
  "core-vector-db", "api-client", "security", "mcp-core", "n8n-workflows", 
  "relay-core", "hooks", "ui-consolidated", "port-management", 
  "prompt-templating", "core", "shared"
];

const APPS = ["api", "backend", "api-gateway"];

const BASE_DIR = __dirname;

function resolvePath(currentFile, relativePath) {
  const absolutePath = path.resolve(path.dirname(currentFile), relativePath);
  
  // 1. If path has extension, return null (skip)
  const ext = path.extname(relativePath);
  if (ext && [".js", ".json", ".css", ".scss", ".ts", ".tsx", ".mjs", ".cjs"].includes(ext)) {
    return null;
  }

  // 2. Check if it's a directory
  if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isDirectory()) {
    if (fs.existsSync(path.join(absolutePath, "index.ts"))) {
      return relativePath.endsWith("/") ? "index.js" : "/index.js";
    }
    if (fs.existsSync(path.join(absolutePath, "index.tsx"))) {
      return relativePath.endsWith("/") ? "index.js" : "/index.js";
    }
  }

  // 3. Check if it's a file
  if (fs.existsSync(absolutePath + ".ts") || fs.existsSync(absolutePath + ".tsx")) {
    return ".js";
  }

  return null;
}

function fixImports(content, filePath) {
  let fixed = content;
  let changes = 0;

  // Pattern 1: import/export ... from './path'
  // Handles:
  // import { x } from './y'
  // import x from './y'
  // export { x } from './y'
  // export * from './y'
  const fromPattern = /((?:import|export)\s+[\s\S]*?\s+from\s+['"])(\.\.?\/[^'"]*)(['"])/g;
  fixed = fixed.replace(fromPattern, (match, prefix, relPath, suffix) => {
    const addition = resolvePath(filePath, relPath);
    if (addition) {
      changes++;
      return `${prefix}${relPath}${addition}${suffix}`;
    }
    return match;
  });

  // Pattern 2: import './path'
  const sideEffectPattern = /(import\s+['"])(\.\.?\/[^'"]*)(['"])/g;
  fixed = fixed.replace(sideEffectPattern, (match, prefix, relPath, suffix) => {
    // Only match if it's NOT part of Pattern 1 (which has 'from')
    // A simple way is to check if 'from' is just before this match, but regex above handles it.
    // Wait, Pattern 1 might overlap. Let's use a more specific check.
    if (match.includes(" from ")) return match; 
    
    const addition = resolvePath(filePath, relPath);
    if (addition) {
      changes++;
      return `${prefix}${relPath}${addition}${suffix}`;
    }
    return match;
  });

  return { content: fixed, changes };
}

function processDirectory(dir) {
  if (!fs.existsSync(dir)) {
    console.warn(`Directory not found: ${dir}`);
    return 0;
  }

  const files = fs.readdirSync(dir);
  let totalChanges = 0;

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (file !== "node_modules" && !file.startsWith(".")) {
        totalChanges += processDirectory(filePath);
      }
    } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      const content = fs.readFileSync(filePath, "utf8");
      const result = fixImports(content, filePath);

      if (result.changes > 0) {
        fs.writeFileSync(filePath, result.content);
        console.log(`Fixed ${result.changes} imports in ${filePath}`);
        totalChanges += result.changes;
      }
    }
  });

  return totalChanges;
}

console.log("Starting ESM import fix...");

let grandTotal = 0;

PACKAGES.forEach(pkg => {
  const pkgSrc = path.join(BASE_DIR, "packages", pkg, "src");
  console.log(`Processing package: ${pkg}`);
  grandTotal += processDirectory(pkgSrc);
});

APPS.forEach(app => {
  const appSrc = path.join(BASE_DIR, "apps", app, "src");
  console.log(`Processing app: ${app}`);
  grandTotal += processDirectory(appSrc);
});

console.log(`\nFinished! Total changes: ${grandTotal}`);
