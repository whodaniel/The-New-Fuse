import { Router } from 'express';
// import { ConversationExportService, ExportFormat } from '@the-new-fuse/core';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation.middleware';
import { exportSchema } from '../schemas/export.schema';
const router = Router();
/**
 * POST /api/export/conversation
 * Body: { conversation: string, format: "pdf" | "md" | "txt" }
 * Response: PDF or text/markdown file
 */
router.post('/conversation', authenticate, validateBody(exportSchema), async (req, res) => {
    const { conversation, format } = req.body;
    if (!conversation || !format) {
        res.status(400).json({ error: 'Missing conversation or format' });
        return;
    }
    try {
        // TODO: Re-enable once core package is fixed
        // const buffer = await ConversationExportService.export(conversation, format);
        res.status(501).json({ error: 'Export service temporarily disabled - core package needs repair' });
    }
    catch (err) {
        res.status(500).json({ error: err.message || 'Export failed' });
    }
});
export default router;
//# sourceMappingURL=export.js.map