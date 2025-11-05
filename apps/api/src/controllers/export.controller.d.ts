import { Response } from 'express';
import { ExportFormat } from '@the-new-fuse/types';
export declare class ExportController {
    private exportService;
    exportConversation(body: {
        conversation: any;
        format: ExportFormat;
    }, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=export.controller.d.ts.map