import type { Response } from 'express';
type ExportFormat = 'pdf' | 'md' | 'txt';
declare class ExportConversationDto {
    conversation: string;
    format: ExportFormat;
}
export declare class ExportController {
    constructor();
    /**
     * POST /api/v1/export/conversation
     * Body: { conversation: string, format: "pdf" | "md" | "txt" }
     * Response: PDF or text/markdown file
     */
    exportConversation(body: ExportConversationDto, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
export {};
//# sourceMappingURL=export.controller.d.ts.map