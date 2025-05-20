export interface Message {
  id: string;
  content: string;
  sender: "user" | "agent" | "system";
  type: "text" | "code" | "file" | "system";
  timestamp: string;
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  metadata?: Record<string, any>;
}
export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: Error | null | unknown;
  participants: Array<{
    id: string;
    name: string;
    type: "user" | "agent";
    status: "online" | "offline" | "typing";
  }>;
}
export interface ChatOptions {
  workspaceId?: string;
  agentId?: string;
  initialMessages?: Message[];
  onMessageReceived?: (message: Message) => void;
  onParticipantStatusChange?: (
    participant: ChatState["participants"][0],
  ) => void;
}
export declare const useChat: ({
  workspaceId,
  agentId,
  initialMessages,
  onMessageReceived,
  onParticipantStatusChange,
}?: ChatOptions) => any;
