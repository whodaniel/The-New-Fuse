import * as vscode from 'vscode';

export async function activate(context: vscode.ExtensionContext) {
    console.log('The New Fuse extension is now active!');

    // Register commands
    const disposables = [
        vscode.commands.registerCommand('the-new-fuse.showChat', () => {
            vscode.window.showInformationMessage('The New Fuse Chat activated!');
        }),

        vscode.commands.registerCommand('the-new-fuse.runDiagnostic', () => {
            const output = vscode.window.createOutputChannel('The New Fuse');
            output.show();
            output.appendLine('🔍 Running diagnostic...');
            output.appendLine('✅ Extension loaded successfully');
            output.appendLine('✅ Commands registered');
            output.appendLine('🎉 Diagnostic complete!');
        })
    ];

    context.subscriptions.push(...disposables);
}

export function deactivate() {
    console.log('The New Fuse extension deactivated');
}