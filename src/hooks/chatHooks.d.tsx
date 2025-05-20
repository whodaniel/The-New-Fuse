interface ChatState {
  messages: unknown[];
  participants: unknown[];
  isLoading: boolean;
  error: Error | null | unknown;
}

interface FileUploadState {
  isUploading: boolean;
  error: Error | null | unknown;
  progress: Record<string, any>;
}
export {};
