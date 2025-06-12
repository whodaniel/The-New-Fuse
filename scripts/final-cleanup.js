/**
 * Final Cleanup Script for The New Fuse
 */

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

// ES modules don't have __dirname, so we need to create it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const mkdir = promisify(fs.mkdir);
const execPromise = promisify(exec);
const unlink = promisify(fs.unlink);

// Files to exclude from processing
const EXCLUDE_DIRS = ['node_modules', '.git', 'dist', 'build', 'coverage', 'cleanup-backups', 'reports'];
const PROCESSABLE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

// Create a backup directory
const BACKUP_DIR = path.join(PROJECT_ROOT, 'cleanup-backups');

async function ensureBackupDir() {
  try {
    await stat(BACKUP_DIR);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await mkdir(BACKUP_DIR, { recursive: true });
      
    } else {
      throw error;
    }
  }
}

async function walkDir(dir, fileCallback) {
  try {
    const entries = await readdir(dir);
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      
      try {
        const stats = await stat(fullPath);
        
        if (stats.isDirectory()) {
          // Check if directory path contains any excluded directory
          if (!EXCLUDE_DIRS.some(excludeDir => 
              fullPath.includes(`/${excludeDir}/`) || entry === excludeDir)) {
            await walkDir(fullPath, fileCallback);
          } else {
            
          }
        } else if (stats.isFile()) {
          const ext = path.extname(fullPath);
          if (PROCESSABLE_EXTENSIONS.includes(ext)) {
            await fileCallback(fullPath);
          }
        }
      } catch (error) {
        console.error(`Error processing ${fullPath}:`, error.message);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
}

async function backupFile(filePath) {
  const relativePath = path.relative(PROJECT_ROOT, filePath);
  const backupPath = path.join(BACKUP_DIR, relativePath);
  const backupDir = path.dirname(backupPath);
  
  try {
    // Create the directory structure in the backup folder
    await mkdir(backupDir, { recursive: true });
    
    // Copy the file content
    const content = await readFile(filePath, 'utf8');
    await writeFile(backupPath, content, 'utf8');
  } catch (error) {
    console.error(`Error backing up file ${filePath}:`, error.message);
  }
}

async function cleanupFile(filePath) {
  try {

    // Backup the file before modifying
    await backupFile(filePath);
    
    let content = await readFile(filePath, 'utf8');
    let originalSize = content.length;
    
    // Original content backup for comparison
    const originalContent = content;
    
    // Remove commented out code (more carefully)
    // Only remove TODO comments, preserving other comments
    content = content.replace(/\/\/\s*TODO.*$/gm, '');
    content = content.replace(/\/\*\s*TODO[\s\S]*?\*\//g, '');
    
    // Remove console.log statements more comprehensively
    // This handles multi-line console.logs and various argument patterns
    content = content.replace(/console\.log\s*\(\s*[\s\S]*?\)\s*;?/g, '');
    
    // Standardize import syntax with more robust patterns
    content = content.replace(
      /const\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\)\s*;?/g, 
      'import $1 from \'$2\';'
    );
    
    // Handle destructured requires
    content = content.replace(
      /const\s+\{\s*([^}]+)\s*\}\s*=\s*require\(['"]([^'"]+)['"]\)\s*;?/g,
      'import { $1 } from \'$2\';'
    );
    
    // Remove multiple consecutive empty lines
    content = content.replace(/\n\s*\n\s*\n+/g, '\n\n');
    
    // Only write if changes were made
    if (content !== originalContent) {
      await writeFile(filePath, content, 'utf8');
      const newSize = content.length;
      const reduction = ((originalSize - newSize) / originalSize * 100).toFixed(2);
      `);
    } else {
      
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error.message);
  }
}

async function findUnusedImports() {

  try {
    // Direct file-by-file approach instead of using grep
    const unusedImports = [];
    
    await walkDir(PROJECT_ROOT, async (filePath) => {
      try {
        const content = await readFile(filePath, 'utf8');
        
        // Extract imports
        const importMatches = [...content.matchAll(/import\s+(?:{([^}]+)}|(\w+))\s+from\s+['"]([^'"]+)['"]/g)];
        
        for (const match of importMatches) {
          const namedImports = match[1];
          const defaultImport = match[2];
          
          if (namedImports) {
            // Handle named imports
            const imports = namedImports.split(',').map(i => i.trim().split(' as ')[0].trim());
            
            for (const importName of imports) {
              // Skip React and common imports
              if (['React', 'Component', 'Fragment'].includes(importName)) continue;
              
              // Remove the import declaration to check usage elsewhere
              const contentWithoutImport = content.replace(match[0], '');
              
              // Look for usage with word boundary to avoid partial matches
              const regex = new RegExp(`\\b${importName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
              if (!regex.test(contentWithoutImport)) {
                unusedImports.push({ file: filePath, import: importName });
              }
            }
          } else if (defaultImport) {
            // Handle default import
            // Skip React and common imports
            if (['React', 'Component', 'Fragment'].includes(defaultImport)) continue;
            
            // Remove the import declaration to check usage elsewhere
            const contentWithoutImport = content.replace(match[0], '');
            
            // Look for usage with word boundary
            const regex = new RegExp(`\\b${defaultImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
            if (!regex.test(contentWithoutImport)) {
              unusedImports.push({ file: filePath, import: defaultImport });
            }
          }
        }
      } catch (error) {
        console.error(`Error analyzing imports in ${filePath}:`, error.message);
      }
    });
    
    if (unusedImports.length > 0) {

      // Group by file for better readability
      const byFile = {};
      unusedImports.forEach(({ file, import: importItem }) => {
        if (!byFile[file]) byFile[file] = [];
        byFile[file].push(importItem);
      });
      
      // Write to a file for review
      const reportContent = Object.entries(byFile)
        .map(([file, imports]) => `${file}:\n  ${imports.join(', ')}`)
        .join('\n\n');
        
      await writeFile(path.join(PROJECT_ROOT, 'unused-imports.txt'), reportContent, 'utf8');
      
    } else {
      
    }
  } catch (error) {
    console.error('Error analyzing unused imports:', error.message);
  }
}

async function findUnusedFiles() {

  try {
    // Use the pure Node.js implementation from node-finder.js
    const exportingFiles = [];
    const imports = new Map();
    
    // First pass: find all exporting files and collect imports
    await walkDir(PROJECT_ROOT, async (filePath) => {
      try {
        const content = await readFile(filePath, 'utf8');
        
        // Check if file has exports
        if (content.includes('export ') || content.includes('export{') || content.includes('export default')) {
          exportingFiles.push(filePath);
        }
        
        // Collect imports
        const importMatches = [...content.matchAll(/import\s+(?:(?:{[^}]*})|(?:[^{}\s]+))\s+from\s+['"]([^'"]+)['"]/g)];
        for (const match of importMatches) {
          const importPath = match[1];
          if (!imports.has(importPath)) {
            imports.set(importPath, []);
          }
          imports.get(importPath).push(filePath);
        }
      } catch (error) {
        console.error(`Error scanning file ${filePath}:`, error.message);
      }
    });

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
    
    // Second pass: check which exporting files are not imported
    const unusedFiles = [];
    
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
    
    if (unusedFiles.length > 0) {

      // Write to a file for review
      await writeFile(
        path.join(PROJECT_ROOT, 'unused-files.txt'),
        unusedFiles.join('\n'),
        'utf8'
      );
      
    } else {
      
    }
  } catch (error) {
    console.error('Error detecting unused files:', error.message);
  }
}

async function main() {
  try {
    
    );
    
    // Ensure backup directory exists
    await ensureBackupDir();
    
    // Process all files
    
    await walkDir(PROJECT_ROOT, cleanupFile);
    
    // Find potentially unused imports
    
    await findUnusedImports();
    
    // Find potentially unused files
    
    await findUnusedFiles();

  } catch (error) {
    console.error('Error during cleanup process:', error.message);
  }
}

main().catch(error => {
  console.error('Fatal error during cleanup:', error);
  process.exit(1);
});
