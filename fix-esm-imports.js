import fs from 'fs';
import path from 'path';

const targetDirs = ['packages', 'apps'];

function isDirectory(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.isDirectory();
  } catch (e) {
    return false;
  }
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function isEsmDirectory(dirPath) {
    if (!isDirectory(dirPath)) return false;
    return fileExists(path.join(dirPath, 'index.ts')) || 
           fileExists(path.join(dirPath, 'index.tsx')) ||
           fileExists(path.join(dirPath, 'index.js'));
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Regex for relative imports/exports - using [\s\S] to match across newlines
  const regex = /(import|export)([\s\S]*?)from\s+['"](\.\.?\/.*?)['"]/g;

  const newContent = content.replace(regex, (match, type, rest, importPath) => {
    const dir = path.dirname(filePath);
    
    // Normalize pathWithoutJs by removing .js ONLY IF it was there
    let pathWithoutJs = importPath;
    let hadJs = false;
    if (importPath.endsWith('.js')) {
      pathWithoutJs = importPath.slice(0, -3);
      hadJs = true;
    }
    
    let absolutePathWithoutJs = path.resolve(dir, pathWithoutJs);

    if (isEsmDirectory(absolutePathWithoutJs)) {
      // It's a directory
      const newImportPath = pathWithoutJs.endsWith('/') ? `${pathWithoutJs}index.js` : `${pathWithoutJs}/index.js`;
      if (importPath !== newImportPath) {
        changed = true;
        return `${type}${rest}from '${newImportPath}'`;
      }
    } else {
      // It's not a directory
      if (!hadJs) {
         let absolutePath = path.resolve(dir, importPath);
         if (fileExists(absolutePath + '.ts') || fileExists(absolutePath + '.tsx') || fileExists(absolutePath + '.js')) {
            changed = true;
            return `${type}${rest}from '${importPath}.js'`;
         }
      }
    }

    return match;
  });

  if (changed) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (file === 'node_modules' || file === 'dist' || file === '.git') continue;
    
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      if (!fullPath.endsWith('.d.ts')) {
        processFile(fullPath);
      }
    }
  }
}

targetDirs.forEach(dir => {
  const absDir = path.resolve('/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse', dir);
  if (fs.existsSync(absDir)) {
    walk(absDir);
  }
});
