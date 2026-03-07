// Script to refresh agent discovery
const vscode = require('vscode');

async function refreshAgents() {
    try {
        console.log('Refreshing agent discovery...');
        
        // Execute the command to refresh agent discovery
        await vscode.commands.executeCommand('thefuse.discoverAgents');
        
        console.log('Agent discovery refreshed successfully');
    } catch (error) {
        console.error('Error refreshing agent discovery:', error);
    }
}

// Execute the function
refreshAgents();
