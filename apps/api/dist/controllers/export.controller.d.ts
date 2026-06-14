import { ExportFormat } from '@the-new-fuse/types';
import { Response } from 'express';
/**
 * Export Controller
 *
 * Handles data export operations for the platform, allowing users to download
 * their conversations and other data in various formats. This controller provides
 * RESTful endpoints for initiating exports with proper authentication and
 * rate limiting.
 *
 * The controller supports:
 * - Conversation export in multiple formats (JSON, Markdown, HTML)
 * - Secure file download with proper headers
 * - Rate limiting to prevent abuse
 * - Comprehensive error handling
 * - Automatic format detection and file naming
 *
 * All export operations are:
 * - Authenticated using JWT tokens
 * - Rate limited to prevent system abuse
 * - Logged for audit purposes
 * - Validated for security
 *
 * @example
 * // Export conversation as JSON
 * POST /export/conversation
 * {
 *   "conversation": { "id": "conv123", "messages": [...] },
 *   "format": "json"
 * }
 *
 * @example
 * // Export conversation as Markdown
 * POST /export/conversation
 * {
 *   "conversation": { "id": "conv123", "messages": [...] },
 *   "format": "markdown"
 * }
 */
export declare class ExportController {
    /** Export service for handling data conversion */
    private exportService;
    /**
     * Export conversation data
     *
     * Exports conversation data in the requested format and initiates a file
     * download. Supports JSON, Markdown, and HTML formats with appropriate
     * MIME types and file extensions.
     *
     * @param body - Export request data
     * @param body.conversation - Conversation data to export
     * @param body.format - Export format (json, markdown, html)
     * @param res - Express response object for file download
     * @returns Promise that resolves when file is sent
     *
     * @throws BadRequestException - When conversation data or format is invalid
     * @throws InternalServerErrorException - When export operation fails
     *
     * @api
     * POST /export/conversation
     * @requiresAuth - Bearer token in Authorization header
     * @rateLimit - 10 requests per hour per user
     *
     * @example
     * // Request example
     * {
     *   "conversation": {
     *     "id": "conv123",
     *     "title": "Project Discussion",
     *     "messages": [
     *       {
     *         "id": "msg1",
     *         "sender": "user",
     *         "content": "Let's discuss the new features",
     *         "timestamp": "2025-11-05T02:17:55.000Z"
     *       }
     *     ]
     *   },
     *   "format": "markdown"
     * }
     *
     * @example
     * // Response headers for JSON export
     * {
     *   "Content-Type": "application/json",
     *   "Content-Disposition": "attachment; filename=\"conversation.json\"",
     *   "Content-Length": "2048"
     * }
     *
     * @example
     * // Response headers for Markdown export
     * {
     *   "Content-Type": "text/markdown",
     *   "Content-Disposition": "attachment; filename=\"conversation.md\"",
     *   "Content-Length": "1536"
     * }
     *
     * @example
     * // Response headers for HTML export
     * {
     *   "Content-Type": "text/html",
     *   "Content-Disposition": "attachment; filename=\"conversation.html\"",
     *   "Content-Length": "3072"
     * }
     */
    exportConversation(body: {
        conversation: any;
        format: ExportFormat;
    }, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=export.controller.d.ts.map