import cp from 'child_process';
import path from 'path';
import fs from 'fs';

// Get the current directory
const extensionPath = __dirname;

// Ensure we have a compiled extension (placeholder for tests)
if (!fs.existsSync(path.join(extensionPath, 'out'))) {
  fs.mkdirSync(path.join(extensionPath, 'out'), { recursive: true });
  
  // Create a minimal extension.js in the out directory
  const minimalExtension = `
    import vscode from 'vscode';
    
    function activate(context) {

      // Command registration moved to main extension.ts
      // context.subscriptions.push(disposable);
    }
    
    function deactivate() {}
    
    module.exports = { activate, deactivate };
  `;
  
  fs.writeFileSync(path.join(extensionPath, 'out', 'extension.js'), minimalExtension);
}

// Determine VS Code path based on platform
let vscodePath;
if (process.platform === 'darwin') {
  vscodePath = '/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code';
  if (!fs.existsSync(vscodePath)) {
    vscodePath = 'code'; // Fallback to PATH
  }
} else if (process.platform === 'win32') {
  vscodePath = 'code.cmd';
} else {
  vscodePath = 'code';
}

// Launch VS Code with the extension
const proc = cp.spawn(vscodePath, [
  '--new-window',
  '--extensionDevelopmentPath=' + extensionPath
], {
  stdio: 'inherit'
});

proc.on('error', (err) => {
  console.error('Failed to start VS Code:', err);
});

proc.on('close', (code) => {
  
});
