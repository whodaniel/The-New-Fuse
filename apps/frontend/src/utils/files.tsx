import { getFileExtension } from './directories.js';

export interface FileValidationOptions {
  maxSize?: number;
  allowedTypes?: string[];
  maxFiles?: number;
}

export interface FileValidationResult {
  valid: boolean;
  errors: string[];
}

export interface FileInfo {
  name: string;
  size: number;
  type: string;
  extension: string;
  lastModified: number;
}

export function getFileInfo(file: File): FileInfo {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    extension: getFileExtension(file.name),
    lastModified: file.lastModified,
  };
}

export function validateFile(file: File, options: FileValidationOptions = {}): FileValidationResult {
  const errors: string[] = [];
  const { maxSize, allowedTypes } = options;

  if (maxSize && file.size > maxSize) {
    errors.push(`File size exceeds ${formatFileSize(maxSize)}`);
  }

  if (allowedTypes && allowedTypes.length > 0) {
    const ext = getFileExtension(file.name).toLowerCase();
    if (!allowedTypes.includes(ext)) {
      errors.push(`File type .${ext} is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateFiles(files: File[], options: FileValidationOptions = {}): FileValidationResult {
  const errors: string[] = [];
  const { maxFiles } = options;

  if (maxFiles && files.length > maxFiles) {
    errors.push(`Maximum ${maxFiles} files allowed`);
    return { valid: false, errors };
  }

  const fileErrors = files.map(fil(e: any) => validateFile(file, options));
  const allErrors = fileErrors.reduce((acc, result) => [...acc, ...result.errors], [] as string[]);

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}

export async function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as data URL'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function downloadBlob(blob: Blob, filename: string): Promise<void> {
  const url = URL.createObjectURL(blob);
  downloadFile(url, filename);
  URL.revokeObjectURL(url);
}

export function getMimeType(filename: string): string {
  const ext = getFileExtension(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    txt: 'text/plain',
    html: 'text/html',
    css: 'text/css',
    js: 'text/javascript',
    json: 'application/json',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
  };

  return mimeTypes[ext] || 'application/octet-stream';
}