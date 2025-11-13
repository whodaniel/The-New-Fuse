const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to fix a specific declaration file
function fixDeclarationFile(filePath) {
  console.log(`Checking ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if the file has the specific error pattern
  if (content.includes('): any:')) {
    console.log(`Fixing ${filePath}`);
    
    // Fix the specific syntax error
    content = content.replace(/\): any:/g, '): ');
    
    // Write the fixed content back to the file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed ${filePath}`);
  }
}

// Main function
function main() {
  // List of files to check
  const knownErrorFiles = [
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
  
  console.log('All declaration files checked and fixed!');
}

main();
