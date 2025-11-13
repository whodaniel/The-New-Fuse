export declare enum ExportFormat {
    JSON = "JSON",
    CSV = "CSV",
    XML = "XML",
    PDF = "PDF",
    MARKDOWN = "MARKDOWN",
    HTML = "HTML"
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
//# sourceMappingURL=export.d.ts.map