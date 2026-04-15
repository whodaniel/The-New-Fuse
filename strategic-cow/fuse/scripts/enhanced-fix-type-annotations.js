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

  // Fix 5: Fix interface property type annotations
  updated = updated.replace(
    /interface\s+(\w+)\s*\{([^}]*)\}/gs,
    (match, name, properties) => {
      // Fix properties with incorrect type annotations
      const fixedProperties = properties.replace(
        /(\w+)\s*=\s*([^;]+):\s*([^;]+);/g,
        '$1: $3 = $2;'
      );
      return `interface ${name} {${fixedProperties}}`;
    }
  );

  // Fix 6: Fix React component type annotations
  updated = updated.replace(
    /const\s+(\w+)\s*:\s*React\.FC\s*=\s*\(([^)]*)\)\s*=>\s*\{/g,
    (match, name, params) => {
      if (!params.includes(':')) {
        return `const ${name}: React.FC<{ ${params.trim() || ''}: any }> = (${params}) => {`;
      }
      return match;
    }
  );

  // Fix 7: Fix type assertions
  updated = updated.replace(
    /\(this as any\)\.([a-zA-Z0-9_]+)/g,
    'this.$1'
  );

  // Fix 8: Fix missing parameter types
  updated = updated.replace(
    /function\s+(\w+)\s*\(([^\):]+)\)\s*\{/g,
    (match, name, params) => {
      if (!params.includes(':')) {
        const paramList = params.split(',').map(p => `${p.trim()}: any`).join(', ');
        return `function ${name}(${paramList}) {`;
      }
      return match;
    }
  );

  // Fix 9: Fix method parameter types
  updated = updated.replace(
    /([a-zA-Z0-9_]+)\s*\(([^\):]+)\)\s*\{/g,
    (match, name, params) => {
      if (name !== 'constructor' && !params.includes(':') && params.trim() !== '') {
        const paramList = params.split(',').map(p => `${p.trim()}: any`).join(', ');
        return `${name}(${paramList}) {`;
      }
      return match;
    }
  );

  // Fix 10: Fix async function return types
  updated = updated.replace(
    /async\s+function\s+(\w+)\s*\(([^)]*)\)\s*\{/g,
    (match, name, params) => {
      if (!match.includes(': Promise<')) {
        return `async function ${name}(${params}): Promise<any> {`;
      }
      return match;
    }
  );

  // Fix 11: Fix async method return types
  updated = updated.replace(
    /async\s+(\w+)\s*\(([^)]*)\)\s*\{/g,
    (match, name, params) => {
      if (!match.includes(': Promise<')) {
        return `async ${name}(${params}): Promise<any> {`;
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
  const rootDir = process.cwd();
  const packagesDir = path.join(rootDir, 'packages');
  
  // Check if packages directory exists
  if (!fs.existsSync(packagesDir)) {
    console.error(`Error: The packages directory does not exist at ${packagesDir}`);
    
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

  // Process all packages
  const packages = fs.readdirSync(packagesDir);
  for (const pkg of packages) {
    const pkgPath = path.join(packagesDir, pkg);
    const stat = fs.statSync(pkgPath);
    
    if (stat.isDirectory()) {
      
      const srcDir = path.join(pkgPath, 'src');
      
      if (fs.existsSync(srcDir)) {
        processDirectory(srcDir);
      } else {
        // If no src directory, process the package directory itself
        processDirectory(pkgPath);
      }
    }
  }
  
  // Also process the src directory in the root if it exists
  const rootSrcDir = path.join(rootDir, 'src');
  if (fs.existsSync(rootSrcDir)) {
    
    processDirectory(rootSrcDir);
  }

}

main();