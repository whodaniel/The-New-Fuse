export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: string;
  permissions: string[];
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error?: string;
}

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant" | "system";
  timestamp: Date;
  status?: "sending" | "sent" | "error";
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error?: string;
}

export interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error?: string;
}

export interface WebSocketOptions {
  url: string;
  protocols?: string | string[];
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface FileUploadState {
  isUploading: boolean;
  progress: UploadProgress;
  error?: string;
}

export interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
  duration?: number;
}

export interface ToastState {
  toasts: Toast[];
}

export type Theme = "light" | "dark" | "system";

export interface ThemeState {
  theme: Theme;
  systemTheme: "light" | "dark";
}

export interface SpeechRecognitionState {
  isListening: boolean;
  transcript: string;
  error?: string;
}

export interface SpeechRecognitionOptions {
  continuous?: boolean;
  language?: string;
  interimResults?: boolean;
}

export interface RTCParticipant {
  id: string;
  stream: MediaStream;
  connection: RTCPeerConnection;
}

export interface WebRTCState {
  localStream?: MediaStream;
  participants: Map<string, RTCParticipant>;
  isConnecting: boolean;
  error?: string;
}
