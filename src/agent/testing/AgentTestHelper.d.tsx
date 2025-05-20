export declare class AgentTestHelper {
  static createMockMessage(overrides?: Partial<AgentMessage>): AgentMessage;
  static createMockQueue(size?: number): AgentMessage[];
  static delay(ms: number): Promise<void>;
}
