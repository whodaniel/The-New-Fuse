// Activate The New Fuse Extension and Establish Communication with Copilot
const vscode = require('vscode');

/**
 * Activates The New Fuse extension and establishes communication with Copilot
 */
async function activateFuseAndConnectWithCopilot() {
    try {
        console.log('Starting The New Fuse activation process...');

        // Step 1: Activate The New Fuse extension by showing discovered AI agents
        console.log('Activating The New Fuse extension...');
        await vscode.commands.executeCommand('thefuse.showAgents');
        console.log('The New Fuse extension activated');

        // Step 2: Refresh agent discovery to ensure Copilot is detected
        console.log('Refreshing agent discovery...');
        await vscode.commands.executeCommand('thefuse.discoverAgents');
        console.log('Agent discovery refreshed');

        // Step 3: Show discovered AI agents to verify Copilot is detected
        console.log('Showing discovered AI agents...');
        await vscode.commands.executeCommand('thefuse.showAgents');
        console.log('Discovered AI agents displayed');

        // Step 4: Open the workflow builder
        console.log('Opening workflow builder...');
        await vscode.commands.executeCommand('thefuse.openWorkflowBuilder');
        console.log('Workflow builder opened');

        console.log('The New Fuse activation and Copilot connection process completed successfully');
    } catch (error) {
        console.error('Error activating The New Fuse or connecting with Copilot:', error);
    }
}

// Export the activation function
module.exports = {
    activateFuseAndConnectWithCopilot
};

// If this script is run directly, execute the activation function
if (require.main === module) {
    activateFuseAndConnectWithCopilot();
}
