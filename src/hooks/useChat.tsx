import { useState, useCallback, useEffect } from "react";
import { useWebSocket } from './useWebSocket.js';
import { useAuth } from './useAuth.js';
import { api } from '../lib/api.js';
import { Message, ChatState } from '../types/chat.js';

export interface ChatOptions {
  workspaceId?: string;
  agentId?: string;
  initialMessages?: Message[];
  onMessageReceived?: (message: Message) => void;
  onParticipantStatusChange?: (
    participant: ChatState["participants"][0],
  ) => void;
}

export const useChat = ({
  workspaceId,
  agentId,
  initialMessages = [],
  onMessageReceived,
  onParticipantStatusChange,
}: ChatOptions) => {
  const [state, setState] = useState<ChatState>({
    messages: initialMessages,
    isLoading: false,
    error: null,
    participants: [],
  });

  const { user } = useAuth();
  const { socket, isConnected } = useWebSocket();

  // Load chat history
  useEffect(() => {
    if (workspaceId || agentId) {
      loadChatHistory();
    }
  }, [workspaceId, agentId]);

  // Handle WebSocket events
  useEffect(() => {
    if (!socket) return;

    socket.on("message", handleNewMessage);
    socket.on("participant_status", handleParticipantStatus);
    socket.on("typing_status", handleTypingStatus);

    return () => {
      socket.off("message", handleNewMessage);
      socket.off("participant_status", handleParticipantStatus);
      socket.off("typing_status", handleTypingStatus);
    };
  }, [socket, handleNewMessage, handleParticipantStatus, handleTypingStatus]);

  const loadChatHistory = async (): Promise<void> => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const endpoint = `/chat/agent/${agentId}/history`;

      const response: Message[] = await api.get(endpoint);
      setState((prev) => ({
        ...prev,
        messages: response.messages,
        isLoading: false,
      }));
    } catch (error: unknown) {
      setState((prev) => ({ ...prev, error, isLoading: false }));
    }
  };

  const sendMessage = useCallback(
    async (content: string, type: Message["type"] = "text"): Promise<void> => {
      if (!isConnected) {
        throw new Error("WebSocket connection not established");
      }
      const message: Partial<Message> = {
        content,
        type,
        sender: "user",
        timestamp: new Date().toISOString(),
      };

      socket?.emit("message", {
        ...message,
        workspaceId,
        agentId,
      });

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, message as Message],
      }));
    },
    [isConnected, socket, workspaceId, agentId],
  );

  const sendFileMessage = useCallback(
    async (file: File): Promise<void> => {
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const formData = new FormData();
        formData.append("file", file);

        const message: Partial<Message> = {
          type: "file",
          content: file.name,
          timestamp: new Date().toISOString(),
          attachments: [
            {
              id: Math.random().toString(),
              name: file.name,
              type: file.type,
              size: file.size,
              url: URL.createObjectURL(file),
            },
          ],
        };

        const response = await api.post<{ url: string }>(
          "/upload",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );

        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, { ...message, id: response.data.url }],
          isLoading: false,
        }));
      } catch (error: unknown) {
        setState((prev) => ({ ...prev, error: error as Error, isLoading: false }));
      }
    },
    [],
  );

  const handleNewMessage = useCallback(
    (message: Message) => {
      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, message],
      }));
      onMessageReceived?.(message);
    },
    [onMessageReceived],
  );

  const handleParticipantStatus = useCallback(
    (participant: ChatState["participants"][0]) => {
      setState((prev) => ({
        ...prev,
        participants: prev.participants.map((p) =>
          p.id === participant.id ? participant : p,
        ),
      }));
      onParticipantStatusChange?.(participant);
    },
    [onParticipantStatusChange],
  );

  const handleTypingStatus = useCallback(
    (data: { userId: string; isTyping: boolean }) => {
      setState((prev) => ({
        ...prev,
        participants: prev.participants.map((p) =>
          p.id === data.userId
            ? { ...p, status: data.isTyping ? "typing" : "online" }
            : p,
        ),
      }));
    },
    [],
  );

  const setTypingStatus = useCallback(
    (isTyping: boolean) => {
      socket?.emit("typing_status", {
        workspaceId,
        agentId,
        isTyping,
      });
    },
    [socket, workspaceId, agentId],
  );

  return {
    ...state,
    sendMessage,
    sendFileMessage,
    setTypingStatus,
  };
};
