/**
 * Supported export formats for conversations
 */
export enum ExportFormat {
  JSON = 'json',
  MARKDOWN = 'markdown', 
  HTML = 'html'
}

/**
 * Export configuration options
 */
export interface ExportOptions {
  format: ExportFormat;
  includeMetadata?: boolean;
  includeTimestamps?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

/**
 * Result of an export operation
 */
export interface ExportResult {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  size: number;
}

/**
 * Export service interface
 */
export interface ConversationExportService {
  export(conversation: any, format: ExportFormat, options?: ExportOptions): Promise<Buffer>;
  getFilename(format: ExportFormat, conversationId?: string): string;
  getMimeType(format: ExportFormat): string;
}
