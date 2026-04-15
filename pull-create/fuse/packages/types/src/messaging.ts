export interface AgentMessage {
  id: string;
  type: string;
  content: string;
  sender: string;
  recipient?: string;
  timestamp: Date;
  priority?: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
}

export interface AgentResponse {
  id: string;
  messageId: string;
  content: string;
  sender: string;
  timestamp: Date;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export class PriorityQueue<T> {
  private items: Array<{ item: T; priority: number }> = [];

  enqueue(item: T, priority: number = 0): void {
    this.items.push({ item, priority });
    this.items.sort((a, b) => b.priority - a.priority);
  }

  dequeue(): T | undefined {
    return this.items.shift()?.item;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }
}
