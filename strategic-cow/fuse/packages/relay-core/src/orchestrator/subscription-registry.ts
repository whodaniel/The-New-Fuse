export interface Subscription {
  agentId: string;
  topic: string; // e.g., 'capability:image-generation', 'channel:general'
  priority?: number;
}

export class SubscriptionRegistry {
  private subscriptions: Map<string, Set<string>> = new Map(); // topic -> Set<agentId>
  private agentSubscriptions: Map<string, Set<string>> = new Map(); // agentId -> Set<topic>

  register(agentId: string, topic: string): void {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set());
    }
    this.subscriptions.get(topic)!.add(agentId);

    if (!this.agentSubscriptions.has(agentId)) {
      this.agentSubscriptions.set(agentId, new Set());
    }
    this.agentSubscriptions.get(agentId)!.add(topic);

    console.log(`[SubscriptionRegistry] Agent ${agentId} subscribed to ${topic}`);
  }

  unregister(agentId: string, topic: string): void {
    if (this.subscriptions.has(topic)) {
      this.subscriptions.get(topic)!.delete(agentId);
      if (this.subscriptions.get(topic)!.size === 0) {
        this.subscriptions.delete(topic);
      }
    }

    if (this.agentSubscriptions.has(agentId)) {
      this.agentSubscriptions.get(agentId)!.delete(topic);
    }
  }

  getSubscribers(topic: string): string[] {
    if (!this.subscriptions.has(topic)) {
      return [];
    }
    return Array.from(this.subscriptions.get(topic)!);
  }

  getAgentSubscriptions(agentId: string): string[] {
    if (!this.agentSubscriptions.has(agentId)) {
      return [];
    }
    return Array.from(this.agentSubscriptions.get(agentId)!);
  }

  clearAgent(agentId: string): void {
    const topics = this.agentSubscriptions.get(agentId);
    if (topics) {
      for (const topic of topics) {
        this.unregister(agentId, topic);
      }
      this.agentSubscriptions.delete(agentId);
    }
  }
}
