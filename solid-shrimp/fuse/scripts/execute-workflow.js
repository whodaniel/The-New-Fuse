// Script to execute a workflow
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

async function executeWorkflow(workflowPath) {
    try {
        console.log(`Executing workflow from ${workflowPath}...`);
        
        // Read the workflow file
        const workflowContent = fs.readFileSync(workflowPath, 'utf8');
        const workflow = JSON.parse(workflowContent);

        // Validate workflow structure
        if (!workflow.steps || !workflow.steps.length) {
            throw new Error('Invalid workflow: No steps defined');
        }

        // Verify Redis connection
        const redis = require('redis');
        const client = redis.createClient();
        await client.connect();
        if (!client.isReady) {
            throw new Error('Redis connection not established');
        }
        
        console.log(`Loaded workflow: ${workflow.name}`);
        
        // Import the workflow
        const workflowId = await vscode.commands.executeCommand('thefuse.importWorkflow', workflow);
        console.log(`Imported workflow with ID: ${workflowId}`);
        
        // Execute the workflow
        // Publish execution start event
        await client.publish('workflow-events', JSON.stringify({
            workflowId,
            status: 'started',
            timestamp: Date.now()
        }));

        await vscode.commands.executeCommand('thefuse.executeWorkflow', workflowId);

        // Publish completion event
        await client.publish('workflow-events', JSON.stringify({
            workflowId,
            status: 'completed',
            timestamp: Date.now()
        }));
        console.log(`Executing workflow with ID: ${workflowId}`);
        
        console.log('Workflow execution started successfully');
    } catch (error) {
        console.error('Error executing workflow:', error);
    }
}

// Get the workflow path from command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
    console.error('Please provide a workflow file path');
    process.exit(1);
}

const workflowPath = args[0];
executeWorkflow(workflowPath);
