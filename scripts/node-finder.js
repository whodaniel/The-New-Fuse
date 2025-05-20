/**
 * Node-based file analyzer for The New Fuse
 * 
 * This script provides a pure JavaScript implementation of file analysis
 * without relying on external shell commands that might have issues with spaces in paths.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

const PROJECT_ROOT = path.resolve(__dirname, '..');

// Directories to exclude
const EXCLUDE_DIRS = ['node_modules', '.git', 'dist', 'build', 'coverage', 'cleanup-backups', 'reports'];

// Extensions to include
const INCLUDE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

async function walkDirectory(dir, fileCallback) {
  try {
    const entries = await readdir(dir);
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      
      try {
        const stats = await stat(fullPath);
        
        if (stats.isDirectory()) {
          if (!EXCLUDE_DIRS.includes(entry) && !EXCLUDE_DIRS.some(d => fullPath.includes(`/${d}/`))) {
            await walkDirectory(fullPath, fileCallback);
          }
        } else if (stats.isFile() && INCLUDE_EXTENSIONS.includes(path.extname(fullPath))) {
          await fileCallback(fullPath);
        }
      } catch (error) {
        console.error(`Error processing ${fullPath}:`, error.message);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
}

async function findExportingFiles() {
  
  const exportingFiles = [];
  
  await walkDirectory(PROJECT_ROOT, async (filePath) => {
    try {
      const content = await readFile(filePath, 'utf8');
      if (content.includes('export ') || content.includes('export{') || content.includes('export default')) {
        exportingFiles.push(filePath);
      }
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error.message);
    }
  });

  return exportingFiles;
}

async function findUnusedFiles() {

  const exportingFiles = await findExportingFiles();
  const unusedFiles = [];
  
  // Create a map of imports across all files
  const imports = new Map();
  
  // First, collect all imports
  await walkDirectory(PROJECT_ROOT, async (filePath) => {
    try {
      const content = await readFile(filePath, 'utf8');
      const importMatches = content.matchAll(/import\s+(?:(?:\{[^}]*\})|(?:[^{}\s]+))\s+from\s+['"]([^'"]+)['"]/g);
      
      for (const match of importMatches) {
        const importPath = match[1];
        if (!imports.has(importPath)) {
          imports.set(importPath, []);
        }
        imports.get(importPath).push(filePath);
      }
    } catch (error) {
      console.error(`Error scanning imports in ${filePath}:`, error.message);
    }
  });
  
  // Now check each exporting file to see if it's imported
  for (const file of exportingFiles) {
    // Skip index files
    if (path.basename(file) === 'index.js' || path.basename(file) === 'index.ts') {
      continue;
    }
    
    let isImported = false;
    const relativePaths = getRelativePaths(file);
    
    for (const [importPath, importingFiles] of imports.entries()) {
      if (relativePaths.some(rp => importPath.includes(rp))) {
        isImported = true;
        break;
      }
    }
    
    if (!isImported) {
      unusedFiles.push(file);
    }
  }

  // Write to file
  if (unusedFiles.length > 0) {
    await writeFile(
      path.join(PROJECT_ROOT, 'unused-files-node.txt'),
      unusedFiles.join('\n'),
      'utf8'
    );
    
  }
  
  return unusedFiles;
}

// Helper to get possible relative paths for a file
function getRelativePaths(filePath) {
  const ext = path.extname(filePath);
  const baseName = path.basename(filePath, ext);
  const dir = path.dirname(filePath);
  
  // Remove project root for relative paths
  const relativePath = path.relative(PROJECT_ROOT, dir);
  
  return [
    baseName,
    path.join(relativePath, baseName),
    `./${path.join(relativePath, baseName)}`,
    `../${path.join(relativePath, baseName)}`
  ];
}

async function main() {

  await findUnusedFiles();

}

main().catch(console.error);
