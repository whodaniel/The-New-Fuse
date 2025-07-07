export interface AgentMessage {
  type: string;
  timestamp: string;
  metadata: {
    version: string;
    priority: string;
    source: string;
  };
  details: {
    action: string;
    project: string;
    scope: {
      primary: string;
      secondary: string[];
    };
    proposed_workflow: {
      phase1: string;
      phase2: string;
      phase3: string;
      phase4: string;
    };
    my_capabilities: {
      code_analysis: boolean;
      architecture_design: boolean;
      type_safety: boolean;
      documentation: boolean;
    };
    requested_capabilities: string[];
  };
}

const collaborationMessage: AgentMessage = {
  type: 'task_proposal'
    priority: 'high'
    source: 'augment'
    action: 'initialize_collaboration'
    project:The New Fuse Enhancement'
      primary: 'agent_communication_system'
      secondary: ['type_safety', error_handling', performance'
      phase1:System Analysis'
      phase2:Architecture Enhancement'
      phase4: Testing & 'Validation'
      code_analysis'
      task_coordination'
      system_integration'
      code_generation'