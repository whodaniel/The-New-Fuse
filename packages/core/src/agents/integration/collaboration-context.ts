interface AgentMessage {
  id: string;
  from: string;
  to: string;
  type: string;
  content: Record<string, unknown>;
  timestamp: Date;
  priority: number;
}

interface PriorityQueue<T> {
  enqueue(item: T, priority: number): void;
  dequeue(): T | undefined;
  size(): number;
}

interface CollaborationContext {
  sharedState: {
    currentPhase: 'analysis' | 'enhancement' | 'implementation' | 'testing';
    activeTask: string;
    augment: string[];
    trae: string[];
  };
  messageQueue: PriorityQueue<AgentMessage>;
  lastSyncTime: Date;
}

export class CollaborationContextManager {
  private context: CollaborationContext;

  constructor() {
    this.context = {
      sharedState: {
        currentPhase: 'analysis',
        activeTask: '',
        augment: [],
        trae: [],
      },
      messageQueue: new DefaultPriorityQueue<AgentMessage>(),
      lastSyncTime: new Date(),
    };
  }

  getContext(): CollaborationContext {
    return this.context;
  }

  updatePhase(phase: 'analysis' | 'enhancement' | 'implementation' | 'testing'): void {
    this.context.sharedState.currentPhase = phase;
    this.context.lastSyncTime = new Date();
  }

  setActiveTask(task: string): void {
    this.context.sharedState.activeTask = task;
    this.context.lastSyncTime = new Date();
  }

  addAgentTask(agent: 'augment' | 'trae', task: string): void {
    if (agent === 'augment') {
      this.context.sharedState.augment.push(task);
    } else {
      this.context.sharedState.trae.push(task);
    }
    this.context.lastSyncTime = new Date();
  }

  sendMessage(message: AgentMessage): void {
    this.context.messageQueue.enqueue(message, message.priority);
  }

  receiveMessage(): AgentMessage | undefined {
    return this.context.messageQueue.dequeue();
  }

  getQueueSize(): number {
    return this.context.messageQueue.size();
  }
}

class DefaultPriorityQueue<T> implements PriorityQueue<T> {
  private items: Array<{ item: T; priority: number }> = [];

  enqueue(item: T, priority: number): void {
    this.items.push({ item, priority });
    this.items.sort((a, b) => b.priority - a.priority);
  }

  dequeue(): T | undefined {
    const result = this.items.shift();
    return result?.item;
  }

  size(): number {
    return this.items.length;
  }
}

export { AgentMessage, PriorityQueue, CollaborationContext };
