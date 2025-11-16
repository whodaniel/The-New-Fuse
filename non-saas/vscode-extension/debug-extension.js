// Simple debug test to check extension loading
console.log('🔍 DEBUG: Extension loading test...');

try {
    const vscode = require('vscode');
    console.log('✅ DEBUG: vscode module loaded successfully');
    
    // Test basic extension functionality
    const workspaceConfig = vscode.workspace.getConfiguration('theNewFuse');
    console.log('✅ DEBUG: Configuration access works');
    
    console.log('🎯 DEBUG: Extension should be working...');
} catch (error) {
    console.error('❌ DEBUG: Extension loading error:', error);
}
