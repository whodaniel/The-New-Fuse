import { WorkflowTemplate, WorkflowStepType, WorkflowStep } from '@the-new-fuse/types';

const now = new Date();

export const agenticCommunicationTemplate: WorkflowTemplate = {
  id: 'agentic-communication-flow',
  name: 'Agentic Communication Flow',
  description: 'Template for agentic communication flows based on AI Diplomacy schema',
  version: '1.0.0',
  metadata: {
    createdAt: now,
    updatedAt: now,
    startStep: 'initialize'
  },
  steps: [
    {
      id: 'initialize',
      name: 'Initialization',
      type: WorkflowStepType.TASK,
      parameters: {},
      dependencies: [],
      status: 'pending',
      startTime: null,
      endTime: null,
      error: undefined,
      action: async (_context) => {
        // Set initial goals and relationships
      }
    } as WorkflowStep,
    {
      id: 'negotiation',
      name: 'Negotiation Phase',
      type: WorkflowStepType.TASK,
      parameters: { phase: 'negotiation' },
      dependencies: ['initialize'],
      status: 'pending',
      startTime: null,
      endTime: null,
      error: undefined,
      action: async (_context) => {
        // Generate messages and update relationships
      }
    } as WorkflowStep,
    {
      id: 'planning',
      name: 'Planning Phase',
      type: WorkflowStepType.TASK,
      parameters: { phase: 'planning' },
      dependencies: ['negotiation'],
      status: 'pending',
      startTime: null,
      endTime: null,
      error: undefined,
      action: async (_context) => {
        // Produce strategic directives
      }
    } as WorkflowStep,
    {
      id: 'order-generation',
      name: 'Order Generation',
      type: WorkflowStepType.TASK,
      parameters: { phase: 'order-generation' },
      dependencies: ['planning'],
      status: 'pending',
      startTime: null,
      endTime: null,
      error: undefined,
      action: async (_context) => {
        // Choose and issue moves
      }
    } as WorkflowStep,
    {
      id: 'state-update',
      name: 'State Update',
      type: WorkflowStepType.TASK,
      parameters: { phase: 'state-update' },
      dependencies: ['order-generation'],
      status: 'pending',
      startTime: null,
      endTime: null,
      error: undefined,
      action: async (_context) => {
        // Ingest results and revise goals/relationships
      }
    } as WorkflowStep,
    {
      id: 'memory-consolidation',
      name: 'Memory Consolidation',
      type: WorkflowStepType.TASK,
      parameters: { phase: 'memory-consolidation' },
      dependencies: ['state-update'],
      status: 'pending',
      startTime: null,
      endTime: null,
      error: undefined,
      action: async (_context) => {
        // Summarize diaries and update memory store
      }
    } as WorkflowStep
  ]
};
