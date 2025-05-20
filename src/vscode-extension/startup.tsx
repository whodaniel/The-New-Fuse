/**
 * Startup module for The New Fuse extension
 * 
 * This file provides quick-start functionality to make the extension
 * easily accessible for immediate testing.
 */

import * as vscode from 'vscode';

/**
 * Show quick-start welcome and feature suggestions
 */
export function showWelcomeMessage(context: vscode.ExtensionContext): any {
  // Check if we've shown the welcome message before
  const hasShownWelcome = context.globalState.get('thefuse.hasShownWelcome', false);
  
  if (!hasShownWelcome) {
    // Show welcome message with quick actions
    vscode.window.showInformationMessage(
      'The New Fuse is now active! Try out the AI collaboration features.', 
      'Show AI Agents', 
      'Start Collaboration',
      'Read Quick Start'
    ).then(selection => {
      if (selection === 'Show AI Agents') {
        vscode.commands.executeCommand('llm-orchestrator.showAgents');
      } else if (selection === 'Start Collaboration') {
        vscode.commands.executeCommand('thefuse.startAICollab');
      } else if (selection === 'Read Quick Start') {
        // Open the quick start guide
        vscode.workspace.openTextDocument(
          vscode.Uri.file(context.extensionPath + '/QUICK-START.md')
        ).then(doc => {
          vscode.window.showTextDocument(doc);
        });
      }
    });
    
    // Mark that we've shown the welcome message
    context.globalState.update('thefuse.hasShownWelcome', true);
  }
  
  // Create and show an interactive walkthrough for first-time users
  const walkthrough = vscode.window.createWebviewPanel(
    'fuseWalkthrough',
    'The New Fuse - Interactive Walkthrough',
    vscode.ViewColumn.Active,
    {
      enableScripts: true,
      retainContextWhenHidden: true
    }
  );
  
  walkthrough.webview.html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 20px; }
        .step { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        button { background: #007acc; color: white; border: none; padding: 8px 12px; border-radius: 3px; cursor: pointer; }
        button:hover { background: #005999; }
        .completed { background-color: #e6ffed; border-color: #b4ecb4; }
        .reload-notice { background-color: #fffbe6; border: 1px solid #fff5c2; padding: 10px; margin-bottom: 20px; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="reload-notice">
        <h3>📣 Extension Activation</h3>
        <p>If you don't see the extension icons in the status bar, reload your window:</p>
        <button onclick="runCommand('workbench.action.reloadWindow')">Reload Window</button>
      </div>
      
      <h1>Get Started with The New Fuse</h1>
      <p>Follow these steps to try out the inter-extension communication features:</p>
      
      <div class="step" id="step1">
        <h3>Step 1: Discover AI Agents</h3>
        <p>First, let's discover which AI extensions are available in your VS Code.</p>
        <button onclick="runCommand('llm-orchestrator.discoverAgents')">Discover AI Agents</button>
      </div>
      
      <div class="step" id="step2">
        <h3>Step 2: View Available Agents</h3>
        <p>Now, let's see which agents were discovered.</p>
        <button onclick="runCommand('llm-orchestrator.showAgents')">Show AI Agents</button>
      </div>
      
      <div class="step" id="step3">
        <h3>Step 3: Try Collaborative Completion</h3>
        <p>Enable collaborative completion to see multiple AI agents work together on suggestions.</p>
        <button onclick="runCommand('thefuse.toggleCollaborativeCompletion')">Toggle Collaborative Completion</button>
      </div>
      
      <div class="step" id="step4">
        <h3>Step 4: Start AI Collaboration</h3>
        <p>Try a full AI collaboration workflow with multiple specialized agents.</p>
        <button onclick="runCommand('thefuse.startAICollab')">Start AI Collaboration</button>
      </div>
      
      <div class="step" id="step5">
        <h3>Step 5: Open the Example Code</h3>
        <p>Open our example code to try optimization and analysis features.</p>
        <button onclick="openExampleCode()">Open Example Code</button>
      </div>
      
      <script>
        const vscode = acquireVsCodeApi();
        
        function runCommand(command): any {
          vscode.postMessage({
            command: 'executeCommand',
            value: command
          });
          
          document.getElementById(getStepId(command)).classList.add('completed');
        }
        
        function openExampleCode(): any {
          vscode.postMessage({
            command: 'openFile',
            value: 'test/example-code.ts'
          });
          
          document.getElementById('step5').classList.add('completed');
        }
        
        function getStepId(command): any {
          const commandToStepMap = {
            'llm-orchestrator.discoverAgents': 'step1',
            'llm-orchestrator.showAgents': 'step2',
            'thefuse.toggleCollaborativeCompletion': 'step3',
            'thefuse.startAICollab': 'step4'
          };
          return commandToStepMap[command] || '';
        }
      </script>
    </body>
    </html>
  `;
  
  // Handle messages from the webview
  walkthrough.webview.onDidReceiveMessage(
    message => {
      switch (message.command) {
        case 'executeCommand':
          vscode.commands.executeCommand(message.value);
          break;
          
        case 'openFile':
          const filePath = vscode.Uri.file(context.extensionPath + '/' + message.value);
          vscode.workspace.openTextDocument(filePath)
            .then(doc => vscode.window.showTextDocument(doc));
          break;
      }
    },
    undefined,
    context.subscriptions
  );
}
