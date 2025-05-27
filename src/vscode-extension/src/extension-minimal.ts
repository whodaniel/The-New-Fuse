import * as vscode from 'vscode';

export async function activate(context: vscode.ExtensionContext) {
    console.log('🚀 MINIMAL DEBUG: Starting extension activation...');
    
    try {
        // Test basic view container
        const disposable = vscode.window.registerWebviewViewProvider(
            'theNewFuse.tabbedContainer',
            {
                resolveWebviewView(webviewView) {
                    console.log('✅ MINIMAL DEBUG: Test webview view resolved!');
                    webviewView.webview.html = '<h1>Test Extension Working!</h1><p>The New Fuse minimal test is active.</p>';
                }
            }
        );
        
        context.subscriptions.push(disposable);
        console.log('✅ MINIMAL DEBUG: Test view registered successfully');
        
    } catch (error) {
        console.error('❌ MINIMAL DEBUG: Extension activation failed:', error);
        vscode.window.showErrorMessage(`Extension activation failed: ${error}`);
    }
    
    console.log('✅ MINIMAL DEBUG: Extension activation completed');
}

export function deactivate() {
    console.log('🛑 MINIMAL DEBUG: Extension deactivated');
}
