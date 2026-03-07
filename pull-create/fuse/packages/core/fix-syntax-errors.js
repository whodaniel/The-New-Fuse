const fs = require('fs');
const path = require('path');

// Common syntax error patterns to fix
const fixes = [
  // Fix malformed import paths
  { pattern: /import\s+.*?\s+from\s+['"]\/\.\/([^'"]+)['"];?/g, replacement: "import $1 from './$1';" },
  { pattern: /import\s+.*?\s+from\s+['"]\/([^'"]+)['"];?/g, replacement: "import $1 from '$1';" },
  
  // Fix unterminated strings
  { pattern: /(['"])[^'"]*$/gm, replacement: "$1" },
  
  // Fix double backticks
  { pattern: /``/g, replacement: '`' },
  
  // Fix common quote issues
  { pattern: /';$/gm, replacement: "';" },
  { pattern: /";$/gm, replacement: '";' },
  
  // Fix template literal issues
  { pattern: /`([^`]*)``;/g, replacement: '`$1`;' }
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    fixes.forEach(fix => {
      const newContent = content.replace(fix.pattern, fix.replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      walkDirectory(filePath);
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      fixFile(filePath);
    }
  });
}

// Start from src directory
const srcDir = path.join(__dirname, 'src');
walkDirectory(srcDir);
console.log('Syntax fixes complete!');