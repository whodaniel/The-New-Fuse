// Export types
export enum ExportFormat {
  JSON = "JSON",
  CSV = "CSV",
  XML = "XML",
  PDF = "PDF"
}

export interface ExportOptions {
  format: ExportFormat;
  includeMetadata?: boolean;
  compression?: boolean;
}

export interface ExportResult {
  data: string | Buffer;
  filename: string;
  mimeType: string;
}

export interface ConversationExportService {
  export(conversation: any, format: ExportFormat): Promise<Buffer>;
}
