// Script to show discovered AI agents
const vscode = require('vscode');

async function showAgents() {
    try {
        console.log('Showing discovered AI agents...');
        
        // Execute the command to show discovered agents
        await vscode.commands.executeCommand('thefuse.showAgents');
        
        console.log('Agents displayed successfully');
    } catch (error) {
        console.error('Error showing agents:', error);
    }
}

// Execute the function
showAgents();
