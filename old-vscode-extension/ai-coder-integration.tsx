/**
 * AI Coder Integration Module
 * 
 * This module demonstrates how multiple AI coding assistants can collaborate
 * using The New Fuse's inter-extension communication system.
 */

/* global setTimeout */
/* eslint-disable no-case-declarations */
import * as vscode from 'vscode';
import { AgentClient } from './agent-communication.js';
import { LMAPIBridge } from './lm-api-bridge.js';

// Define roles for specialized AI coders
export enum AICoderRole {
  Architect = 'architect',
  Implementer = 'implementer',
  Tester = 'tester',
  Reviewer = 'reviewer',
  Optimizer = 'optimizer',
  DocumentationWriter = 'documentationWriter',
}

interface AICoderSpecs {
  role: AICoderRole;
  capabilities: string[];
  specialization?: string;
  preferredLanguages?: string[];
  systemPrompt: string;
}

interface AICoderRequest {
  id: string;
  role: AICoderRole;
  task: string;
  context: {
    code?: string;
    requirements?: string;
    language?: string;
    constraints?: string[];
    previousResults?: Record<AICoderRole, any>;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

/**
 * Manages collaboration between AI coders with different specializations
 */
export class AICoderIntegration {
  private context: vscode.ExtensionContext;
  private agentClient: AgentClient;
  private lmBridge: LMAPIBridge;
  private aiCoders: Map<AICoderRole, AICoderSpecs> = new Map();
  private activeRequests: Map<string, AICoderRequest> = new Map();
  private outputChannel: vscode.OutputChannel;
  
  constructor(context: vscode.ExtensionContext, agentClient: AgentClient, lmBridge: LMAPIBridge) {
    this.context = context;
    this.agentClient = agentClient;
    this.lmBridge = lmBridge;
    this.outputChannel = vscode.window.createOutputChannel('AI Coder Collaboration');
    
    // Register this module as an agent
    this.agentClient.register('AI Coder Integration', ['code-collaboration', 'multi-agent-coding'], '1.0.0')
      .then(success => {
        if (success) {
          this.log('AI Coder Integration registered successfully');
          this.agentClient.subscribe(this.handleMessage.bind(this));
        }
      });
    
    // Initialize AI coder roles
    this.initializeAICoders();
    
    // Register commands
    this.registerCommands();
  }
  
  private initializeAICoders() {
    // Architect: Designs high-level structure and architecture
    this.aiCoders.set(AICoderRole.Architect, {
      role: AICoderRole.Architect,
      capabilities: ['system-design', 'architecture-planning', 'interface-design'],
      systemPrompt: 'You are an expert software architect. Your task is to design high-level software architecture including component structure, interfaces, and data flow. Focus on creating clean, maintainable, and extensible designs.'
    });
    
    // Implementer: Writes the actual code based on designs
    this.aiCoders.set(AICoderRole.Implementer, {
      role: AICoderRole.Implementer,
      capabilities: ['code-implementation', 'api-integration', 'data-modeling'],
      systemPrompt: 'You are an expert code implementer. Your task is to write clean, efficient code that implements the specified requirements and follows the architectural design. Focus on correctness, readability, and adherence to best practices.'
    });
    
    // Tester: Creates tests for the implemented code
    this.aiCoders.set(AICoderRole.Tester, {
      role: AICoderRole.Tester,
      capabilities: ['unit-testing', 'integration-testing', 'test-case-generation'],
      systemPrompt: 'You are an expert in software testing. Your task is to write comprehensive tests for code, including unit tests, integration tests, and edge case handling. Focus on achieving high test coverage and validating both functionality and robustness.'
    });
    
    // Reviewer: Reviews and gives feedback on code
    this.aiCoders.set(AICoderRole.Reviewer, {
      role: AICoderRole.Reviewer,
      capabilities: ['code-review', 'bug-finding', 'best-practices-checking'],
      systemPrompt: 'You are an expert code reviewer. Your task is to analyze code for bugs, inefficiencies, and violations of best practices. Focus on providing constructive feedback that improves code quality, security, and maintainability.'
    });
    
    // Optimizer: Optimizes code for performance
    this.aiCoders.set(AICoderRole.Optimizer, {
      role: AICoderRole.Optimizer,
      capabilities: ['performance-optimization', 'memory-optimization', 'algorithmic-improvements'],
      systemPrompt: 'You are an expert code optimizer. Your task is to analyze and refactor code to improve its performance, reduce resource usage, and enhance efficiency. Focus on time complexity, space complexity, and optimizing critical paths.'
    });
    
    // Documentation Writer: Creates documentation
    this.aiCoders.set(AICoderRole.DocumentationWriter, {
      role: AICoderRole.DocumentationWriter,
      capabilities: ['documentation-generation', 'code-explanation', 'usage-examples'],
      systemPrompt: 'You are an expert technical writer. Your task is to create clear, comprehensive documentation for code, including function descriptions, usage examples, and conceptual explanations. Focus on making the documentation accessible to developers of various experience levels.'
    });
  }
  
  private registerCommands() {
    // Register command to start a collaborative coding task
    this.context.subscriptions.push(
      vscode.commands.registerCommand('thefuse.ai.startCollaborativeCoding', async () => {
        return this.startCollaborativeCoding();
      })
    );
    
    // Register command to analyze a coding problem
    this.context.subscriptions.push(
      vscode.commands.registerCommand('thefuse.ai.analyzeCodeProblem', async () => {
        return this.analyzeCodeProblem();
      })
    );
    
    // Register command to consult specific AI coder role
    this.context.subscriptions.push(
      vscode.commands.registerCommand('thefuse.ai.consultCoder', async (role: AICoderRole, task: string, context: any) => {
        return this.consultAICoder(role, task, context);
      })
    );
  }
  
  /**
   * Handle incoming messages
   */
  private async handleMessage(message: any): Promise<void> {
    // Handle messages from other agents or AI coders
    this.log(`Received message: ${message.action} from ${message.sender}`);
    
    if (message.action === 'coderRequest') {
      try {
        const result = await this.consultAICoder(
          message.payload.role,
          message.payload.task,
          message.payload.context
        );
        
        await this.agentClient.sendMessage(
          message.sender,
          'coderResponse',
          {
            requestId: message.payload.requestId,
            result,
            success: true
          }
        );
      } catch (error) {
        await this.agentClient.sendMessage(
          message.sender,
          'coderResponse',
          {
            requestId: message.payload.requestId,
            error: error.message,
            success: false
          }
        );
      }
    }
  }
  
  /**
   * Start a collaborative coding task using all AI coder roles
   */
  private async startCollaborativeCoding(): Promise<void> {
    // Get the requirements from the user
    const requirements = await vscode.window.showInputBox({
      prompt: 'What do you want to build?',
      placeHolder: 'e.g., Create a React component that displays a paginated list of users'
    });
    
    if (!requirements) return;
    
    // Get the preferred programming language
    const languages = ['JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'Go', 'Rust', 'Other'];
    const language = await vscode.window.showQuickPick(languages, {
      placeHolder: 'Select the programming language'
    });
    
    if (!language) return;
    
    // Define collaboration flow (roles in sequence)
    const collaborationFlow = [
      AICoderRole.Architect,
      AICoderRole.Implementer,
      AICoderRole.Tester,
      AICoderRole.Reviewer,
      AICoderRole.Optimizer,
      AICoderRole.DocumentationWriter
    ];
    
    // Start the collaborative process
    vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'AI Collaborative Coding',
      cancellable: true
    }, async (progress, token) => {
      try {
        let context: any = {
          requirements,
          language,
          previousResults: {}
        };
        
        // Process each role in sequence
        for (let i = 0; i < collaborationFlow.length; i++) {
          if (token.isCancellationRequested) {
            throw new Error('Operation cancelled by user');
          }
          
          const role = collaborationFlow[i];
          const roleName = this.capitalizeFirstLetter(role);
          
          progress.report({ 
            message: `Step ${i+1}/${collaborationFlow.length}: ${roleName} is working...`,
            increment: (i / collaborationFlow.length) * 100
          });
          
          // Customize task based on role
          let task;
          switch (role) {
            case AICoderRole.Architect:
              task = `Design the architecture for: ${requirements}`;
              break;
            case AICoderRole.Implementer:
              task = `Implement code based on the architecture design`;
              break;
            case AICoderRole.Tester:
              task = `Write tests for the implemented code`;
              break;
            case AICoderRole.Reviewer:
              task = `Review the implemented code and provide feedback`;
              break;
            case AICoderRole.Optimizer:
              task = `Optimize the code for performance`;
              break;
            case AICoderRole.DocumentationWriter:
              task = `Write documentation for the code`;
              break;
          }
          
          // Execute the task for this role
          const result = await this.consultAICoder(role, task, context);
          
          // Add result to context for next roles
          context.previousResults[role] = result;
          
          // If this is the implementer, add the code to context
          if (role === AICoderRole.Implementer) {
            context.code = result.code;
          }
        }
        
        // Completed all steps
        progress.report({ message: 'Completed collaborative coding task!', increment: 100 });
        
        // Combine all results into a final document
        this.presentFinalResults(context.previousResults, requirements, language);
        
        return context.previousResults;
      } catch (error) {
        vscode.window.showErrorMessage(`Collaborative coding error: ${error.message}`);
        throw error;
      }
    });
  }
  
  /**
   * Analyze a code problem using multiple AI perspectives
   */
  private async analyzeCodeProblem(): Promise<void> {
    // Get the active editor
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor found');
      return;
    }
    
    // Get the selected code
    const selection = editor.selection;
    const code = selection.isEmpty 
      ? editor.document.getText() 
      : editor.document.getText(selection);
    
    if (!code || code.trim().length === 0) {
      vscode.window.showErrorMessage('No code selected');
      return;
    }
    
    // Get the problem description
    const problem = await vscode.window.showInputBox({
      prompt: 'What issue are you trying to solve?',
      placeHolder: 'e.g., This code is slow, or I need to add feature X'
    });
    
    if (!problem) return;
    
    const language = editor.document.languageId;
    
    // Define the roles to consult
    const roles = [
      AICoderRole.Architect,
      AICoderRole.Reviewer,
      AICoderRole.Optimizer
    ];
    
    // Start the analysis process
    vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'AI Code Analysis',
      cancellable: true
    }, async (progress, token) => {
      try {
        const context = {
          code,
          language,
          problem,
          previousResults: {}
        };
        
        // Get analysis from each role
        for (let i = 0; i < roles.length; i++) {
          if (token.isCancellationRequested) {
            throw new Error('Operation cancelled by user');
          }
          
          const role = roles[i];
          const roleName = this.capitalizeFirstLetter(role);
          
          progress.report({ 
            message: `${roleName} is analyzing...`,
            increment: (i / roles.length) * 100
          });
          
          // Customize task for each role
          const task = `Analyze this code and provide insights about the problem: "${problem}"`;
          
          // Get insights from this role
          const result = await this.consultAICoder(role, task, context);
          
          // Store result
          context.previousResults[role] = result;
        }
        
        // Show the combined analysis
        this.presentAnalysisResults(context.previousResults, problem);
        
        return context.previousResults;
      } catch (error) {
        vscode.window.showErrorMessage(`Code analysis error: ${error.message}`);
        throw error;
      }
    });
  }
  
  /**
   * Consult a specific AI coder role
   */
  private async consultAICoder(role: AICoderRole, task: string, context: any): Promise<any> {
    const coderSpecs = this.aiCoders.get(role);
    if (!coderSpecs) {
      throw new Error(`Unknown AI coder role: ${role}`);
    }
    
    this.log(`Consulting ${role} for task: ${task}`);
    
    // Create a request ID
    const requestId = `${role}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    
    // Prepare the request
    const request: AICoderRequest = {
      id: requestId,
      role,
      task,
      context,
      status: 'pending'
    };
    
    // Store the request
    this.activeRequests.set(requestId, request);
    
    try {
      // Update request status
      request.status = 'processing';
      
      // Construct prompt based on role and task
      const prompt = this.constructPromptForRole(coderSpecs, task, context);
      
      // Generate response using the LM bridge
      const lmResponse = await this.lmBridge.generateText({
        prompt,
        systemPrompt: coderSpecs.systemPrompt,
        maxTokens: 4000,
        temperature: 0.3
      });
      
      // Process the response based on role
      const result = this.processResponseForRole(role, lmResponse.text, context);
      
      // Update request status
      request.status = 'completed';
      request.result = result;
      
      return result;
    } catch (error) {
      // Update request with error
      request.status = 'failed';
      request.error = error.message;
      
      this.log(`Error consulting ${role}: ${error.message}`);
      throw error;
    } finally {
      // Clean up the request after a delay
      setTimeout(() => {
        this.activeRequests.delete(requestId);
      }, 60000); // Keep for 1 minute for debugging
    }
  }
  
  /**
   * Construct an appropriate prompt for each AI coder role
   */
  private constructPromptForRole(coderSpecs: AICoderSpecs, task: string, context: any): string {
    const { role } = coderSpecs;
    let prompt = `Task: ${task}\n\n`;
    
    // Add context information
    if (context.requirements) {
      prompt += `Requirements: ${context.requirements}\n\n`;
    }
    
    if (context.language) {
      prompt += `Language: ${context.language}\n\n`;
    }
    
    if (context.code) {
      prompt += `Code:\n\`\`\`${context.language || ''}\n${context.code}\n\`\`\`\n\n`;
    }
    
    if (context.problem) {
      prompt += `Problem: ${context.problem}\n\n`;
    }
    
    if (context.constraints && context.constraints.length > 0) {
      prompt += `Constraints: ${context.constraints.join(', ')}\n\n`;
    }
    
    // Add results from previous roles if available
    if (context.previousResults) {
      Object.entries(context.previousResults).forEach(([prevRole, result]) => {
        if (role !== prevRole) { // Don't include this role's own previous results
          prompt += `Previous ${this.capitalizeFirstLetter(prevRole)} Output:\n`;
          
          if (prevRole === AICoderRole.Architect && result.design) {
            prompt += `Design:\n${result.design}\n\n`;
            if (result.components) {
              prompt += `Components:\n${JSON.stringify(result.components, null, 2)}\n\n`;
            }
            if (result.interfaces) {
              prompt += `Interfaces:\n${JSON.stringify(result.interfaces, null, 2)}\n\n`;
            }
          } else if (prevRole === AICoderRole.Implementer && result.code) {
            prompt += `Implemented Code:\n\`\`\`${context.language || ''}\n${result.code}\n\`\`\`\n\n`;
          } else if (prevRole === AICoderRole.Tester && result.tests) {
            prompt += `Tests:\n\`\`\`${context.language || ''}\n${result.tests}\n\`\`\`\n\n`;
          } else if (prevRole === AICoderRole.Reviewer && result.feedback) {
            prompt += `Code Review:\n${result.feedback}\n\n`;
            if (result.issues) {
              prompt += `Issues:\n${JSON.stringify(result.issues, null, 2)}\n\n`;
            }
          } else if (prevRole === AICoderRole.Optimizer && result.optimizedCode) {
            prompt += `Optimized Code:\n\`\`\`${context.language || ''}\n${result.optimizedCode}\n\`\`\`\n\n`;
            if (result.optimizations) {
              prompt += `Optimizations:\n${result.optimizations}\n\n`;
            }
          } else {
            // Generic fallback for any role
            prompt += `${JSON.stringify(result, null, 2)}\n\n`;
          }
        }
      });
    }
    
    // Add role-specific instructions
    switch (role) {
      case AICoderRole.Architect:
        prompt += `
Design the architecture for this task. Include:
1. High-level design description
2. Component structure with responsibilities
3. Interfaces between components
4. Data flow diagram (in text form)
5. Key design decisions and their justifications

Format your response as:
{
  "design": "Detailed design description",
  "components": [{"name": "ComponentName", "responsibility": "What this component does", "dependencies": ["Other components it depends on"]}],
  "interfaces": [{"name": "InterfaceName", "methods": [{"name": "methodName", "parameters": ["param1", "param2"], "returnType": "type", "description": "what it does"}]}],
  "dataFlow": "Description of data flow",
  "decisions": [{"decision": "Design decision", "justification": "Why this approach was chosen", "alternatives": ["Other approaches considered"]}]
}
`;
        break;
        
      case AICoderRole.Implementer:
        prompt += `
Implement the code for this task based on the provided architecture and requirements. Your code should:
1. Follow the component structure from the architecture
2. Implement all specified interfaces
3. Be well-structured and maintainable
4. Include helpful comments
5. Follow best practices for the specified language

Format your response as:
{
  "code": "Your implementation here",
  "explanation": "Brief explanation of implementation details and decisions"
}
`;
        break;
        
      case AICoderRole.Tester:
        prompt += `
Write tests for the implemented code. Include:
1. Unit tests for individual components
2. Integration tests if appropriate
3. Edge case handling
4. Test coverage analysis

Format your response as:
{
  "tests": "Your test code here",
  "testStrategy": "Explanation of your testing approach",
  "coverage": "Description of what aspects of the code are covered by tests"
}
`;
        break;
        
      case AICoderRole.Reviewer:
        prompt += `
Review the implemented code and provide feedback. Include:
1. Identification of bugs or potential issues
2. Style and best practice violations
3. Performance concerns
4. Security considerations
5. Suggestions for improvement

Format your response as:
{
  "feedback": "Overall review feedback",
  "issues": [{"type": "bug|style|performance|security", "severity": "high|medium|low", "description": "Description of the issue", "suggestion": "How to fix it"}],
  "strengths": ["Aspects of the code that are well done"],
  "summary": "Summary assessment of code quality"
}
`;
        break;
        
      case AICoderRole.Optimizer:
        prompt += `
Optimize the code for better performance. Include:
1. Identifying performance bottlenecks
2. Algorithmic improvements
3. Memory usage optimizations
4. Refactored code with optimizations applied
5. Explanation of optimization benefits

Format your response as:
{
  "optimizedCode": "Your optimized code here",
  "optimizations": "Explanation of optimizations made",
  "benefits": "Expected performance improvements",
  "tradeoffs": "Any tradeoffs made (e.g., readability vs. performance)"
}
`;
        break;
        
      case AICoderRole.DocumentationWriter:
        prompt += `
Write documentation for the code. Include:
1. Overview of functionality
2. Usage examples
3. API documentation
4. Installation/setup instructions if applicable
5. Troubleshooting section

Format your response as:
{
  "documentation": "Full documentation in markdown format",
  "usageExamples": ["Example 1", "Example 2"],
  "apiReference": "Detailed API reference"
}
`;
        break;
    }
    
    return prompt;
  }
  
  /**
   * Process the response based on the AI coder role
   */
  private processResponseForRole(role: AICoderRole, responseText: string): any {
    
    // Try to parse the response as JSON
    try {
      // Extract JSON if it's wrapped in markdown code blocks
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonText = jsonMatch ? jsonMatch[1] : responseText;
      
      return JSON.parse(jsonText);
    } catch (error) {
      this.log(`Failed to parse JSON response for ${role}: ${error.message}`);
      
      // Fallback: try to extract structured information based on role
      switch (role) {
        case AICoderRole.Architect:
          return {
            design: responseText,
            components: []
          };
          
        case AICoderRole.Implementer:
          // Try to extract code blocks
          const codeMatch = responseText.match(/```(?:\w+)?\s*([\s\S]*?)```/);
          return {
            code: codeMatch ? codeMatch[1] : responseText,
            explanation: "Extracted from unstructured response"
          };
          
        case AICoderRole.Tester:
          const testCodeMatch = responseText.match(/```(?:\w+)?\s*([\s\S]*?)```/);
          return {
            tests: testCodeMatch ? testCodeMatch[1] : responseText,
            testStrategy: "Extracted from unstructured response"
          };
          
        case AICoderRole.Reviewer:
          return {
            feedback: responseText,
            issues: []
          };
          
        case AICoderRole.Optimizer:
          const optimizedCodeMatch = responseText.match(/```(?:\w+)?\s*([\s\S]*?)```/);
          return {
            optimizedCode: optimizedCodeMatch ? optimizedCodeMatch[1] : responseText,
            optimizations: "Extracted from unstructured response"
          };
          
        case AICoderRole.DocumentationWriter:
          return {
            documentation: responseText,
            usageExamples: [],
            apiReference: ""
          };
          
        default:
          return responseText;
      }
    }
  }
  
  /**
   * Present the final results of the collaborative coding task
   */
  private presentFinalResults(results: Record<AICoderRole, any>, requirements: string, language: string) {
    const finalDocument = `
# Collaborative Coding Results

## Requirements
${requirements}

## Language
${language}

## Architecture Design
${results[AICoderRole.Architect]?.design || 'N/A'}

## Implemented Code
\`\`\`${language}
${results[AICoderRole.Implementer]?.code || 'N/A'}
\`\`\`

## Tests
\`\`\`${language}
${results[AICoderRole.Tester]?.tests || 'N/A'}
\`\`\`

## Code Review
${results[AICoderRole.Reviewer]?.feedback || 'N/A'}

## Optimized Code
\`\`\`${language}
${results[AICoderRole.Optimizer]?.optimizedCode || 'N/A'}
\`\`\`

## Documentation
${results[AICoderRole.DocumentationWriter]?.documentation || 'N/A'}
`;
    
    // Show the final document in a new editor
    vscode.workspace.openTextDocument({ content: finalDocument, language: 'markdown' })
      .then(doc => vscode.window.showTextDocument(doc));
  }
  
  /**
   * Present the combined analysis results
   */
  private presentAnalysisResults(results: Record<AICoderRole, any>, problem: string) {
    const analysisDocument = `
# Code Analysis Results

## Problem
${problem}

## Architecture Insights
${results[AICoderRole.Architect]?.design || 'N/A'}

## Code Review
${results[AICoderRole.Reviewer]?.feedback || 'N/A'}

## Optimized Code
\`\`\`${results[AICoderRole.Optimizer]?.optimizedCode || 'N/A'}
\`\`\`
`;
    
    // Show the analysis document in a new editor
    vscode.workspace.openTextDocument({ content: analysisDocument, language: 'markdown' })
      .then(doc => vscode.window.showTextDocument(doc));
  }
  
  /**
   * Capitalize the first letter of a string
   */
  private capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  /**
   * Log a message to the output channel
   */
  private log(message: string) {
    this.outputChannel.appendLine(`[AI Coder Integration] ${message}`);
  }
}
