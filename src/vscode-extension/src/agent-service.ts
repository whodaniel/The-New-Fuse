import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface Agent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
}

const AGENTS_FILE_PATH = path.join(__dirname, '..', 'agents.json'); // Adjusted path to be relative to src/vscode-extension/src
let outputChannel: vscode.OutputChannel;

function getOutputChannel(): vscode.OutputChannel {
  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel('Agent Coordination');
  }
  return outputChannel;
}

async function discoverAgents(): Promise<Agent[]> {
  try {
    const agentsJson = await fs.promises.readFile(AGENTS_FILE_PATH, 'utf-8');
    const agents = JSON.parse(agentsJson) as Agent[];
    getOutputChannel().appendLine('Agents discovered:');
    agents.forEach(agent => {
      getOutputChannel().appendLine(`- ${agent.name} (ID: ${agent.id})`);
    });
    return agents;
  } catch (error) {
    getOutputChannel().appendLine(`Error discovering agents: ${error}`);
    vscode.window.showErrorMessage(`Error discovering agents. See 'Agent Coordination' output for details. File path: ${AGENTS_FILE_PATH}`);
    return [];
  }
}

async function executeSimpleTask(agents: Agent[]): Promise<void> {
  const timestampAgent = agents.find(agent => agent.capabilities.includes('generate_timestamp'));
  const loggingAgent = agents.find(agent => agent.capabilities.includes('log_message'));

  if (!timestampAgent || !loggingAgent) {
    const errorMessage = 'Required agents (Timestamp Generator or Logger) not found.';
    getOutputChannel().appendLine(errorMessage);
    vscode.window.showErrorMessage(errorMessage);
    return;
  }

  getOutputChannel().appendLine(`\nExecuting simple task with ${timestampAgent.name} and ${loggingAgent.name}:`);

  // Agent 1: Generate timestamp
  const timestamp = new Date().toISOString();
  getOutputChannel().appendLine(`[${timestampAgent.name}] Generated timestamp: ${timestamp}`);

  // Agent 2: Log timestamp
  getOutputChannel().appendLine(`[${loggingAgent.name}] Logging timestamp: ${timestamp}`);
  getOutputChannel().show(); // Show the output channel to the user

  vscode.window.showInformationMessage(`Simple task executed. Timestamp: ${timestamp} logged by ${loggingAgent.name}.`);
}

export function registerAgentCoordinationCommand(context: vscode.ExtensionContext) {
  const command = vscode.commands.registerCommand('extension.coordinateAgentsSimpleTask', async () => {
    getOutputChannel().clear();
    getOutputChannel().appendLine('Starting agent coordination workflow...');
    const agents = await discoverAgents();
    if (agents.length > 0) {
      await executeSimpleTask(agents);
    } else {
      getOutputChannel().appendLine('No agents found to execute the task.');
      vscode.window.showWarningMessage('No agents found to execute the task.');
    }
  });
  context.subscriptions.push(command);
  getOutputChannel().appendLine('Agent coordination command registered.');
}

// Helper function for testing purposes (e.g., if you want to call it from another part of the extension without a command)
export async function runAgentWorkflow() {
    getOutputChannel().clear();
    getOutputChannel().appendLine('Starting agent coordination workflow (direct call)...');
    const agents = await discoverAgents();
    if (agents.length > 0) {
        await executeSimpleTask(agents);
    } else {
        getOutputChannel().appendLine('No agents found to execute the task.');
        vscode.window.showWarningMessage('No agents found to execute the task.');
    }
}