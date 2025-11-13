/**
 * This script contains manual fixes for remaining TypeScript errors.
 * Run with ts-node: npx ts-node manual-fixes.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Fix OpenAI imports
function fixOpenAIImports(): any {

  const files = findTsFiles('src');
  
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;
    
    // Fix import { OpenAI } pattern
    if (content.includes('import { OpenAI } from ')) {
      content = content.replace(/import\s*{\s*OpenAI\s*}\s*from\s*['"]openai['"]/g, 'import OpenAI from "openai"');
      modified = true;
    }
    
    // Fix OpenAI direct usage to handle both patterns
    if (content.includes('new OpenAI(')) {
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(file, content, 'utf8');
      
    }
  }
}

// Fix TaskType issues
function fixTaskTypeIssues(): any {

  const files = findTsFiles('src');
  
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;
    
    // Fix : typeof TaskType (should be : typeof TaskType)
    if (content.includes(': typeof TaskType')) {
      content = content.replace(/: typeof TaskType/g, ': typeof TaskType');
      modified = true;
    }
    
    // Fix as typeof TaskType (should be as typeof TaskType)  
    if (content.includes('as typeof TaskType')) {
      content = content.replace(/as typeof TaskType/g, 'as typeof TaskType');
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(file, content, 'utf8');
      
    }
  }
}

// Add export {} to files that need it
function fixIsolatedModules(): any {

  const filesToFix = [
    'src/message-handler.ts',
    'src/tools/tool_manager.ts',
    'src/utils/error-handler.ts',
    'src/models/ApiModel.ts',
    'src/examples/error-tracking-usage.ts',
    'src/TodoApp.ts'
  ];
  
  for (const file of filesToFix) {
    try {
      if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        if (!content.includes('export {}')) {
          // Add export {} only if it doesn't have any other exports
          if (!content.includes('export ')) {
            content += '\nexport {};\n';
            fs.writeFileSync(file, content, 'utf8');
            
          }
        }
      }
    } catch (error) {
      
    }
  }
}

// Find all TypeScript files recursively
function findTsFiles(dir: string): string[] {
  let results: string[] = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      results = results.concat(findTsFiles(fullPath));
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      results.push(fullPath);
    }
  }
  
  return results;
}

// Run all fixes
function runAllFixes(): any {
  
  fixOpenAIImports();
  fixTaskTypeIssues();
  fixIsolatedModules();
  
}

runAllFixes();
