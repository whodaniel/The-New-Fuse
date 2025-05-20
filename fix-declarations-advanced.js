const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get a list of all the files with errors from the TypeScript compiler output
function getErrorFiles() {
  try {
    // Run tsc to get the error output
    const output = execSync('cd apps/frontend && npx tsc --noEmit', { encoding: 'utf8' });
    console.log('TypeScript compilation output:', output);
    return [];
  } catch (error) {
    // Parse the error output to get the list of files with errors
    const errorOutput = error.stdout || '';
    const fileRegex = /src\/.*\.d\.ts/g;
    const matches = errorOutput.match(fileRegex) || [];
    
    // Remove duplicates
    const uniqueFiles = [...new Set(matches)];
    
    // Convert to full paths
    return uniqueFiles.map(file => path.join('apps/frontend', file));
  }
}

// Function to fix a specific declaration file
function fixDeclarationFile(filePath) {
  console.log(`Fixing ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix the specific syntax errors we saw in the error messages
  content = content.replace(/\): any: /g, '): ');
  content = content.replace(/\[\]: any: /g, '[]): ');
  content = content.replace(/\): any;/g, ');');
  content = content.replace(/\): any: void;/g, '): void;');
  content = content.replace(/\): any: string;/g, '): string;');
  content = content.replace(/\): any: boolean;/g, '): boolean;');
  content = content.replace(/\): any: \{/g, '): {');
  content = content.replace(/\): any: \[/g, '): [');
  
  // Write the fixed content back to the file
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed ${filePath}`);
}

// Main function
function main() {
  // Option 1: Fix specific files that we know have errors
  const knownErrorFiles = [
    'apps/frontend/src/components/AppCreator.d.ts',
    'apps/frontend/src/components/AppStacker.d.ts',
    'apps/frontend/src/components/Modals/ManageWorkspace/Documents/Directory/utils.d.ts',
    'apps/frontend/src/components/Modals/Password/hooks/usePasswordModal.d.ts',
    'apps/frontend/src/components/WorkflowEditor/utils/node-support.d.ts',
    'apps/frontend/src/components/WorkflowEditor/utils/special-nodes.d.ts',
    'apps/frontend/src/components/WorkspaceChat/ChatContainer/ChatHistory/Chartable/chart-utils.d.ts',
    'apps/frontend/src/hooks/useFlowRouter.d.ts',
    'apps/frontend/src/hooks/useGetProvidersModels.d.ts',
    'apps/frontend/src/hooks/useLanguageOptions.d.ts',
    'apps/frontend/src/hooks/useLoginMode.d.ts',
    'apps/frontend/src/hooks/useLogo.d.ts',
    'apps/frontend/src/hooks/useModal.d.ts',
    'apps/frontend/src/hooks/usePfp.d.ts',
    'apps/frontend/src/hooks/usePrefersDarkMode.d.ts',
    'apps/frontend/src/hooks/useQuery.d.ts',
    'apps/frontend/src/hooks/useTextSize.d.ts',
    'apps/frontend/src/hooks/useTheme.d.ts',
    'apps/frontend/src/hooks/useUser.d.ts',
    'apps/frontend/src/lib/chatHandler.d.ts',
    'apps/frontend/src/lib/constants.d.ts',
    'apps/frontend/src/lib/directories.d.ts',
    'apps/frontend/src/lib/markdown.d.ts',
    'apps/frontend/src/lib/numbers.d.ts',
    'apps/frontend/src/lib/request.d.ts',
    'apps/frontend/src/lib/types.d.ts',
    'apps/frontend/src/lib/utils.d.ts',
    'apps/frontend/src/pages/GeneralSettings/CommunityHub/utils.d.ts',
    'apps/frontend/src/shared/hooks/useTheme.d.ts',
    'apps/frontend/src/utils/cn.d.ts',
    'apps/frontend/src/utils/organize_files.d.ts'
  ];
  
  // Fix each file
  knownErrorFiles.forEach(file => {
    fixDeclarationFile(file);
  });
  
  console.log('All declaration files fixed!');
}

main();
