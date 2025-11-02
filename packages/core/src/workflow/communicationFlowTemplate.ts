import { WorkflowTemplate, WorkflowStepType, WorkflowStep } from '../types/types';

export const communicationFlowTemplate: WorkflowTemplate = {
  id: 'ai-diplomacy-agentic-flow',
  name: 'AI Diplomacy Agentic Flow',
  description: 'Detailed agentic workflow for AI Diplomacy, including context construction, memory, diaries, and phase transitions.',
  version: '1.0.0',
  config: {
    startStep: 'context-construction'
  },
  steps: [
    {
      id: 'context-construction',
      name: 'Context Construction',
      type: WorkflowStepType.DATA_TRANSFORMATION,
      inputs: [
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
      ],
      config: {
        operation: 'build_context'
      },
      status: 'pending'
    },
    {
      id: 'initialization',
      name: 'Initialization',
      type: WorkflowStepType.INITIALIZATION,
      config: {
        action: 'Set initial goals & relationships'
      },
      dependencies: ['context-construction'],
      status: 'pending'
    },
    {
      id: 'negotiation',
      name: 'Negotiation',
      type: WorkflowStepType.COMMUNICATION,
      config: {
        action: 'Generate messages, update relationships'
      },
      dependencies: ['initialization'],
      status: 'pending'
    },
    {
      id: 'private-diary',
      name: 'Private Diary',
      type: WorkflowStepType.DOCUMENTATION,
      inputs: [
        'Phase Summary',
        'Successful Moves',
        'Failed Moves',
        'Board Changes',
        'Yearly summaries via Gemini Flash'
      ],
      dependencies: ['negotiation'],
      status: 'pending'
    },
    {
      id: 'negotiation-diary',
      name: 'Negotiation Diary',
      type: WorkflowStepType.DOCUMENTATION,
      inputs: [
        'Phase Summary',
        'Successful Moves',
        'Failed Moves',
        'Board Changes',
        'Yearly summaries via Gemini Flash'
      ],
      dependencies: ['private-diary'],
      status: 'pending'
    },
    {
      id: 'order-diary',
      name: 'Order Diary',
      type: WorkflowStepType.DOCUMENTATION,
      inputs: [
        'Phase Summary',
        'Successful Moves',
        'Failed Moves',
        'Board Changes',
        'Yearly summaries via Gemini Flash'
      ],
      dependencies: ['negotiation-diary'],
      status: 'pending'
    },
    {
      id: 'phase-result-diary',
      name: 'Phase Result Diary',
      type: WorkflowStepType.DOCUMENTATION,
      inputs: [
        'Phase Summary',
        'Successful Moves',
        'Failed Moves',
        'Board Changes',
        'Yearly summaries via Gemini Flash'
      ],
      dependencies: ['order-diary'],
      status: 'pending'
    },
    {
      id: 'diary-consolidation',
      name: 'Diary Consolidation',
      type: WorkflowStepType.DATA_CONSOLIDATION,
      inputs: [
        'Phase Summary',
        'Successful Moves',
        'Failed Moves',
        'Board Changes',
        'Yearly summaries via Gemini Flash'
      ],
      dependencies: ['phase-result-diary'],
      status: 'pending'
    },
    {
      id: 'memory-update',
      name: 'Memory System Update',
      type: WorkflowStepType.MEMORY_UPDATE,
      inputs: [
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
      ],
      dependencies: ['diary-consolidation'],
      status: 'pending'
    },
    {
      id: 'loop',
      name: 'Loop to Next Phase',
      type: WorkflowStepType.CONTROL_FLOW,
      config: {
        action: 'Return to Negotiation for next phase'
      },
      dependencies: ['memory-update'],
      status: 'pending'
    }
  ]
};
