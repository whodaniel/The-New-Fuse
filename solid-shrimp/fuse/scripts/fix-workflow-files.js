const fs = require('fs');
const path = require('path');

const workflowDir = './src/workflow';

// Function to fix method signatures in a file
function fixMethodSignatures(content) {
  // Fix method signatures with Promise<void> (params): Promise<ReturnType>
  content = content.replace(
    /async\s+(\w+)\(\):\s+Promise<void>\s+\(([^)]*)\):\s+Promise<([^>]+)>\s+{/g,
    'async $1($2): Promise<$3> {'
  );
  
  // Fix method signatures with private async method(): Promise<void> (params): Promise<ReturnType>
  content = content.replace(
    /private\s+async\s+(\w+)\(\):\s+Promise<void>\s+\(([^)]*)\):\s+Promise<([^>]+)>\s+{/g,
    'private async $1($2): Promise<$3> {'
  );
  
  // Fix method signatures with public async method(): Promise<void> (params): Promise<ReturnType>
  content = content.replace(
    /public\s+async\s+(\w+)\(\):\s+Promise<void>\s+\(([^)]*)\):\s+Promise<([^>]+)>\s+{/g,
    'public async $1($2): Promise<$3> {'
  );
  
  return content;
}

// Function to fix string literals in a file
function fixStringLiterals(content) {
  // Fix missing quotes around string literals
  content = content.replace(/:\s+([a-zA-Z0-9_-]+)'/g, ": '$1'");
  
  // Fix "Unknown validation error'"
  content = content.replace(/Unknown validation error'/g, "'Unknown validation error'");
  
  return content;
}

// Function to fix property assignments in a file
function fixPropertyAssignments(content) {
  // Fix timestamp await this.findNearestBackup(workflowId, pointInTime);
  content = content.replace(
    /timestamp\s+await\s+this\.findNearestBackup\(([^)]+)\);/g,
    'timestamp: await this.findNearestBackup($1),'
  );
  
  // Fix summary: this.generateTestSummary(results): await this.calculateCoverage(workflow, results),
  content = content.replace(
    /summary:\s+this\.generateTestSummary\(([^)]+)\):\s+await\s+this\.calculateCoverage\(([^)]+)\),/g,
    'summary: this.generateTestSummary($1),\n      coverage: await this.calculateCoverage($2),'
  );
  
  // Fix timestamp: new Date(): state.metadata
  content = content.replace(
    /timestamp:\s+new\s+Date\(\):\s+([^,]+)/g,
    'timestamp: new Date(),\n      $1'
  );
  
  return content;
}

// Function to fix a file
function fixFile(filePath) {
  try {
    console.log(`Fixing file: ${filePath}`);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix method signatures
    content = fixMethodSignatures(content);
    
    // Fix string literals
    content = fixStringLiterals(content);
    
    // Fix property assignments
    content = fixPropertyAssignments(content);
    
    // Write the fixed content back to the file
    fs.writeFileSync(filePath, content);
    console.log(`Fixed file: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error fixing file ${filePath}: ${error.message}`);
    return false;
  }
}

// Main function
function main() {
  const files = [
    'recovery.ts',
    'resources.ts',
    'security.ts',
    'statePersistence.ts',
    'testing.ts',
    'validator.ts',
    'versioning.ts',
    'WorkflowEngine.ts'
  ];
  
  let fixedFiles = 0;
  
  files.forEach(file => {
    const filePath = path.join(workflowDir, file);
    if (fs.existsSync(filePath)) {
      if (fixFile(filePath)) {
        fixedFiles++;
      }
    } else {
      console.error(`File not found: ${filePath}`);
    }
  });
  
  console.log(`\nFixed ${fixedFiles} out of ${files.length} files.`);
}

main();
