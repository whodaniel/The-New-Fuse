/**
 * Fix Specific TypeScript Errors Script
 * 
 * This script specifically targets common TypeScript errors found in the codebase,
 * particularly focusing on TS1135 (Argument expression expected) errors.
 */

import fs from 'fs';
import path from 'path';

// Configuration
const BASE_DIR = process.env.BASE_DIR || process.cwd();
const ERROR_LOG_PATH = path.join(BASE_DIR, 'typescript-errors.log');

// Main function to fix specific errors
async function fixSpecificErrors() {

  // Check if error log exists
  if (!fs.existsSync(ERROR_LOG_PATH)) {
    console.error(`Error log not found at ${ERROR_LOG_PATH}`);
    
    process.exit(1);
  }
  
  // Read error log
  const errorLog = fs.readFileSync(ERROR_LOG_PATH, 'utf8');
  
  // Extract TS1135 errors (Argument expression expected)
  const argumentErrors = [];
  const regex = /([^\s]+\.ts[x]?)\((\d+),(\d+)\): error TS1135: Argument expression expected/g;
  let match;
  
  while ((match = regex.exec(errorLog)) !== null) {
    argumentErrors.push({
      file: match[1],
      line: parseInt(match[2]),
      column: parseInt(match[3])
    });
  }
  
  `);
  
  // Fix each error
  for (const error of argumentErrors) {
    try {
      await fixArgumentError(error);
    } catch (err) {
      console.error(`Failed to fix error in ${error.file}:${error.line}:${error.column}`, err);
    }
  }
}

// Function to fix TS1135 errors (Argument expression expected)
async function fixArgumentError(error) {
  const filePath = path.join(BASE_DIR, error.file);
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  // Get the problematic line
  const line = lines[error.line - 1];
  
  // Check if there's a function call with missing arguments
  if (line.includes('(') && line.includes(')')) {
    // Find the position of the problematic parentheses
    const openParenIndex = line.indexOf('(', error.column - 1);
    const closeParenIndex = line.indexOf(')', openParenIndex);
    
    if (openParenIndex !== -1 && closeParenIndex !== -1 && closeParenIndex === openParenIndex + 1) {
      // This is likely an empty function call that needs arguments
      // Add a placeholder argument
      const fixedLine = line.substring(0, openParenIndex + 1) + 
                       'undefined' + 
                       line.substring(closeParenIndex);
      
      lines[error.line - 1] = fixedLine;
      
      // Write the fixed content back to the file
      fs.writeFileSync(filePath, lines.join('\n'));
      
    }
  }
}

// Run the fix
fixSpecificErrors().catch(err => {
  console.error('Error fixing TypeScript errors:', err);
  process.exit(1);
});