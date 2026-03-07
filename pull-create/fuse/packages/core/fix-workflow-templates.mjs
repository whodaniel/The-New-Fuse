import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to fix string literals in a file
function fixStringLiterals(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Fix missing quotes around string literals
    let fixedContent = content;
    
    // Fix id: name' -> id: 'name'
    fixedContent = fixedContent.replace(/id:\s+([a-zA-Z0-9_-]+)'/g, "id: '$1'");
    
    // Fix name: Name' -> name: 'Name'
    fixedContent = fixedContent.replace(/name:\s+([a-zA-Z0-9_\s-]+)'/g, "name: '$1'");
    
    // Fix description: Description' -> description: 'Description'
    fixedContent = fixedContent.replace(/description:\s+([a-zA-Z0-9_\s-]+)'/g, "description: '$1'");
    
    // Fix version: 1.0.0' -> version: '1.0.0'
    fixedContent = fixedContent.replace(/version:\s+([0-9.]+)'/g, "version: '$1'");
    
    // Fix startStep: step' -> startStep: 'step'
    fixedContent = fixedContent.replace(/startStep:\s+([a-zA-Z0-9_-]+)'/g, "startStep: '$1'");
    
    // Fix status: pending' -> status: 'pending'
    fixedContent = fixedContent.replace(/status:\s+([a-zA-Z0-9_-]+)'/g, "status: '$1'");
    
    // Fix type: type' -> type: 'type'
    fixedContent = fixedContent.replace(/type:\s+([a-zA-Z0-9_-]+)'/g, "type: '$1'");
    
    // Fix format: format' -> format: 'format'
    fixedContent = fixedContent.replace(/format:\s+([a-zA-Z0-9_-]+)'/g, "format: '$1'");
    
    // Fix mode: mode' -> mode: 'mode'
    fixedContent = fixedContent.replace(/mode:\s+([a-zA-Z0-9_-]+)'/g, "mode: '$1'");
    
    // Write the fixed content back to the file
    fs.writeFileSync(filePath, fixedContent);
    
    console.log(`Fixed string literals in ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error fixing string literals in ${filePath}: ${error.message}`);
    return false;
  }
}

// Main function
function main() {
  const filePath = './src/workflow/WorkflowTemplates.ts';
  
  if (fs.existsSync(filePath)) {
    fixStringLiterals(filePath);
  } else {
    console.error(`File not found: ${filePath}`);
  }
}

main();
