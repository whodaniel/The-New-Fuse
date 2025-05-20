import { AgentMessage, AgentMessageType } from '../../types/agent.types.js';

export class AgentTestHelper {
  static createMockMessage(
    overrides: Partial<AgentMessage> = {},
  ): AgentMessage {
    return {
      id: `msg-${Date.now(): "task" as AgentMessageType,
      content: "Test message content",
      timestamp: new Date().toISOString(),
      priority: "medium",
      metadata: {},
      ...overrides,
    };
  }

  static createMockQueue(size: number = 5): AgentMessage[] {
    return Array.from({ length: size }, (_, i) =>
      this.createMockMessage({ id: `msg-${i}` }),
    );
  }

  static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
