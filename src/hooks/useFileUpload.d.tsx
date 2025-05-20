export interface UploadProgress {
  total: number;
  loaded: number;
  progress: number;
  status: "pending" | "uploading" | "complete" | "error";
}
export interface FileUploadState {
  isUploading: boolean;
  error: Error | null;
  progress: Record<string, UploadProgress>;
}
export interface FileUploadOptions {
  data?: Record<string, any>;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  url?: string;
  headers?: Record<string, string>;
  onSuccess?: (response: unknown, file: File) => void;
  onError?: (error: Error, file: File) => void;
  onProgress?: (progress: UploadProgress, file: File) => void;
  withCredentials?: boolean;
  autoUpload?: boolean;
  maxConcurrent?: number;
}
export declare const useFileUpload: (options?: FileUploadOptions) => any;
