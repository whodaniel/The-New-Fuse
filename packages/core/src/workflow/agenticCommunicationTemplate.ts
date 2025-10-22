import { WorkflowTemplate, WorkflowStepType, WorkflowStep } from '@the-new-fuse/types';

export const agenticCommunicationTemplate: WorkflowTemplate = {
  id: 'agentic-communication-flow',
  name: 'Agentic Communication Flow',
  description: 'Template for agentic communication flows based on AI Diplomacy schema',
  version: '1.0.0',
  config: {
    startStep: 'initialize',
    steps: [
      {
        id: 'initialize',
        name: 'Initialize Communication',
        type: WorkflowStepType.INITIALIZATION,
        parameters: {
          phase: 'initialization',
          setupCommunicationChannels: true,
          initializeAgentStates: true
        },
        dependencies: [],
        status: 'pending'
      },
      {
        id: 'negotiation',
        name: 'Negotiation Phase',
        type: WorkflowStepType.AGENT_COMMUNICATION,
        parameters: {
          phase: 'negotiation',
          communicationType: 'multi-party',
          maxRounds: 10,
          timeout: 300000
        },
        dependencies: ['initialize'],
        status: 'pending'
      },
      {
        id: 'planning',
        name: 'Planning Phase',
        type: WorkflowStepType.PLANNING,
        parameters: {
          phase: 'planning',
          planningStrategy: 'collaborative',
          includeRiskAssessment: true
        },
        dependencies: ['negotiation'],
        status: 'pending'
      },
      {
        id: 'order-generation',
        name: 'Order Generation',
        type: WorkflowStepType.TASK_EXECUTION,
        parameters: {
          phase: 'order-generation',
          orderType: 'coordinated',
          validateOrders: true
        },
        dependencies: ['planning'],
        status: 'pending'
      },
      {
        id: 'state-update',
        name: 'State Update',
        type: WorkflowStepType.STATE_MANAGEMENT,
        parameters: {
          phase: 'state-update',
          updateType: 'incremental',
          persistState: true
        },
        dependencies: ['order-generation'],
        status: 'pending'
      },
      {
        id: 'memory-consolidation',
        name: 'Memory Consolidation',
        type: WorkflowStepType.MEMORY_MANAGEMENT,
        parameters: {
          phase: 'memory-consolidation',
          consolidationType: 'episodic',
          retentionPolicy: 'long-term'
        },
        dependencies: ['state-update'],
        status: 'pending'
      }
    ],
    metadata: {
      tags: ['agentic', 'communication', 'diplomacy', 'multi-agent'],
      author: 'The New Fuse',
      created: new Date(),
      lastModified: new Date()
    }
  }
};

export default agenticCommunicationTemplate;
