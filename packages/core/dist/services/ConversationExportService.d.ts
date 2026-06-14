export type ExportFormat = 'pdf' | 'md' | 'txt';
export declare class ConversationExportService {
    exportConversation(content: string, format: ExportFormat, outputPath: string): Promise<string>;
    exportToMarkdown(conversation: any[]): Promise<string>;
    exportToJSON(conversation: any[]): Promise<string>;
}
//# sourceMappingURL=ConversationExportService.d.ts.map