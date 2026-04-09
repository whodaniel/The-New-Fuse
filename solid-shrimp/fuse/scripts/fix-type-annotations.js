import fs from 'fs';
import path from 'path';

function fixTypeAnnotations(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = content;

  // Fix 1: Move type annotations from expressions to declarations
  updated = updated.replace(
    /const\s+([a-zA-Z0-9_]+)\s*=\s*([^:]+):\s*([^=]+)=/g,
    'const $1: $3 = $2'
  );

  // Fix 2: Fix function return type annotations
  updated = updated.replace(
    /function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*([^{]*)\{/g,
    (match, name, params, rest) => {
      // Move return type before the brace
      const returnType = rest.match(/:\s*([^{]+)/);
      if (returnType) {
        return `function ${name}(${params}): ${returnType[1].trim()} {`;
      }
      return match;
    }
  );

  // Fix 3: Fix arrow function type annotations
  updated = updated.replace(
    /const\s+([a-zA-Z0-9_]+)\s*=\s*(\([^)]*\))\s*([^=]*=>\s*)/g,
    (match, name, params, arrow) => {
      const returnType = arrow.match(/:\s*([^=]+)=>/);
      if (returnType) {
        return `const ${name} = ${params}: ${returnType[1].trim()} =>`;
      }
      return match;
    }
  );

  // Fix 4: Fix class method type annotations
  updated = updated.replace(
    /(\w+)\s*\(([^)]*)\)\s*([^{]*)\{/g,
    (match, name, params, rest) => {
      if (name === 'constructor') return match;
      const returnType = rest.match(/:\s*([^{]+)/);
      if (returnType) {
        return `${name}(${params}): ${returnType[1].trim()} {`;
      }
      return match;
    }
  );

  if (content !== updated) {
    fs.writeFileSync(filePath, updated);
    return true;
  }
  return false;
}

function main() {
  const extensions = ['.ts', '.tsx'];
  const srcDir = path.join(process.cwd(), 'src');
  
  // Check if src directory exists
  if (!fs.existsSync(srcDir)) {
    console.error(`Error: The src directory does not exist at ${srcDir}`);
    
    process.exit(1);
  }
  
  let filesFixed = 0;
  
  function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        processDirectory(fullPath);
      } else if (extensions.includes(path.extname(file))) {
        if (fixTypeAnnotations(fullPath)) {
          
          filesFixed++;
        }
      }
    }
  }

  processDirectory(srcDir);
  
}

main();

