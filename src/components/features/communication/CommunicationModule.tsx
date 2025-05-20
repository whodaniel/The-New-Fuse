import React, { useState, useRef, useEffect } from 'react';
import { z } from 'zod';
import { useWebSocket } from '../hooks/useWebSocket.js';
import { Button, Card, CardContent } from '../components/core/CoreModule.js';
import { useToast } from '../hooks/useToast.js';

// Define message schema with zod
const messageSchema = z.object({
  id: z.string(),
  content: z.string(),
  type: z.enum(['text', 'code', 'file', 'system']),
  sender: z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['user', 'agent', 'system']),
  }),
  timestamp: z.string().datetime(),
  metadata: z.record(z.any()).optional(),
});

// Infer types from the schema
type Message = z.infer<typeof messageSchema>;

// Participant type definition
interface Participant {
  id: string;
  name: string;
  type: 'user' | 'agent' | 'system';
  status: 'online' | 'offline' | 'typing';
  stream?: MediaStream;
}

// Chat component props
interface ChatProps {
  roomId: string;
  participants: Participant[];
  onMessageSend?: (message: Message) => void;
  onParticipantJoin?: (participant: Participant) => void;
  onParticipantLeave?: (participant: Participant) => void;
}

// Chat component
export const Chat = React.forwardRef<HTMLDivElement, ChatProps>(
  ({ roomId, participants, onMessageSend, onParticipantJoin, onParticipantLeave }, ref) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const { socket } = useWebSocket();
    const { toast } = useToast();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
      if (!socket) return;

      socket.on('message', (message: Message) => {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      });

      socket.on('participant_joined', (participant: Participant) => {
        onParticipantJoin?.(participant);
        toast.info(`${participant.name} joined the chat`);
      });

      socket.on('participant_left', (participant: Participant) => {
        onParticipantLeave?.(participant);
        toast.info(`${participant.name} left the chat`);
      });

      return () => {
        socket.off('message');
        socket.off('participant_joined');
        socket.off('participant_left');
      };
    }, [socket, onParticipantJoin, onParticipantLeave, toast]);

    const handleSendMessage = async () => {
      if (!inputValue.trim()) return;

      const message: Message = {
        id: crypto.randomUUID(),
        content: inputValue,
        type: 'text',
        sender: {
          id: 'current-user-id',
          name: 'Current User',
          type: 'user',
        },
        timestamp: new Date().toISOString(),
      };

      try {
        socket?.emit('message', { roomId, message });
        setMessages(prev => [...prev, message]);
        setInputValue('');
        onMessageSend?.(message);
        scrollToBottom();
      } catch (error) {
        toast.error('Failed to send message');
      }
    };

    return (
      <div ref={ref} className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="border-t p-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Type a message..."
            />
            <Button onClick={handleSendMessage}>Send</Button>
          </div>
        </div>
      </div>
    );
  }
);

Chat.displayName = 'Chat';

// Chat Message Component
interface ChatMessageProps {
  message: Message;
}

const ChatMessage = React.forwardRef<HTMLDivElement, ChatMessageProps>(
  ({ message }, ref) => {
    const isCurrentUser = message.sender.type === 'user';

    return (
      <div
        ref={ref}
        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
      >
        <div
          className={`max-w-[70%] rounded-lg p-3 ${
            isCurrentUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">{message.sender.name}</span>
            <span className="text-xs opacity-70">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <p className="mt-1">{message.content}</p>
        </div>
      </div>
    );
  }
);

ChatMessage.displayName = 'ChatMessage';

// Video Chat Component
interface VideoChatProps {
  roomId: string;
  participants: Participant[];
}

export const VideoChat = React.forwardRef<HTMLDivElement, VideoChatProps>(
  ({ roomId, participants }, ref) => {
    const { localStream, startCall, endCall } = useWebRTC(roomId);
    const [isCallActive, setIsCallActive] = useState(false);
    const { toast } = useToast();

    const handleStartCall = async () => {
      try {
        await startCall();
        setIsCallActive(true);
        toast.success('Video call started');
      } catch (error) {
        toast.error('Failed to start video call');
      }
    };

    const handleEndCall = async () => {
      try {
        await endCall();
        setIsCallActive(false);
        toast.success('Video call ended');
      } catch (error) {
        toast.error('Failed to end video call');
      }
    };

    return (
      <div ref={ref} className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Video Chat</h3>
          <Button
            onClick={isCallActive ? handleEndCall : handleStartCall}
            variant={isCallActive ? 'destructive' : 'default'}
          >
            {isCallActive ? 'End Call' : 'Start Call'}
          </Button>
        </div>

        {isCallActive && (
          <div className="grid grid-cols-2 gap-4">
            {participants.map((participant) => (
              <Card key={participant.id}>
                <CardContent className="p-2">
                  <div className="aspect-video bg-black rounded-md overflow-hidden">
                    {participant.stream && (
                      <video
                        autoPlay
                        playsInline
                        muted={participant.id === 'current-user-id'}
                        className="w-full h-full object-cover"
                        srcObject={participant.stream}
                      />
                    )}
                  </div>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-sm font-medium">{participant.name}</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                      {participant.status}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }
);

VideoChat.displayName = 'VideoChat';

// Voice Message Component
interface VoiceMessageProps {
  onRecordingComplete: (blob: Blob) => void;
}

export const VoiceMessage = React.forwardRef<HTMLDivElement, VoiceMessageProps>(
  ({ onRecordingComplete }, ref) => {
    const { startRecording, stopRecording, isRecording } = useSpeechRecognition();
    const [recordingTime, setRecordingTime] = useState(0);
    const timerRef = useRef<NodeJS.Timeout>();

    const handleStartRecording = async () => {
      try {
        await startRecording();
        timerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      } catch (error) {
        console.error('Failed to start recording:', error);
      }
    };

    const handleStopRecording = async () => {
      try {
        const blob = await stopRecording();
        onRecordingComplete(blob);
        clearInterval(timerRef.current);
        setRecordingTime(0);
      } catch (error) {
        console.error('Failed to stop recording:', error);
      }
    };

    useEffect(() => {
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }, []);

    return (
      <div ref={ref} className="flex items-center space-x-2">
        <Button
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          variant={isRecording ? 'destructive' : 'default'}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </Button>
        {isRecording && (
          <span className="text-sm">
            Recording: {Math.floor(recordingTime / 60)}:
            {(recordingTime % 60).toString().padStart(2, '0')}
          </span>
        )}
      </div>
    );
  }
);

VoiceMessage.displayName = 'VoiceMessage';

// File Upload Component
interface FileUploadProps {
  onFileUpload: (file: File) => void;
  allowedTypes?: string[];
  maxSize?: number;
}

export const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  ({ onFileUpload, allowedTypes, maxSize }, ref) => {
    const { uploadFile, isUploading, progress } = useFileUpload();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        await uploadFile(file, {
          maxSize,
          allowedTypes,
          onSuccess: () => {
            onFileUpload(file);
            toast.success('File uploaded successfully');
          },
          onError: (error) => {
            toast.error(`Upload failed: ${error.message}`);
          },
        });
      } catch (error) {
        toast.error('Failed to upload file');
      }
    };

    return (
      <div ref={ref} className="space-y-2">
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          disabled={isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload File'}
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept={allowedTypes?.join(',')}
        />
        {isUploading && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-primary h-2.5 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    );
  }
);

FileUpload.displayName = 'FileUpload';

// Custom hooks (stubs - would need to be implemented elsewhere)
function useWebRTC(roomId: string) {
  // Implementation would go here
  return {
    localStream: null as MediaStream | null,
    startCall: async () => {},
    endCall: async () => {},
  };
}

function useSpeechRecognition() {
  // Implementation would go here
  return {
    startRecording: async () => {},
    stopRecording: async (): Promise<Blob> => new Blob(),
    isRecording: false,
  };
}

function useFileUpload() {
  // Implementation would go here
  return {
    uploadFile: async (file: File, options: any) => {
      options.onSuccess?.();
    },
    isUploading: false,
    progress: 0,
  };
}

// Export types
export type {
  Message,
  Participant,
  ChatProps,
  ChatMessageProps,
  VideoChatProps,
  VoiceMessageProps,
  FileUploadProps,
};
