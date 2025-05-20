const fs = require('fs');
const path = require('path');

// Function to fix string literals in a file
function fixStringLiterals(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Fix missing quotes around string literals
    const fixedContent = content.replace(
      /([a-zA-Z0-9_-]+)'/g,
      "'$1'"
    );
    
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
