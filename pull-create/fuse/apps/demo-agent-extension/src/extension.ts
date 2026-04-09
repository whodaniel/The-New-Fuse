import * as vscode from 'vscode';

export async function activate(context: vscode.ExtensionContext) {
  console.log('Demo Agent Extension activating...');

  // 1. Get the TNF Extension
  const tnfExtension = vscode.extensions.getExtension('TheNewFuse.the-new-fuse');

  if (tnfExtension) {
    // 2. Activate and get the Public API
    const api = await tnfExtension.activate();
    console.log('Connected to The New Fuse API');

    // 3. Register our agent
    api.registerAgent({
      id: 'demo-agent',
      name: 'Demo Specialist',
      description: 'A demo agent connected via VS Code API',
      capabilities: {
        supportsStreaming: false,
        supportsImages: false,
        supportsTools: false,
      },
    });

    // 4. Send a notification/message
    api.sendMessage('Demo Agent is now online and connected via IDE bridge.');
  } else {
    console.error('The New Fuse extension not found!');
  }
}

export function deactivate() {}
