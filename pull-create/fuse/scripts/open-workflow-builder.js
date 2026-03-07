// Script to open The New Fuse workflow builder
const vscode = require('vscode');

async function openWorkflowBuilder() {
    try {
        console.log('Opening The New Fuse workflow builder...');
        
        // Execute the command to open the workflow builder
        await vscode.commands.executeCommand('thefuse.openWorkflowBuilder');
        
        console.log('Workflow builder opened successfully');
    } catch (error) {
        console.error('Error opening workflow builder:', error);
    }
}

// Execute the function
openWorkflowBuilder();
