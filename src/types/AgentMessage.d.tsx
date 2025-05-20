export interface AgentMessage {
  id: string;
  type: "broadcast" | "direct";
  sender: string;
  recipient?: string;
  content: unknown;
  timestamp: Date;
  metadata?: Record<string, any>;
}
export interface AgentCommunicationOptions {
  channelId?: string;
  timeout?: number;
  retries?: number;
}
