import { WorkflowTemplate, WorkflowStepType, WorkflowStep } from './types';
export const communicationFlowTemplate: WorkflowTemplate = {
  // Implementation needed
}
  id: 'ai-diplomacy-agentic-flow',
  name: 'AI Diplomacy Agentic Flow',
  description: 'Detailed agentic workflow for AI Diplomacy, including context construction, memory, diaries, and phase transitions.',
  version: '1.0.0',
  config: unknown;
  // Implementation needed
}
    startStep: 'context-construction'
  },
  steps: [
    {
  // Implementation needed
}
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
      config: unknown;
  // Implementation needed
}
        operation: 'build_context'
      },
      status: 'pending'
    },
    {
  // Implementation needed
}
      id: 'initialization',
      name: 'Initialization',
      type: WorkflowStepType.INITIALIZATION,
      config: unknown;
  // Implementation needed
}
        action: 'Set initial goals & relationships'
      },
      dependencies: ['context-construction'],
      status: 'pending'
    },
    {
  // Implementation needed
}
      id: 'negotiation',
      name: 'Negotiation',
      type: WorkflowStepType.COMMUNICATION,
      config: unknown;
  // Implementation needed
}
        action: 'Generate messages, update relationships'
      },
      dependencies: ['initialization'],
      status: 'pending'
    },
    {
  // Implementation needed
}
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
  // Implementation needed
}
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
  // Implementation needed
}
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
  // Implementation needed
}
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
  // Implementation needed
}
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
  // Implementation needed
}
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
  // Implementation needed
}
      id: 'loop',
      name: 'Loop to Next Phase',
      type: WorkflowStepType.CONTROL_FLOW,
      config: unknown;
  // Implementation needed
}
        action: 'Return to Negotiation for next phase'
      },
      dependencies: ['memory-update'],
      status: 'pending'
    }
  ]
};