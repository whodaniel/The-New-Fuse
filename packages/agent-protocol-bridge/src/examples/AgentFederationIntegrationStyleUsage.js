"use strict";
/**
 * AgentFederationIntegrationStyleUsage.ts
 *
 * Example usage of AgentFederationIntegration-style agent communication features
 * implemented in The New Fuse framework.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeAgentHub = initializeAgentHub;
const AgentHub_1 = require("../services/AgentHub");
// Example: Initialize the Agent Hub
async function initializeAgentHub() {
    const agentHub = new AgentHub_1.AgentHub();
    // Listen for agent events
    agentHub.on('agentRegistered', (agent) => {
        console.log(`Agent registered: ${agent.displayName});
  });
  
  agentHub.on('taskCreated', (task) => {`, console.log(`Task created: ${task.id}`));
        for (agent; $; { task, : .agentId })
            ;
    });
    agentHub.on('taskCompleted', (task) => {
        `
    console.log(`;
        Task;
        completed: $;
        {
            task.id;
        }
        `);
  });
  
  agentHub.on('taskFailed', (task, error) => {
    console.error(Task failed: ${task.id}, error);
  });
  
  return agentHub;
}

// Example: Execute a plan in an external agent (AgentFederationIntegration-style)
export async function executePlanInClaude(
  agentHub: AgentHub,
  planIdentifier: string
): Promise<string> {
  try {
    const result = await agentHub.executePlanInAgent(
      'claude-code',
      planIdentifier,
      '/path/to/prompt/templates/execute-plan.txt'
    );
    
    console.log('Plan execution result:', result);
    return result;
  } catch (error) {
    console.error('Failed to execute plan in Claude:', error);
    throw error;
  }
}

// Example: Execute verification comments
export async function executeVerificationComments(
  agentHub: AgentHub,
  planIdentifier: string,
  verificationCommentId: string
): Promise<string> {
  try {
    const result = await agentHub.executeVerificationCommentInAgent(
      'gemini',
      planIdentifier,
      verificationCommentId,
      '/path/to/prompt/templates/execute-verification.txt'
    );
    
    console.log('Verification execution result:', result);
    return result;
  } catch (error) {
    console.error('Failed to execute verification comment:', error);
    throw error;
  }
}

// Example: Execute all verification comments with filter
export async function executeAllVerificationComments(
  agentHub: AgentHub,
  planIdentifier: string,
  filter?: string
): Promise<string> {
  try {
    const result = await agentHub.executeAllVerificationCommentsInAgent(
      'cline',
      planIdentifier,
      filter,
      '/path/to/prompt/templates/execute-all-verifications.txt'
    );
    
    console.log('All verifications execution result:', result);
    return result;
  } catch (error) {
    console.error('Failed to execute all verification comments:', error);
    throw error;
  }
}

// Example: Send structured prompt with context
export async function sendStructuredPromptWithContext(
  agentHub: AgentHub,
  agentId: string,
  promptText: string,
  workspaceFiles: string[]
): Promise<string> {
  const protobufAdapter = new ProtobufAdapter();
  
  const structuredPrompt: StructuredPrompt = {`;
        id: prompt_$;
        {
            Date.now();
        }
        `,
    userId: 'user123',
    text: promptText,
    context: {
      files: workspaceFiles,
      workspace: process.cwd(),
      timestamp: new Date().toISOString(),
    },
    targetAgent: agentId,
    workspace: process.cwd(),
    files: workspaceFiles,
  };
  
  try {
    const result = await agentHub.sendStructuredPrompt(
      agentId,
      structuredPrompt,
      {
        timeout: 300000, // 5 minutes
        context: {
          workspaceRoot: process.cwd(),
          files: workspaceFiles,
        },
      }
    );
    
    console.log('Structured prompt result:', result);
    return result;
  } catch (error) {
    console.error('Failed to send structured prompt:', error);
    throw error;
  }
}

// Example: Multi-agent workflow orchestration
export async function orchestrateMultiAgentWorkflow(
  agentHub: AgentHub,
  planIdentifier: string,
  workspaceFiles: string[]
): Promise<void> {
  console.log('Starting multi-agent workflow orchestration...');
  
  try {
    // Step 1: Execute plan in Claude Code
    console.log('Step 1: Executing plan in Claude Code...');
    await agentHub.executePlanInAgent(
      'claude-code',
      planIdentifier
    );
    
    // Step 2: Execute verification in Gemini
    console.log('Step 2: Running verification with Gemini...');
    await agentHub.executeVerificationCommentInAgent(
      'gemini',
      planIdentifier,
      'verification_1'
    );
    
    // Step 3: Execute all verifications in Cline
    console.log('Step 3: Running all verifications with Cline...');
    await agentHub.executeAllVerificationCommentsInAgent(
      'cline',
      planIdentifier,
      'priority:high'
    );
    
    // Step 4: Send structured prompt to Roo Code for testing
    console.log('Step 4: Sending testing tasks to Roo Code...');
    await sendStructuredPromptWithContext(
      agentHub,
      'roo-code',
      Please run comprehensive tests for plan: ${planIdentifier},
      workspaceFiles
    );
    
    console.log('Multi-agent workflow completed successfully!');
  } catch (error) {
    console.error('Multi-agent workflow failed:', error);
    throw error;
  }
}

// Example: Monitor agent hub status
export function monitorAgentHubStatus(agentHub: AgentHub): void {
  setInterval(() => {
    const availableAgents = agentHub.getAvailableAgents();
    const taskQueue = agentHub.getTaskQueue();`;
        const runningProcesses = agentHub.getRunningProcesses();
        `
    
    console.log('=== Agent Hub Status ===');
    console.log(`;
        Available;
        agents: $;
        {
            availableAgents.length;
        }
    });
    `
    console.log(Queued tasks: ${taskQueue.length});
    console.log(Running processes: ${runningProcesses.length});
    `;
    // Log task statuses`
    taskQueue.forEach(task => {
        `
      console.log(  Task ${task.id}: ${task.status} (${task.agentId}));
    });
    
    console.log('========================');
  }, 30000); // Every 30 seconds
}

// Example usage
export async function main(): Promise<void> {
  const agentHub = await initializeAgentHub();
  
  // Start monitoring
  monitorAgentHubStatus(agentHub);
  
  // Example workflow
  const planIdentifier = 'implement-user-authentication';
  const workspaceFiles = [
    'src/auth/AuthService.ts',
    'src/auth/AuthController.ts',
    'src/models/User.ts',
  ];
  
  try {
    await orchestrateMultiAgentWorkflow(agentHub, planIdentifier, workspaceFiles);
  } catch (error) {
    console.error('Workflow failed:', error);
  } finally {
    // Cleanup
    await agentHub.cleanup();
  }
}

// React component usage example
export const AgentHubUsageExample = 
import React, { useState } from 'react';
import { ExecuteInDropdown } from './components/agent-hub/ExecuteInDropdown';
import { useAgentHub } from './hooks/useAgentHub';

export const AgentTaskInterface: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const { 
    agents, 
    executeTask, 
    isExecuting, 
    error 
  } = useAgentHub();

  const handleExecute = async (agentId: string, promptText: string) => {
    try {
      const result = await executeTask(agentId, promptText);
      console.log('Task result:', result);
    } catch (error) {
      console.error('Task failed:', error);
    }
  };

  return (
    <div className="p-4">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your task description..."
        className="w-full p-2 border rounded mb-4"
        rows={4}
      />
      
      <ExecuteInDropdown
        agents={agents}
        onExecute={handleExecute}
        currentPrompt={prompt}
        isLoading={isExecuting}
      />
      
      {error && (
        <div className="mt-4 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
    </div>
  );
};` `;

export default {
  initializeAgentHub,
  executePlanInClaude,
  executeVerificationComments,
  executeAllVerificationComments,
  sendStructuredPromptWithContext,
  orchestrateMultiAgentWorkflow,
  monitorAgentHubStatus,
  main,
};;
    });
}
//# sourceMappingURL=AgentFederationIntegrationStyleUsage.js.map