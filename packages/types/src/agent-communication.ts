import { Message } from "./communication.js";
import { Priority } from "./core/enums.js";

export interface AgentMessage extends Message {
  /** Agent ID that sent the message */
  agentId: string;
  /** Optional recipient agent ID */
  recipientId?: string;
  /** Message payload */
  payload: unknown;
  /** Message priority */
  priority: Priority;
}

export interface AgentResponse {
  /** Unique response ID */
  id: string;
  /** Original message ID this is responding to */
  messageId: string;
  /** Agent ID that sent the response */
  agentId: string;
  /** Response status */
  status: "success" | "error" | "pending";
  /** Response data */
  data?: unknown;
  /** Error information if status is error */
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  /** Timestamp when response was created */
  timestamp: Date;
}

export class PriorityQueue<T> {
  private items: Array<{ item: T; priority: number }> = [];

  enqueue(item: T, priority: number = 0): void {
    const queueItem = { item, priority };

    // Find the correct position to insert based on priority (higher priority first)
    let inserted = false;
    for (let i = 0; i < this.items.length; i++) {
      if (queueItem.priority > this.items[i].priority) {
        this.items.splice(i, 0, queueItem);
        inserted = true;
        break;
      }
    }

    // If not inserted, add to the end
    if (!inserted) {
      this.items.push(queueItem);
    }
  }

  dequeue(): T | undefined {
    const queueItem = this.items.shift();
    return queueItem?.item;
  }

  peek(): T | undefined {
    return this.items[0]?.item;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }

  clear(): void {
    this.items = [];
  }
}
