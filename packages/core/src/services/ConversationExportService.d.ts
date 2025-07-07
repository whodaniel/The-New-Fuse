export type ExportFormat = 'pdf' | 'md' | 'txt';
export declare class ConversationExportService {
    /**
     * Exports conversation content to the desired format (PDF, Markdown, or Plain Text).
     * For PDF, uses Pandoc via CLI. For md/txt, saves directly.
     * @param content The conversation content (string, markdown, or plain text)
     * @param format Desired export format
     * @returns Buffer of the exported file
     */
    static export(content: string, format: ExportFormat): Promise<Buffer>;
}
//# sourceMappingURL=ConversationExportService.d.ts.map