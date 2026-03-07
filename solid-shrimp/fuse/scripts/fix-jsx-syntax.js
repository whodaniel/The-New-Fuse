/**
 * Script to fix common JSX syntax issues in React components
 */

import fs from 'fs';
import path from 'path';
import { execSync  } from 'child_process';

// Get the base directory
const BASE_DIR = process.env.BASE_DIR || path.join(__dirname, '..');

// Find files with JSX syntax errors
const findFilesWithJSXErrors = () => {
  try {
    // Read the TypeScript error log
    const errorLog = fs.readFileSync(path.join(BASE_DIR, 'typescript-errors.log'), 'utf8');
    
    // Extract files with JSX syntax errors
    const jsxErrorPattern = /([^\s]+\.tsx)\([0-9]+,[0-9]+\): error TS[0-9]+: .*JSX.*/g;
    const matches = errorLog.match(jsxErrorPattern) || [];
    
    // Extract unique file paths
    const fileSet = new Set();
    matches.forEach(match => {
      const filePath = match.split('(')[0].trim();
      fileSet.add(filePath);
    });
    
    return Array.from(fileSet);
  } catch (error) {
    console.error('Error finding files with JSX errors:', error);
    return [];
  }
};

// Fix common JSX syntax issues in a file
const fixJSXSyntaxInFile = (filePath) => {
  try {
    
    const fullPath = path.join(BASE_DIR, filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.warn(`File not found: ${fullPath}`);
      return;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Fix 1: Fix interface declarations that are incorrectly formatted as JSX
    content = content.replace(/interface\s+([A-Za-z0-9_]+)\s*\(/g, 'interface $1 {');
    content = content.replace(/\)\s*>\s*\{/g, '{');
    
    // Fix 2: Fix missing closing tags
    const openTags = [];
    const lines = content.split('\n');
    let inJSXComment = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip JSX comments
      if (line.includes('{/*')) inJSXComment = true;
      if (line.includes('*/}')) inJSXComment = false;
      if (inJSXComment) continue;
      
      // Check for unclosed tags
      const openTagMatches = line.match(/<([A-Za-z0-9_]+)(?![^>]*\/>)[^>]*>/g);
      const closeTagMatches = line.match(/<\/([A-Za-z0-9_]+)>/g);
      
      if (openTagMatches) {
        openTagMatches.forEach(tag => {
          const tagName = tag.match(/<([A-Za-z0-9_]+)/)[1];
          openTags.push(tagName);
        });
      }
      
      if (closeTagMatches) {
        closeTagMatches.forEach(tag => {
          const tagName = tag.match(/<\/([A-Za-z0-9_]+)>/)[1];
          if (openTags[openTags.length - 1] === tagName) {
            openTags.pop();
          }
        });
      }
    }
    
    // Add missing closing tags
    if (openTags.length > 0) {
      }`);
      openTags.reverse().forEach(tag => {
        content += `\n</${tag}>`;
      });
    }
    
    // Fix 3: Fix incorrect JSX syntax in interface definitions
    content = content.replace(/interface\s+([A-Za-z0-9_]+)\s*>\s*\{/g, 'interface $1 {');
    
    // Fix 4: Fix incorrect closing brackets
    content = content.replace(/}\s*<\/interface>/g, '}');
    
    // Write the fixed content back to the file
    fs.writeFileSync(fullPath, content);
    
  } catch (error) {
    console.error(`Error fixing JSX syntax in ${filePath}:`, error);
  }
};

// Main function
const main = () => {

  // Find files with JSX syntax errors
  const filesWithJSXErrors = findFilesWithJSXErrors();

  // Fix JSX syntax in each file
  filesWithJSXErrors.forEach(filePath => {
    fixJSXSyntaxInFile(filePath);
  });

};

// Run the main function
main();