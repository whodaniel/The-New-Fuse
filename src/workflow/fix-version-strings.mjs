import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to fix version strings in a file
function fixVersionStrings(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Fix version: (1 as any).0.0' -> version: '1.0.0'
    const fixedContent = content.replace(/version:\s+\(1 as any\)\.0\.0'/g, "version: '1.0.0'");
    
    // Write the fixed content back to the file
    fs.writeFileSync(filePath, fixedContent);
    
    console.log(`Fixed version strings in ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error fixing version strings in ${filePath}: ${error.message}`);
    return false;
  }
}

// Main function
function main() {
  const filePath = './WorkflowTemplates.ts';
  
  if (fs.existsSync(filePath)) {
    fixVersionStrings(filePath);
  } else {
    console.error(`File not found: ${filePath}`);
  }
}

main();
