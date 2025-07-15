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
}