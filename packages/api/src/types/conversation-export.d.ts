declare module '@the-new-fuse/core/src/services/ConversationExportService' {
  export enum ExportFormat {
    JSON = 'json',
    MARKDOWN = 'markdown',
    HTML = 'html',
    PDF = 'pdf'
  }

  export class ConversationExportService {
    constructor();
    exportConversation(conversationId: string, format: ExportFormat): Promise<Buffer>;
    getExportFileName(conversationId: string, format: ExportFormat): string;
  }
}
