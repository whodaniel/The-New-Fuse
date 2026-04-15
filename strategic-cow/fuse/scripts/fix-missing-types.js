/**
 * Script to fix missing type annotations in TypeScript files
 */

import fs from 'fs';
import path from 'path';

// Get the base directory
const BASE_DIR = process.env.BASE_DIR || path.join(__dirname, '..');

// Find files with missing type errors
const findFilesWithTypeErrors = () => {
  try {
    // Read the TypeScript error log
    const errorLog = fs.readFileSync(path.join(BASE_DIR, 'typescript-errors.log'), 'utf8');
    
    // Extract files with missing type errors
    const typeErrorPatterns = [
      /([^\s]+\.ts[x]?)\([0-9]+,[0-9]+\): error TS7006: Parameter '[^']+' implicitly has an 'any' type/g,
      /([^\s]+\.ts[x]?)\([0-9]+,[0-9]+\): error TS7031: Binding element '[^']+' implicitly has an 'any' type/g,
      /([^\s]+\.ts[x]?)\([0-9]+,[0-9]+\): error TS7008: Member '[^']+' implicitly has an 'any' type/g,
      /([^\s]+\.ts[x]?)\([0-9]+,[0-9]+\): error TS7010: '[^']+', which lacks return-type annotation, implicitly has an 'any' return type/g
    ];
    
    // Extract unique file paths
    const fileSet = new Set();
    
    typeErrorPatterns.forEach(pattern => {
      const matches = errorLog.match(pattern) || [];
      matches.forEach(match => {
        const filePath = match.split('(')[0].trim();
        fileSet.add(filePath);
      });
    });
    
    return Array.from(fileSet);
  } catch (error) {
    console.error('Error finding files with type errors:', error);
    return [];
  }
};

// Fix missing type annotations in a file
const fixMissingTypesInFile = (filePath) => {
  try {
    
    const fullPath = path.join(BASE_DIR, filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.warn(`File not found: ${fullPath}`);
      return;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Fix 1: Add type annotations to function parameters
    content = content.replace(/function\s+([a-zA-Z0-9_]+)\s*\(([^\):]*)\)\s*\{/g, (match, funcName, params) => {
      // Skip if already has type annotations
      if (params.includes(':')) return match;
      
      const typedParams = params.split(',').map(param => {
        param = param.trim();
        if (!param) return param;
        // Skip rest parameters and already typed parameters
        if (param.includes('...') || param.includes(':')) return param;
        return `${param}: any`;
      }).join(', ');
      
      return `function ${funcName}(${typedParams}): any {`;
    });
    
    // Fix 2: Add type annotations to arrow functions
    content = content.replace(/const\s+([a-zA-Z0-9_]+)\s*=\s*\(([^\):]*)\)\s*=>\s*\{/g, (match, funcName, params) => {
      // Skip if already has type annotations
      if (params.includes(':')) return match;
      
      const typedParams = params.split(',').map(param => {
        param = param.trim();
        if (!param) return param;
        // Skip rest parameters and already typed parameters
        if (param.includes('...') || param.includes(':')) return param;
        return `${param}: any`;
      }).join(', ');
      
      return `const ${funcName} = (${typedParams}): any => {`;
    });
    
    // Fix 3: Add type annotations to class methods
    content = content.replace(/([a-zA-Z0-9_]+)\s*\(([^\):]*)\)\s*\{(?!\s*:)/g, (match, methodName, params) => {
      // Skip constructor and already typed methods
      if (methodName === 'constructor' || params.includes(':')) return match;
      
      const typedParams = params.split(',').map(param => {
        param = param.trim();
        if (!param) return param;
        // Skip rest parameters and already typed parameters
        if (param.includes('...') || param.includes(':')) return param;
        return `${param}: any`;
      }).join(', ');
      
      return `${methodName}(${typedParams}): any {`;
    });
    
    // Fix 4: Add type annotations to variables with null/undefined
    content = content.replace(/let\s+([a-zA-Z0-9_]+)\s*=\s*(null|undefined);/g, 'let $1: any = $2;');
    
    // Write the fixed content back to the file
    fs.writeFileSync(fullPath, content);
    
  } catch (error) {
    console.error(`Error fixing missing types in ${filePath}:`, error);
  }
};

// Main function
const main = () => {

  // Find files with missing type errors
  const filesWithTypeErrors = findFilesWithTypeErrors();

  // Fix missing types in each file
  filesWithTypeErrors.forEach(filePath => {
    fixMissingTypesInFile(filePath);
  });

};

// Run the main function
main();