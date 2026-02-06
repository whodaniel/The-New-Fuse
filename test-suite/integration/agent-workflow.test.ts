import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getAuthToken, setupTestApp, cleanupTestData } from '../test-utils/test-helpers';
import { AuthService } from '../../../apps/api/src/services/auth.service';
import { AgentService } from '../../../apps/api/src/services/agent.service';
import { WorkflowService } from '../../../apps/api/src/services/workflow.service';
import { DatabaseService } from '../../../apps/api/src/services/db.service';
import { ExecutionService } from '../../../apps/api/src/services/execution.service';
import request from 'supertest';

describe('Agent Workflow Integration Tests', () => {
  let app: INestApplication;
  let authService: AuthService;
  let agentService: AgentService;
  let workflowService: WorkflowService;
  let dbService: DatabaseService;
  let executionService: ExecutionService;

  beforeAll(async () => {
    app = await setupTestApp();
    authService = app.get(AuthService);
    agentService = app.get(AgentService);
    workflowService = app.get(WorkflowService);
    dbService = app.get(DatabaseService);
    executionService = app.get(ExecutionService);
  });

  afterAll(async () => {
    await cleanupTestData(app);
    await app.close();
  });

  describe('Complete Agent-Workflow Integration', () => {
    it('should handle end-to-end agent workflow creation and execution', async () => {
      // 1. Create authenticated user
      const userData = {
        email: 'agentworkflow@example.com',
        password: 'AgentWorkflow123!',
        firstName: 'Agent',
        lastName: 'Workflow'
      };

      const registerResponse = await authService.register(userData);
      const userId = registerResponse.user.id;
      const accessToken = registerResponse.accessToken;

      // 2. Create agent
      const agentData = {
        name: 'Customer Service Agent',
        description: 'Handles customer inquiries and support',
        type: 'assistant',
        capabilities: ['chat', 'analysis', 'problem_solving'],
        configuration: {
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 1000,
          systemPrompt: 'You are a helpful customer service representative.'
        }
      };

      const agent = await agentService.createAgent(agentData, userId);
      expect(agent).toMatchObject({
        id: expect.any(String),
        name: agentData.name,
        userId: userId,
        status: 'active'
      });

      // 3. Create workflow that uses the agent
      const workflowData = {
        name: 'Customer Support Workflow',
        description: 'Automated customer support process',
        steps: [
          {
            id: 'step-1',
            type: 'input',
            config: {
              prompt: 'What is your customer inquiry?',
              inputType: 'textarea',
              required: true
            }
          },
          {
            id: 'step-2',
            type: 'agent',
            config: {
              agentId: agent.id,
              inputField: 'step1',
              outputField: 'agent_response',
              systemPrompt: 'Please provide helpful assistance for this inquiry.'
            }
          },
          {
            id: 'step-3',
            type: 'decision',
            config: {
              condition: '{{agent_response.sentiment}} === "negative"',
              truePath: 'escalation',
              falsePath: 'completion'
            }
          },
          {
            id: 'step-4',
            type: 'agent',
            config: {
              agentId: agent.id,
              inputField: 'step1',
              outputField: 'escalation_response',
              systemPrompt: 'This is an escalation. Please provide priority support.'
            }
          }
        ],
        triggers: [
          {
            type: 'webhook',
            conditions: [
              {
                field: 'event',
                operator: 'equals',
                value: 'customer_inquiry'
              }
            ]
          }
        ]
      };

      const workflow = await workflowService.createWorkflow(workflowData, userId);
      expect(workflow).toMatchObject({
        id: expect.any(String),
        name: workflowData.name,
        userId: userId,
        status: 'active'
      });

      // 4. Execute workflow
      const executionData = {
        input: {
          step1: 'I am having trouble with my order delivery'
        }
      };

      const execution = await workflowService.executeWorkflow(
        workflow.id,
        executionData.input,
        userId
      );

      expect(execution).toMatchObject({
        id: expect.any(String),
        workflowId: workflow.id,
        status: expect.any(String),
        userId: userId
      });

      // 5. Monitor execution progress
      let finalExecution = await executionService.getExecution(execution.id, userId);
      
      // Wait for execution to complete (with timeout)
      const maxWaitTime = 30000; // 30 seconds
      const startTime = Date.now();
      
      while (finalExecution.status === 'pending' || finalExecution.status === 'running') {
        if (Date.now() - startTime > maxWaitTime) {
          break; // Timeout
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        finalExecution = await executionService.getExecution(execution.id, userId);
      }

      // 6. Verify execution results
      expect(finalExecution.status).toBe('completed');
      expect(finalExecution.outputData).toBeDefined();
      expect(finalExecution.outputData.agent_response).toBeDefined();

      // 7. Clean up resources
      await workflowService.deleteWorkflow(workflow.id, userId);
      await agentService.deleteAgent(agent.id, userId);
    });

    it('should handle multiple agents in a single workflow', async () => {
      const userData = {
        email: 'multiagent@example.com',
        password: 'MultiAgent123!',
        firstName: 'Multi',
        lastName: 'Agent'
      };

      const registerResponse = await authService.register(userData);
      const userId = registerResponse.user.id;

      // Create multiple specialized agents
      const agents = await Promise.all([
        agentService.createAgent({
          name: 'Research Agent',
          description: 'Handles research and information gathering',
          type: 'researcher',
          capabilities: ['research', 'analysis', 'summarization'],
          configuration: {
            model: 'gpt-4',
            temperature: 0.3,
            systemPrompt: 'You are a research specialist. Provide accurate, well-sourced information.'
          }
        }, userId),
        agentService.createAgent({
          name: 'Creative Agent',
          description: 'Handles creative and writing tasks',
          type: 'creator',
          capabilities: ['writing', 'creative', 'brainstorming'],
          configuration: {
            model: 'gpt-3.5-turbo',
            temperature: 0.8,
            systemPrompt: 'You are a creative writer. Generate engaging and original content.'
          }
        }, userId),
        agentService.createAgent({
          name: 'Technical Agent',
          description: 'Handles technical and coding tasks',
          type: 'technician',
          capabilities: ['coding', 'debugging', 'technical_analysis'],
          configuration: {
            model: 'gpt-4',
            temperature: 0.2,
            systemPrompt: 'You are a technical expert. Provide precise, accurate technical guidance.'
          }
        }, userId)
      ]);

      // Create workflow that uses all three agents
      const workflowData = {
        name: 'Multi-Agent Content Creation',
        description: 'Content creation pipeline using multiple specialized agents',
        steps: [
          {
            id: 'research',
            type: 'input',
            config: {
              prompt: 'What topic would you like me to research?',
              inputType: 'text',
              required: true
            }
          },
          {
            id: 'research_agent',
            type: 'agent',
            config: {
              agentId: agents[0].id,
              inputField: 'research',
              outputField: 'research_data',
              systemPrompt: 'Research the given topic thoroughly and provide comprehensive findings.'
            }
          },
          {
            id: 'creative_agent',
            type: 'agent',
            config: {
              agentId: agents[1].id,
              inputField: 'research_data',
              outputField: 'creative_content',
              systemPrompt: 'Based on the research, create engaging and creative content.'
            }
          },
          {
            id: 'technical_review',
            type: 'agent',
            config: {
              agentId: agents[2].id,
              inputField: 'creative_content',
              outputField: 'technical_review',
              systemPrompt: 'Review the content from a technical perspective and provide feedback.'
            }
          },
          {
            id: 'final_output',
            type: 'output',
            config: {
              format: 'json',
              template: {
                topic: '{{research}}',
                research: '{{research_data}}',
                content: '{{creative_content}}',
                technical_feedback: '{{technical_review}}'
              }
            }
          }
        ],
        triggers: [
          {
            type: 'manual',
            conditions: []
          }
        ]
      };

      const workflow = await workflowService.createWorkflow(workflowData, userId);

      // Execute workflow
      const executionData = {
        input: {
          research: 'The impact of artificial intelligence on modern education'
        }
      };

      const execution = await workflowService.executeWorkflow(
        workflow.id,
        executionData.input,
        userId
      );

      // Wait for completion
      let finalExecution = await executionService.getExecution(execution.id, userId);
      const startTime = Date.now();

      while (finalExecution.status !== 'completed' && Date.now() - startTime < 45000) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        finalExecution = await executionService.getExecution(execution.id, userId);
      }

      expect(finalExecution.status).toBe('completed');
      expect(finalExecution.outputData.final_output).toBeDefined();

      // Clean up
      await workflowService.deleteWorkflow(workflow.id, userId);
      await Promise.all(agents.map(agent => 
        agentService.deleteAgent(agent.id, userId)
      ));
    });

    it('should handle conditional agent workflows', async () => {
      const userData = {
        email: 'conditional@example.com',
        password: 'Conditional123!',
        firstName: 'Conditional',
        lastName: 'Workflow'
      };

      const registerResponse = await authService.register(userData);
      const userId = registerResponse.user.id;

      // Create agents with different specializations
      const supportAgent = await agentService.createAgent({
        name: 'Support Agent',
        description: 'Handles general support requests',
        type: 'support',
        capabilities: ['chat', 'troubleshooting'],
        configuration: {
          model: 'gpt-3.5-turbo',
          temperature: 0.5,
          systemPrompt: 'You are a helpful support agent.'
        }
      }, userId);

      const technicalAgent = await agentService.createAgent({
        name: 'Technical Agent',
        description: 'Handles technical issues',
        type: 'technical',
        capabilities: ['technical_support', 'debugging'],
        configuration: {
          model: 'gpt-4',
          temperature: 0.3,
          systemPrompt: 'You are a technical support specialist.'
        }
      }, userId);

      // Create workflow with conditional logic
      const workflowData = {
        name: 'Smart Support Routing',
        description: 'Routes support requests to appropriate agents',
        steps: [
          {
            id: 'ticket',
            type: 'input',
            config: {
              prompt: 'Describe your issue',
              inputType: 'textarea',
              required: true
            }
          },
          {
            id: 'classify',
            type: 'agent',
            config: {
              agentId: supportAgent.id,
              inputField: 'ticket',
              outputField: 'classification',
              systemPrompt: 'Classify this issue as "technical" or "general" and explain your reasoning.'
            }
          },
          {
            id: 'decision',
            type: 'decision',
            config: {
              condition: '{{classification.issue_type}} === "technical"',
              truePath: 'technical_handler',
              falsePath: 'general_handler'
            }
          },
          {
            id: 'technical_handler',
            type: 'agent',
            config: {
              agentId: technicalAgent.id,
              inputField: 'ticket',
              outputField: 'technical_response',
              systemPrompt: 'Provide technical support for this issue.'
            }
          },
          {
            id: 'general_handler',
            type: 'agent',
            config: {
              agentId: supportAgent.id,
              inputField: 'ticket',
              outputField: 'general_response',
              systemPrompt: 'Provide general support for this issue.'
            }
          },
          {
            id: 'final_response',
            type: 'output',
            config: {
              format: 'json',
              template: {
                issue: '{{ticket}}',
                classification: '{{classification}}',
                response: '{{technical_response || general_response}}'
              }
            }
          }
        ],
        triggers: [
          {
            type: 'webhook',
            conditions: [
              {
                field: 'type',
                operator: 'equals',
                value: 'support_request'
              }
            ]
          }
        ]
      };

      const workflow = await workflowService.createWorkflow(workflowData, userId);

      // Test with technical issue
      const technicalExecution = await workflowService.executeWorkflow(
        workflow.id,
        { ticket: 'My application is throwing a 500 error when I try to process payments' },
        userId
      );

      // Wait for completion
      let finalTechnicalExecution = await executionService.getExecution(
        technicalExecution.id, 
        userId
      );
      const startTime = Date.now();

      while (finalTechnicalExecution.status !== 'completed' && 
             Date.now() - startTime < 30000) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        finalTechnicalExecution = await executionService.getExecution(
          technicalExecution.id, 
          userId
        );
      }

      expect(finalTechnicalExecution.status).toBe('completed');
      expect(finalTechnicalExecution.outputData.technical_response).toBeDefined();

      // Test with general issue
      const generalExecution = await workflowService.executeWorkflow(
        workflow.id,
        { ticket: 'How do I change my password?' },
        userId
      );

      // Wait for completion
      let finalGeneralExecution = await executionService.getExecution(
        generalExecution.id, 
        userId
      );
      
      const generalStartTime = Date.now();
      while (finalGeneralExecution.status !== 'completed' && 
             Date.now() - generalStartTime < 30000) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        finalGeneralExecution = await executionService.getExecution(
          generalExecution.id, 
          userId
        );
      }

      expect(finalGeneralExecution.status).toBe('completed');
      expect(finalGeneralExecution.outputData.general_response).toBeDefined();

      // Clean up
      await workflowService.deleteWorkflow(workflow.id, userId);
      await agentService.deleteAgent(supportAgent.id, userId);
      await agentService.deleteAgent(technicalAgent.id, userId);
    });
  });

  describe('Agent Workflow Performance and Scalability', () => {
    it('should handle concurrent workflow executions efficiently', async () => {
      const userData = {
        email: 'concurrent@example.com',
        password: 'Concurrent123!',
        firstName: 'Concurrent',
        lastName: 'Test'
      };

      const registerResponse = await authService.register(userData);
      const userId = registerResponse.user.id;

      // Create a simple agent
      const agent = await agentService.createAgent({
        name: 'Quick Response Agent',
        description: 'Fast response agent for testing',
        type: 'assistant',
        capabilities: ['chat'],
        configuration: {
          model: 'gpt-3.5-turbo',
          temperature: 0.5,
          systemPrompt: 'Provide quick, helpful responses.'
        }
      }, userId);

      // Create simple workflow
      const workflow = await workflowService.createWorkflow({
        name: 'Concurrent Test Workflow',
        description: 'Testing concurrent execution',
        steps: [
          {
            id: 'input',
            type: 'input',
            config: {
              prompt: 'What can you help with?',
              inputType: 'text'
            }
          },
          {
            id: 'agent',
            type: 'agent',
            config: {
              agentId: agent.id,
              inputField: 'input',
              outputField: 'response'
            }
          }
        ],
        triggers: [
          {
            type: 'manual',
            conditions: []
          }
        ]
      }, userId);

      const startTime = Date.now();

      // Execute multiple workflows concurrently
      const executions = await Promise.all(
        Array(10).fill(null).map((_, i) =>
          workflowService.executeWorkflow(
            workflow.id,
            { input: `Test message ${i}` },
            userId
          )
        )
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should handle 10 concurrent executions efficiently
      expect(duration).toBeLessThan(30000); // 30 seconds
      expect(executions).toHaveLength(10);

      // Wait for all to complete
      const completions = await Promise.all(
        executions.map(async (execution) => {
          let finalExecution = await executionService.getExecution(execution.id, userId);
          const startWait = Date.now();

          while (finalExecution.status !== 'completed' && 
                 Date.now() - startWait < 20000) {
            await new Promise(resolve => setTimeout(resolve, 500));
            finalExecution = await executionService.getExecution(execution.id, userId);
          }

          return finalExecution.status;
        })
      );

      // All should complete
      expect(completions.every(status => status === 'completed')).toBe(true);

      // Clean up
      await workflowService.deleteWorkflow(workflow.id, userId);
      await agentService.deleteAgent(agent.id, userId);
    });

    it('should handle large workflow with many agents', async () => {
      const userData = {
        email: 'largeworkflow@example.com',
        password: 'LargeWorkflow123!',
        firstName: 'Large',
        lastName: 'Workflow'
      };

      const registerResponse = await authService.register(userData);
      const userId = registerResponse.user.id;

      // Create multiple agents
      const agents = await Promise.all(
        Array(5).fill(null).map((_, i) =>
          agentService.createAgent({
            name: `Agent ${i + 1}`,
            description: `Agent number ${i + 1}`,
            type: 'assistant',
            capabilities: ['chat'],
            configuration: {
              model: 'gpt-3.5-turbo',
              temperature: 0.5,
              systemPrompt: `You are agent ${i + 1}.`
            }
          }, userId)
        )
      );

      // Create large workflow
      const steps = [
        {
          id: 'input',
          type: 'input',
          config: {
            prompt: 'Enter your request',
            inputType: 'text'
          }
        }
      ];

      // Add many agent steps
      agents.forEach((agent, i) => {
        steps.push({
          id: `agent_${i + 1}`,
          type: 'agent',
          config: {
            agentId: agent.id,
            inputField: 'input',
            outputField: `response_${i + 1}`
          }
        });
      });

      steps.push({
        id: 'final',
        type: 'output',
        config: {
          format: 'json',
          template: {
            input: '{{input}}',
            responses: agents.map((_, i) => `{{response_${i + 1}}}`)
          }
        }
      });

      const workflow = await workflowService.createWorkflow({
        name: 'Large Agent Workflow',
        description: 'Workflow with many agents',
        steps: steps,
        triggers: [
          {
            type: 'manual',
            conditions: []
          }
        ]
      }, userId);

      const startTime = Date.now();

      const execution = await workflowService.executeWorkflow(
        workflow.id,
        { input: 'Test with many agents' },
        userId
      );

      let finalExecution = await executionService.getExecution(execution.id, userId);
      const maxWaitTime = 60000; // 1 minute for large workflow

      while (finalExecution.status !== 'completed' && 
             Date.now() - startTime < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        finalExecution = await executionService.getExecution(execution.id, userId);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(finalExecution.status).toBe('completed');
      expect(duration).toBeLessThan(maxWaitTime);

      // Clean up
      await workflowService.deleteWorkflow(workflow.id, userId);
      await Promise.all(agents.map(agent => 
        agentService.deleteAgent(agent.id, userId)
      ));
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle agent failures gracefully', async () => {
      const userData = {
        email: 'agenterror@example.com',
        password: 'AgentError123!',
        firstName: 'Agent',
        lastName: 'Error'
      };

      const registerResponse = await authService.register(userData);
      const userId = registerResponse.user.id;

      // Create agent
      const agent = await agentService.createAgent({
        name: 'Failing Agent',
        description: 'Agent that will fail',
        type: 'assistant',
        capabilities: ['chat'],
        configuration: {
          model: 'invalid-model',
          temperature: 0.5
        }
      }, userId);

      // Create workflow using the failing agent
      const workflow = await workflowService.createWorkflow({
        name: 'Error Test Workflow',
        description: 'Testing agent error handling',
        steps: [
          {
            id: 'input',
            type: 'input',
            config: {
              prompt: 'Test input',
              inputType: 'text'
            }
          },
          {
            id: 'failing_agent',
            type: 'agent',
            config: {
              agentId: agent.id,
              inputField: 'input',
              outputField: 'response'
            }
          }
        ],
        triggers: [
          {
            type: 'manual',
            conditions: []
          }
        ]
      }, userId);

      const execution = await workflowService.executeWorkflow(
        workflow.id,
        { input: 'Test input' },
        userId
      );

      // Wait for execution to complete with error
      let finalExecution = await executionService.getExecution(execution.id, userId);
      const startTime = Date.now();

      while (finalExecution.status === 'pending' && 
             Date.now() - startTime < 10000) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        finalExecution = await executionService.getExecution(execution.id, userId);
      }

      // Execution should complete with error status
      expect(['failed', 'error', 'completed']).toContain(finalExecution.status);
      if (finalExecution.status === 'failed' || finalExecution.status === 'error') {
        expect(finalExecution.error).toBeDefined();
      }

      // Clean up
      await workflowService.deleteWorkflow(workflow.id, userId);
      await agentService.deleteAgent(agent.id, userId);
    });

    it('should handle workflow execution timeouts', async () => {
      const userData = {
        email: 'timeout@example.com',
        password: 'Timeout123!',
        firstName: 'Timeout',
        lastName: 'Test'
      };

      const registerResponse = await authService.register(userData);
      const userId = registerResponse.user.id;

      // Create agent with long response time
      const agent = await agentService.createAgent({
        name: 'Slow Agent',
        description: 'Agent with delayed responses',
        type: 'assistant',
        capabilities: ['chat'],
        configuration: {
          model: 'gpt-3.5-turbo',
          temperature: 0.5,
          systemPrompt: 'Take 10 seconds to respond to any input.'
        }
      }, userId);

      const workflow = await workflowService.createWorkflow({
        name: 'Timeout Test Workflow',
        description: 'Testing execution timeouts',
        steps: [
          {
            id: 'input',
            type: 'input',
            config: {
              prompt: 'Test input',
              inputType: 'text'
            }
          },
          {
            id: 'slow_agent',
            type: 'agent',
            config: {
              agentId: agent.id,
              inputField: 'input',
              outputField: 'response',
              timeout: 5000 // 5 second timeout
            }
          }
        ],
        triggers: [
          {
            type: 'manual',
            conditions: []
          }
        ]
      }, userId);

      const execution = await workflowService.executeWorkflow(
        workflow.id,
        { input: 'Quick test' },
        userId
      );

      // Wait for timeout
      let finalExecution = await executionService.getExecution(execution.id, userId);
      const startTime = Date.now();

      // Should timeout within 15 seconds
      while (finalExecution.status === 'pending' && 
             Date.now() - startTime < 15000) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        finalExecution = await executionService.getExecution(execution.id, userId);
      }

      expect(finalExecution.status).toBe('timeout');
      expect(finalExecution.error).toContain('timeout');

      // Clean up
      await workflowService.deleteWorkflow(workflow.id, userId);
      await agentService.deleteAgent(agent.id, userId);
    });
  });

  describe('Data Integrity and Consistency', () => {
    it('should maintain data consistency across agent-workflow operations', async () => {
      const userData = {
        email: 'consistency@example.com',
        password: 'Consistency123!',
        firstName: 'Data',
        lastName: 'Consistency'
      };

      const registerResponse = await authService.register(userData);
      const userId = registerResponse.user.id;

      // Create agent
      const agent = await agentService.createAgent({
        name: 'Consistency Test Agent',
        description: 'Testing data consistency',
        type: 'assistant',
        capabilities: ['chat'],
        configuration: {
          model: 'gpt-3.5-turbo',
          temperature: 0.5
        }
      }, userId);

      // Create workflow
      const workflow = await workflowService.createWorkflow({
        name: 'Consistency Test Workflow',
        description: 'Testing data integrity',
        steps: [
          {
            id: 'input',
            type: 'input',
            config: {
              prompt: 'Test input',
              inputType: 'text'
            }
          },
          {
            id: 'agent',
            type: 'agent',
            config: {
              agentId: agent.id,
              inputField: 'input',
              outputField: 'response'
            }
          }
        ],
        triggers: [
          {
            type: 'manual',
            conditions: []
          }
        ]
      }, userId);

      // Execute workflow multiple times
      const executions = await Promise.all([
        workflowService.executeWorkflow(workflow.id, { input: 'Test 1' }, userId),
        workflowService.executeWorkflow(workflow.id, { input: 'Test 2' }, userId),
        workflowService.executeWorkflow(workflow.id, { input: 'Test 3' }, userId)
      ]);

      // Verify all executions are recorded
      const workflowExecutions = await executionService.getWorkflowExecutions(
        workflow.id,
        userId,
        { limit: 10, page: 1 }
      );

      expect(workflowExecutions.data.length).toBeGreaterThanOrEqual(3);
      expect(workflowExecutions.data.every(e => e.workflowId === workflow.id)).toBe(true);
      expect(workflowExecutions.data.every(e => e.userId === userId)).toBe(true);

      // Verify agent usage tracking
      const agentExecutions = await executionService.getAgentExecutions(
        agent.id,
        userId
      );

      expect(agentExecutions.length).toBeGreaterThanOrEqual(3);

      // Clean up
      await workflowService.deleteWorkflow(workflow.id, userId);
      await agentService.deleteAgent(agent.id, userId);
    });
  });
});