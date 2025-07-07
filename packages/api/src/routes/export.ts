import { Router, Request, Response } from 'express';
// import { ConversationExportService, ExportFormat } from '@the-new-fuse/core';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation.middleware';
import { exportSchema } from '../schemas/export.schema';

type ExportFormat = 'pdf' | 'md' | 'txt';
const router = Router();

/**
 * POST /api/export/conversation
 * Body: { conversation: string, format: "pdf" | "md" | "txt" }
 * Response: PDF or text/markdown file
 */
router.post('/conversation', authenticate, validateBody(exportSchema), async (req: Request, res: Response): Promise<void> => {
  const { conversation, format } = req.body as { conversation: string; format: ExportFormat };
  if (!conversation || !format) {
    res.status(400).json({ error: 'Missing conversation or format' });
    return;
  }
  try {
    // TODO: Re-enable once core package is fixed
    // const buffer = await ConversationExportService.export(conversation, format);
    res.status(501).json({ error: 'Export service temporarily disabled - core package needs repair' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Export failed' });
  }
});

export default router;
