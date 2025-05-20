import { useState, useCallback } from "react";
import { api } from '../lib/api.js';
import { FileUploadError } from '../lib/errors.js';
import { useToast } from '../components/ui/toast.js';

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

export const useFileUpload = (options: FileUploadOptions = {}) => {
  const [state, setState] = useState<FileUploadState>({
    isUploading: false,
    error: null,
    progress: {},
  });

  const { toast } = useToast();
  const uploadFile = useCallback(
    async (file: File, customOptions: FileUploadOptions = {}) => {
      const opts = { ...options, ...customOptions };
      const fileId = `${file.name}-${Date.now()}`;
      setState(prev => ({
        ...prev,
        isUploading: true,
        progress: {
          ...prev.progress,
          [fileId]: { total: file.size, loaded: 0, progress: 0, status: 'pending' },
        },
      }));
      try {
        const formData = new FormData();
        formData.append('file', file);
        Object.entries(opts.data || {}).forEach(([k,v]) => formData.append(k, String(v)));
        const response = await api.post<{ url: string }>(opts.url || '/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data', ...(opts.headers || {}) },
          onUploadProgress: (e: ProgressEvent) => {
            const progress = Math.round((e.loaded / e.total!) * 100);
            setState(prev => ({
              ...prev,
              progress: {
                ...prev.progress,
                [fileId]: { total: e.total!, loaded: e.loaded, progress, status: progress === 100 ? 'complete' : 'uploading' },
              },
            }));
            opts.onProgress?.(prev.progress[fileId], file);
          },
          withCredentials: opts.withCredentials,
        });
        opts.onSuccess?.(response.data, file);
        if (opts.showSuccessToast !== false) {
          toast({ title: 'Upload complete', description: file.name, type: 'success' });
        }
        return response.data;
      } catch (error: any) {
        setState(prev => ({
          ...prev,
          error,
          progress: { ...prev.progress, [fileId]: { ...prev.progress[fileId], status: 'error' } },
        }));
        opts.onError?.(error, file);
        if (opts.showErrorToast !== false) {
          toast({ title: 'Upload failed', description: file.name, type: 'error' });
        }
        throw error;
      } finally {
        setState(prev => ({ ...prev, isUploading: Object.values(prev.progress).some(p => p.status !== 'complete') }));
      }
    },
    [options, toast],
  );

  const uploadFiles = useCallback(
    async (files: FileList | File[], customOptions: FileUploadOptions = {}) => {
      const fileArray = Array.isArray(files) ? files : Array.from(files);
      return Promise.all(fileArray.map(f => uploadFile(f, customOptions).catch(err => ({ error: err, file: f }))));
    }, [uploadFile],
  );

  const clearProgress = useCallback((fileId?: string) => {
    if (fileId) {
      setState(prev => {
        const newProg = { ...prev.progress };
        delete newProg[fileId];
        return { ...prev, progress: newProg, isUploading: Object.values(newProg).some(p => p.status !== 'complete') };
      });
    } else {
      setState({ isUploading: false, error: null, progress: {} });
    }
  }, []);

  return { ...state, uploadFile, uploadFiles, clearProgress };
};
