export interface File extends BaseEntity {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  uploadedBy?: string;
  metadata?: Record<string, any>;
  hash?: string;
}
export interface FileUpload {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
  encoding: string;
  metadata?: Record<string, any>;
}
