import { Router, Request, Response } from 'express';
import { ConversationExportService, ExportFormat } from '@the-new-fuse/core/src/services/ConversationExportService';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { exportSchema } from '../schemas/export.schema.js';

const router = Router();

/**
 * POST /api/export/conversation
 * Body: { conversation: string, format: "pdf" | "md" | "txt" }
 * Response: PDF or text/markdown file
 */
router.post('/conversation', authenticate, validateBody(exportSchema), async (req: Request, res: Response) => {
  const { conversation, format } = req.body as { conversation: string; format: ExportFormat };
  if (!conversation || !format) {
    return res.status(400).json({ error: 'Missing conversation or format' });
  }
  try {
    const buffer = await ConversationExportService.export(conversation, format);
    const mime =
      format === 'pdf' ? 'application/pdf' :
      format === 'md' ? 'text/markdown' :
      'text/plain';
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `attachment; filename=conversation.${format}`);
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Export failed' });
  }
});

export default router;
