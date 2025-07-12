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

export const createCollaborationMessage = (): AgentMessage => ({
  type: 'task_proposal',
  timestamp: new Date().toISOString(),
  metadata: {
    version: '1.0.0',
    priority: 'high',
    source: 'augment'
  },
  details: {
    action: 'initialize_collaboration',
    project: 'The New Fuse Enhancement',
    scope: {
      primary: 'agent_communication_system',
      secondary: ['type_safety', 'error_handling', 'performance']
    },
    proposed_workflow: {
      phase1: 'System Analysis',
      phase2: 'Architecture Enhancement',
      phase3: 'Implementation',
      phase4: 'Testing & Validation'
    },
    my_capabilities: {
      code_analysis: true,
      architecture_design: true,
      type_safety: true,
      documentation: true
    },
    requested_capabilities: [
      'task_coordination',
      'system_integration',
      'code_generation'
    ]
  }
});

export class AgentMessageHandler {
  static validateMessage(message: AgentMessage): boolean {
    return !!(
      message.type &&
      message.timestamp &&
      message.metadata &&
      message.details
    );
  }

  static formatMessage(message: AgentMessage): string {
    return JSON.stringify(message, null, 2);
  }

  static parseMessage(messageString: string): AgentMessage | null {
    try {
      const parsed = JSON.parse(messageString);
      return this.validateMessage(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
}