import React, { ReactElement } from 'react';
import { useState, useEffect, useContext } from "react";
import ChatHistory from './ChatHistory.js';
import { CLEAR_ATTACHMENTS_EVENT, DndUploaderContext } from './DnDWrapper.js';
import PromptInput, { PROMPT_INPUT_EVENT } from './PromptInput.js';
import { isMobile } from "react-device-detect";
import { SidebarMobileHeader } from '../../Sidebar.js';
import { useParams } from "react-router-dom";
import { v4 } from "uuid";
import handleSocketResponse, {
  websocketURI,
  AGENT_SESSION_END,
  AGENT_SESSION_START,
  ABORT_STREAM_EVENT,
} from "@/utils/chat/agent";
import { handleChat } from "@/utils/chat/handlers";
import { Workspace } from "@/utils/workspace";
import DnDFileUploaderWrapper from './DnDWrapper.js';
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { ChatTooltips } from './ChatTooltips.js';
import { TimeStamp } from "@/utils/TimeStamp";
import MessageGroup from './ChatHistory/MessageGroup.js';
import { WorkspaceData } from "@/types/workspace";
import { 
  Settings, 
  MoreHorizontal, 
  ChevronDown, 
  Bot 
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LLMSelector } from '@/components/LLMSelection/LLMSelector';

interface ChatMessage {
  uuid?: string;
  content: string;
  role: "user" | "assistant" | "system";
  attachments?: File[];
  pending?: boolean;
  userMessage?: string;
  animate?: boolean;
  type?: "statusResponse" | "abort";
  sources?: Source[];
  closed?: boolean;
  error?: string | null;
}

interface Source {
  content: string;
  title?: string;
  url?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string | Date | number;
  editedAt?: string | Date | number;
  attachments?: {
    name: string;
    contentString: string;
  }[];
}

interface ChatContainerProps {
  messages: Message[];
  workspace: WorkspaceData | null;
  chatId: string | null;
  onEditMessage?: (params: {
    editedMessage: string;
    chatId: string;
    role: "user" | "assistant";
    attachments?: File[];
  }) => void;
  onRegenerateMessage?: (chatId: string) => void;
  onForkThread?: (chatId: string) => void;
  knownHistory?: ChatMessage[];
}

export default function ChatContainer({
  messages,
  workspace,
  chatId,
  onEditMessage,
  onRegenerateMessage,
  onForkThread,
  knownHistory = []
}: ChatContainerProps): ReactElement {
  const { threadSlug = null } = useParams<{ threadSlug?: string }>();
  const [message, setMessage] = useState<string>("");
  const [loadingResponse, setLoadingResponse] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(knownHistory);
  const [socketId, setSocketId] = useState<string | null>(null);
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);
  const { files, parseAttachments } = useContext(DndUploaderContext);
  // New state for LLM provider selection
  const [selectedLLMProviderId, setSelectedLLMProviderId] = useState<string>('');
  const [isLLMDialogOpen, setIsLLMDialogOpen] = useState<boolean>(false);

  const handleMessageChange = (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setMessage(event.target.value);
  };

  const { listening, resetTranscript } = useSpeechRecognition({
    clearTranscriptOnListen: true,
  });

  function setMessageEmit(messageContent = "") {
    setMessage(messageContent);
    window.dispatchEvent(
      new CustomEvent(PROMPT_INPUT_EVENT, { detail: messageContent })
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!message || message === "") return false;
    const prevChatHistory: ChatMessage[] = [
      ...chatHistory,
      {
        content: message,
        role: "user",
        attachments: parseAttachments(),
      },
      {
        content: "",
        role: "assistant",
        pending: true,
        userMessage: message,
        animate: true,
      },
    ];

    if (listening) {
      endTTSSession();
    }
    setChatHistory(prevChatHistory);
    setMessageEmit("");
    setLoadingResponse(true);
  };

  function endTTSSession() {
    SpeechRecognition.stopListening();
    resetTranscript();
  }

  const regenerateAssistantMessage = (chatId: string) => {
    const updatedHistory = chatHistory.slice(0, -1);
    const lastUserMessage = updatedHistory.slice(-1)[0];
    if (!workspace?.slug) return;
    
    Workspace.deleteChats(workspace.slug, [chatId])
      .then(() =>
        sendCommand(
          lastUserMessage.content,
          true,
          updatedHistory,
          lastUserMessage?.attachments
        )
      )
      .catch((e) => console.error(e));
  };

  const sendCommand = async (
    command: string,
    submit = false,
    history: ChatMessage[] = [],
    attachments: File[] = []
  ) => {
    if (!command || command === "") return false;
    if (!submit) {
      setMessageEmit(command);
      return;
    }

    let prevChatHistory: ChatMessage[];
    if (history.length > 0) {
      prevChatHistory = [
        ...history,
        {
          content: "",
          role: "assistant",
          pending: true,
          userMessage: command,
          attachments,
          animate: true,
        },
      ];
    } else {
      prevChatHistory = [
        ...chatHistory,
        {
          content: command,
          role: "user",
          attachments,
        },
        {
          content: "",
          role: "assistant",
          pending: true,
          userMessage: command,
          animate: true,
        },
      ];
    }

    setChatHistory(prevChatHistory);
    setMessageEmit("");
    setLoadingResponse(true);
  };

  useEffect(() => {
    async function fetchReply() {
      const promptMessage = chatHistory.length > 0 ? chatHistory[chatHistory.length - 1] : null;
      const remHistory = chatHistory.length > 0 ? chatHistory.slice(0, -1) : [];
      var _chatHistory = [...remHistory];

      if (websocket) {
        if (!promptMessage || !promptMessage?.userMessage) return false;
        websocket.send(
          JSON.stringify({
            type: "awaitingFeedback",
            feedback: promptMessage?.userMessage,
          })
        );
        return;
      }

      if (!promptMessage || !promptMessage?.userMessage || !workspace?.slug) return false;

      const attachments = promptMessage?.attachments ?? parseAttachments();
      window.dispatchEvent(new CustomEvent(CLEAR_ATTACHMENTS_EVENT));

      await Workspace.multiplexStream({
        workspaceSlug: workspace.slug,
        threadSlug,
        prompt: promptMessage.userMessage,
        chatHandler: (chatResult) =>
          handleChat(
            chatResult,
            setLoadingResponse,
            setChatHistory,
            remHistory,
            _chatHistory,
            setSocketId
          ),
        attachments,
        // Include the selected LLM provider ID if available
        llmProviderId: selectedLLMProviderId || undefined,
      });
    }
    loadingResponse === true && fetchReply();
  }, [loadingResponse, chatHistory, workspace, selectedLLMProviderId]);

  useEffect(() => {
    function handleWSS() {
      try {
        if (!socketId || !!websocket) return;
        const socket = new WebSocket(
          `${websocketURI()}/api/agent-invocation/${socketId}`
        );

        window.addEventListener(ABORT_STREAM_EVENT, () => {
          window.dispatchEvent(new CustomEvent(AGENT_SESSION_END));
          websocket?.close();
        });

        socket.addEventListener("message", (event) => {
          setLoadingResponse(true);
          try {
            handleSocketResponse(event, setChatHistory);
          } catch (e) {
            console.error("Failed to parse data");
            window.dispatchEvent(new CustomEvent(AGENT_SESSION_END));
            socket.close();
          }
          setLoadingResponse(false);
        });

        socket.addEventListener("close", (_event) => {
          window.dispatchEvent(new CustomEvent(AGENT_SESSION_END));
          setChatHistory((prev) => [
            ...prev.filter((msg) => !!msg.content),
            {
              uuid: v4(),
              type: "statusResponse",
              content: "Agent session complete.",
              role: "assistant",
              sources: [],
              closed: true,
              error: null,
              animate: false,
              pending: false,
            },
          ]);
          setLoadingResponse(false);
          setWebsocket(null);
          setSocketId(null);
        });
        setWebsocket(socket);
        window.dispatchEvent(new CustomEvent(AGENT_SESSION_START));
        window.dispatchEvent(new CustomEvent(CLEAR_ATTACHMENTS_EVENT));
      } catch (e) {
        const error = e instanceof Error ? e.message : "Unknown error";
        setChatHistory((prev) => [
          ...prev.filter((msg) => !!msg.content),
          {
            uuid: v4(),
            type: "abort",
            content: error,
            role: "assistant",
            sources: [],
            closed: true,
            error,
            animate: false,
            pending: false,
          },
        ]);
        setLoadingResponse(false);
        setWebsocket(null);
        setSocketId(null);
      }
    }
    handleWSS();
  }, [socketId, websocket]);

  // Group messages by date
  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach((message: any) => {
      const timestamp = new TimeStamp(message.createdAt);
      const dateKey = timestamp.startOfDay().toISOString();
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    });

    // Sort groups by date, most recent first
    return Object.entries(groups)
      .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
      .map(([_, groupMessages]) => groupMessages);
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div
      className={`transition-all duration-500 relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-theme-bg-secondary w-full ${
        isMobile ? "h-full" : "h-[calc(100%-32px)]"
      } overflow-y-scroll no-scroll`}
    >
      {isMobile && <SidebarMobileHeader />}
      
      {/* Chat settings header with LLM selector */}
      <div className="sticky top-0 z-10 flex justify-between items-center px-4 py-2 bg-theme-bg-secondary border-b border-theme-border">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-theme-text-secondary" />
          <span className="font-medium">{workspace?.name || 'Chat'}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Dialog open={isLLMDialogOpen} onOpenChange={setIsLLMDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center space-x-1 text-sm text-theme-text-secondary"
              >
                <Settings className="h-4 w-4" />
                <span>Model Settings</span>
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Choose AI Model</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <LLMSelector
                  selectedProviderId={selectedLLMProviderId}
                  onChange={(providerId) => {
                    setSelectedLLMProviderId(providerId);
                    // Close dialog after selection (optional)
                    setTimeout(() => setIsLLMDialogOpen(false), 500);
                  }}
                  description="Select the AI model you want to chat with"
                />
              </div>
            </DialogContent>
          </Dialog>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setChatHistory([])}>
                Clear conversation
              </DropdownMenuItem>
              {onForkThread && chatId && (
                <DropdownMenuItem onClick={() => onForkThread(chatId)}>
                  Fork thread
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <DnDFileUploaderWrapper>
        <ChatHistory
          history={chatHistory}
          workspace={workspace}
          sendCommand={sendCommand}
          updateHistory={setChatHistory}
          regenerateAssistantMessage={regenerateAssistantMessage}
          hasAttachments={files.length > 0}
        />
        <div className="flex-1 overflow-y-auto">
          {messageGroups.map((groupMessages, index) => (
            <MessageGroup
              key={index}
              messages={groupMessages}
              workspace={workspace}
              chatId={chatId}
              onEditMessage={onEditMessage}
              onRegenerateMessage={onRegenerateMessage}
              onForkThread={onForkThread}
            />
          ))}
        </div>
        <PromptInput
          submit={handleSubmit}
          onChange={handleMessageChange}
          inputDisabled={loadingResponse}
          buttonDisabled={loadingResponse}
          sendCommand={sendCommand}
          attachments={files}
        />
      </DnDFileUploaderWrapper>
      <ChatTooltips />
    </div>
  );
}