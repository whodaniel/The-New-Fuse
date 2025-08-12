export interface AgentMessageMetadata {
  version: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  source: string;
}

export interface AgentMessageDetails {
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
}

export interface AgentMessage {
  type: string;
  timestamp: string;
  metadata: AgentMessageMetadata;
  details: AgentMessageDetails;
}

export interface TaskProposalMessage extends AgentMessage {
  type: 'task_proposal';
}

export interface StatusUpdateMessage extends AgentMessage {
  type: 'status_update';
  details: AgentMessageDetails & {
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    progress?: number;
  };
}

export interface CollaborationRequestMessage extends AgentMessage {
  type: 'collaboration_request';
  details: AgentMessageDetails & {
    collaboration_type: 'peer_review' | 'task_handoff' | 'knowledge_share';
    target_agent?: string;
  };
}

export const createCollaborationMessage = (): TaskProposalMessage => ({
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

export const createStatusUpdateMessage = (
  status: 'pending' | 'in_progress' | 'completed' | 'failed',
  progress?: number
): StatusUpdateMessage => ({
  type: 'status_update',
  timestamp: new Date().toISOString(),
  metadata: {
    version: '1.0.0',
    priority: 'medium',
    source: 'system'
  },
  details: {
    action: 'status_update',
    project: 'Current Task',
    status,
    progress,
    scope: {
      primary: 'task_execution',
      secondary: ['progress_tracking']
    },
    proposed_workflow: {
      phase1: 'Task Processing',
      phase2: 'Status Update',
      phase3: 'Result Delivery',
      phase4: 'Cleanup'
    },
    my_capabilities: {
      code_analysis: true,
      architecture_design: true,
      type_safety: true,
      documentation: true
    },
    requested_capabilities: []
  }
});

export const createCollaborationRequestMessage = (
  collaborationType: 'peer_review' | 'task_handoff' | 'knowledge_share',
  targetAgent?: string
): CollaborationRequestMessage => ({
  type: 'collaboration_request',
  timestamp: new Date().toISOString(),
  metadata: {
    version: '1.0.0',
    priority: 'medium',
    source: 'agent'
  },
  details: {
    action: 'request_collaboration',
    project: 'Agent Collaboration',
    collaboration_type: collaborationType,
    target_agent: targetAgent,
    scope: {
      primary: 'collaboration',
      secondary: ['knowledge_transfer', 'task_coordination']
    },
    proposed_workflow: {
      phase1: 'Request Processing',
      phase2: 'Collaboration Setup',
      phase3: 'Task Execution',
      phase4: 'Result Synthesis'
    },
    my_capabilities: {
      code_analysis: true,
      architecture_design: true,
      type_safety: true,
      documentation: true
    },
    requested_capabilities: ['collaboration', 'communication']
  }
});

export class AgentMessageHandler {
  static validateMessage(message: AgentMessage): boolean {
    return !!(
      message.type &&
      message.timestamp &&
      message.metadata &&
      message.details &&
      message.metadata.version &&
      message.metadata.priority &&
      message.metadata.source &&
      message.details.action &&
      message.details.project
    );
  }

  static validateMessageType(message: AgentMessage, expectedType: string): boolean {
    return this.validateMessage(message) && message.type === expectedType;
  }

  static formatMessage(message: AgentMessage): string {
    return JSON.stringify(message, null, 2);
  }

  static parseMessage(messageString: string): AgentMessage | null {
    try {
      const parsed = JSON.parse(messageString);
      return this.validateMessage(parsed) ? parsed : null;
    } catch (error) {
      console.error('Failed to parse message:', error);
      return null;
    }
  }

  static createMessageId(message: AgentMessage): string {
    const hash = this.simpleHash(JSON.stringify(message));
    return `msg_${message.timestamp}_${hash}`;
  }

  static getPriority(message: AgentMessage): number {
    const priorities = { low: 1, medium: 2, high: 3, urgent: 4 };
    return priorities[message.metadata.priority] || 1;
  }

  static isExpired(message: AgentMessage, ttlMs: number): boolean {
    const messageTime = new Date(message.timestamp).getTime();
    const now = Date.now();
    return (now - messageTime) > ttlMs;
  }

  static extractCapabilities(message: AgentMessage): string[] {
    const capabilities = [];
    const details = message.details;

    if (details.my_capabilities) {
      Object.entries(details.my_capabilities).forEach(([key, value]) => {
        if (value === true) {
          capabilities.push(key);
        }
      });
    }

    return capabilities;
  }

  static compareMessages(a: AgentMessage, b: AgentMessage): number {
    // Compare by priority first
    const priorityDiff = this.getPriority(b) - this.getPriority(a);
    if (priorityDiff !== 0) return priorityDiff;

    // Then by timestamp
    const aTime = new Date(a.timestamp).getTime();
    const bTime = new Date(b.timestamp).getTime();
    return bTime - aTime;
  }

  private static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

export class MessageQueue {
  private messages: AgentMessage[] = [];
  private maxSize: number;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }

  push(message: AgentMessage): boolean {
    if (!AgentMessageHandler.validateMessage(message)) {
      return false;
    }

    this.messages.push(message);
    this.messages.sort(AgentMessageHandler.compareMessages);

    // Remove oldest messages if queue is full
    if (this.messages.length > this.maxSize) {
      this.messages = this.messages.slice(0, this.maxSize);
    }

    return true;
  }

  pop(): AgentMessage | null {
    return this.messages.shift() || null;
  }

  peek(): AgentMessage | null {
    return this.messages[0] || null;
  }

  filter(predicate: (message: AgentMessage) => boolean): AgentMessage[] {
    return this.messages.filter(predicate);
  }

  size(): number {
    return this.messages.length;
  }

  clear(): void {
    this.messages = [];
  }

  cleanup(ttlMs: number): number {
    const initialSize = this.messages.length;
    this.messages = this.messages.filter(message => 
      !AgentMessageHandler.isExpired(message, ttlMs)
    );
    return initialSize - this.messages.length;
  }
}