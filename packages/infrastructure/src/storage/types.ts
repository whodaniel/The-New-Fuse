export type StorageProvider = 'gcs' | 'cloudflare-r2' | 'local' | 'memory';

export interface StorageOptions {
  bucket?: string;
  contentType?: string;
  isPublic?: boolean;
  metadata?: Record<string, string>;
}

export interface StorageFile {
  key: string;
  bucket: string;
  size: number;
  contentType?: string;
  metadata?: Record<string, string>;
  publicUrl?: string;
  updatedAt: Date;
}

export interface StorageConfig {
  provider: StorageProvider;
  gcs?: {
    projectId: string;
    keyFilename?: string;
    bucket: string;
  };
  cloudflare?: {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
    publicUrlCustom?: string;
  };
  local?: {
    rootPath: string;
  };
}
