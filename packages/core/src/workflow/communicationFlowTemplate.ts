import { WorkflowTemplate, WorkflowStepType, WorkflowStep } from '@the-new-fuse/types';

const now = new Date();

/**
 * Detailed AI Diplomacy Agentic Workflow Template.
 * This template matches the full agentic workflow as described in the Mermaid diagram and PDF.
 */
export const communicationFlowTemplate: WorkflowTemplate = {
  id: 'ai-diplomacy-agentic-flow',
  name: 'AI Diplomacy Agentic Flow',
  description: 'Detailed agentic workflow for AI Diplomacy, including context construction, memory, diaries, and phase transitions.',
  version: '2.0.0',
  metadata: {
    createdAt: now,
    updatedAt: now,
    startStep: 'context-construction'
  },
  steps: [
    {
      id: 'context-construction',
      name: 'Context Construction',
      type: WorkflowStepType.TASK,
      parameters: {
        includes: [
          'Game State Information',
          'Memory System',
          'Dynamic Goals',
          'Relationships',
          'Private Diary',
          'Negotiation Diary',
          'Order Diary',
          'Phase Result Diary',
          'Diary Consolidation',
          'Private Journal',
          'Possible Order Context',
          'build_context_prompt',
          'Recent Context'
        ]
      },
      dependencies: [],
      status: 'pending',
      startTime: null,
      endTime: null,
      error: undefined,
      action: async (_context) => {
        // Aggregate all context information for the agent
      }
    } as WorkflowStep,
    {
      id: 'initialization',
      name: 'Initialization',
      type: WorkflowStepType.TASK,
      parameters: {
        action: 'Set initial goals & relationships'
      },
      dependencies: ['context-construction'],
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
      name: 'Negotiation',
      type: WorkflowStepType.TASK,
      parameters: {
        action: 'Generate messages, update relationships'
      },
      dependencies: ['initialization'],
      status: 'pending',
      startTime: null,
      endTime: null,
      error: undefined,
      action: async (_context) => {
        // Generate negotiation messages and update relationships
      }
    } as WorkflowStep,
    {
      id: 'negotiation-diary',
      name: 'Negotiation Diary',
      type: WorkflowStepType.SUB_WORKFLOW,
      parameters: {
        includes: [
          'Message Analysis',
          'Trust Assessment',
          'Relationship Changes'
        ]
      },
      dependencies: ['negotiation'],
      status: 'pending',
      startTime: null,
      endTime: null,
      error: undefined,
      action: async (_context) => {
        // Analyze negotiation messages, trust, and relationship changes
      }
    } as WorkflowStep,
    {
      id: 'planning',
      name: 'Planning',
      type: WorkflowStepType.TASK,
      parameters: {
        action: 'Strategic directives'
      },
      dependencies: ['negotiation-diary'],
      status: 'pending',
      startTime: null,
      endTime: null,
      error: undefined,
      action: async (_context) => {
        // Generate strategic directives
      }
    } as WorkflowStep,
    {
      id: 'order-generation',
      name: 'Order Generation',
      type: WorkflowStepType.TASK,
      parameters: {
        action: 'Choose moves'
      },
      dependencies: ['planning'],
      status: 'pending',
      startTime: null,
      endTime: null,
      error: undefined,
      action: async (_context) => {
        // Choose and issue moves/orders
      }
    } as WorkflowStep,
    {
      id: 'order-diary',
      name: 'Order Diary',
      type: WorkflowStepType.SUB_WORKFLOW,
      parameters: {
        includes: [
          'Strategic Reasoning',
          'Risk/Reward Analysis'
        ]
      },
      dependencies: ['order-generation'],
      status: 'pending',
      startTime: null,
      endTime: null,
      error: undefined,
      action: async (_context) => {
        // Analyze order reasoning and risk/reward
      }
    } as WorkflowStep,
    {
      id: 'state-update',
      name: 'State Update',
      type: WorkflowStepType.TASK,
      parameters: {
        action: 'Revise goals & relationships'
      },
      dependencies: ['order-diary'],
      status: 'pending',
      startTime: null,
      endTime: null,
      error: undefined,
      action: async (_context) => {
        // Revise goals and relationships based on phase results
      }
    } as WorkflowStep,
    {
      id: 'phase-result-diary',
      name: 'Phase Result Diary',
      type: WorkflowStepType.SUB_WORKFLOW,
      parameters: {
        includes: [
          'Outcome Analysis',
          'Betrayal Detection',
          'Success Evaluation'
        ]
      },
      dependencies: ['state-update'],
      status: 'pending',
      startTime: null,
      endTime: null,
      error: undefined,
      action: async (_context) => {
        // Analyze phase results, betrayal, and success
      }
    } as WorkflowStep,
    {
      id: 'diary-consolidation',
      name: 'Diary Consolidation',
      type: WorkflowStepType.SUB_WORKFLOW,
      parameters: {
        includes: [
          'Phase Summary',
          'Successful Moves',
          'Failed Moves',
          'Board Changes',
          'Yearly summaries via Gemini Flash'
        ]
      },
      dependencies: ['phase-result-diary'],
      status: 'pending',
      startTime: null,
      endTime: null,
      error: undefined,
      action: async (_context) => {
        // Consolidate diaries and summarize
      }
    } as WorkflowStep,
    {
      id: 'memory-update',
      name: 'Memory System Update',
      type: WorkflowStepType.TASK,
      parameters: {
        includes: [
          'Summarized Game State',
          'Game History',
          'Phase Summary',
          'Dynamic Goals',
          'Relationships',
          'Private Diary',
          'Negotiation Diary',
          'Order Diary',
          'Phase Result Diary',
          'Diary Consolidation',
          'Private Journal'
        ]
      },
      dependencies: ['diary-consolidation'],
      status: 'pending',
      startTime: null,
      endTime: null,
      error: undefined,
      action: async (_context) => {
        // Update memory system with consolidated information
      }
    } as WorkflowStep,
    {
      id: 'loop',
      name: 'Loop to Next Phase',
      type: WorkflowStepType.TASK,
      parameters: {
        action: 'Return to Negotiation for next phase'
      },
      dependencies: ['memory-update'],
      status: 'pending',
      startTime: null,
      endTime: null,
      error: undefined,
      action: async (_context) => {
        // Loop back to negotiation for the next phase
      }
    } as WorkflowStep
  ]
};
