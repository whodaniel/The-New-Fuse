"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportController = void 0;
const common_1 = require("@nestjs/common");
const types_1 = require("@the-new-fuse/types");
const secure_auth_guard_1 = require("../guards/secure-auth.guard");
/**
 * Export Service
 *
 * Provides data export functionality for conversations and other system data.
 * This service supports multiple output formats and handles the conversion
 * of internal data structures to user-friendly export formats.
 *
 * Currently supports:
 * - JSON format for programmatic access
 * - Markdown format for documentation and reading
 * - HTML format for web viewing and printing
 *
 */
class ConversationExportService {
    /**
     * Export conversation data to specified format
     *
     * Converts conversation data to the requested export format and returns
     * it as a buffer ready for download.
     *
     * @param conversation - Conversation data to export
     * @param format - Desired export format
     * @returns Promise resolving to export data as buffer
     *
     * @example
     * const buffer = await ConversationExportService.export(conversation, ExportFormat.JSON);
     */
    static async export(conversation, format) {
        const normalizedFormat = String(format || types_1.ExportFormat.JSON).toLowerCase();
        const content = normalizedFormat === types_1.ExportFormat.MARKDOWN
            ? ConversationExportService.toMarkdown(conversation)
            : normalizedFormat === types_1.ExportFormat.HTML
                ? ConversationExportService.toHtml(conversation)
                : JSON.stringify(conversation, null, 2);
        return Buffer.from(content, 'utf-8');
    }
    static toMarkdown(conversation) {
        const title = String(conversation?.title || conversation?.id || 'Conversation');
        const messages = Array.isArray(conversation?.messages) ? conversation.messages : [];
        const lines = [`# ${title}`, ''];
        if (messages.length === 0) {
            lines.push('_No messages available._');
            return lines.join('\n');
        }
        for (const message of messages) {
            const sender = String(message?.sender || message?.role || 'unknown');
            const timestamp = message?.timestamp ? ` (${new Date(message.timestamp).toISOString()})` : '';
            const content = String(message?.content || '').trim();
            lines.push(`## ${sender}${timestamp}`);
            lines.push('');
            lines.push(content || '_Empty message_');
            lines.push('');
        }
        return lines.join('\n');
    }
    static toHtml(conversation) {
        const title = ConversationExportService.escapeHtml(String(conversation?.title || conversation?.id || 'Conversation'));
        const messages = Array.isArray(conversation?.messages) ? conversation.messages : [];
        const body = messages
            .map((message) => {
            const sender = ConversationExportService.escapeHtml(String(message?.sender || message?.role || 'unknown'));
            const timestamp = message?.timestamp
                ? ConversationExportService.escapeHtml(new Date(message.timestamp).toISOString())
                : '';
            const content = ConversationExportService.escapeHtml(String(message?.content || ''));
            return `
          <article class="message">
            <h2>${sender}${timestamp ? ` <small>${timestamp}</small>` : ''}</h2>
            <pre>${content || 'Empty message'}</pre>
          </article>
        `;
        })
            .join('\n');
        return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 24px; color: #111; }
      h1 { margin-bottom: 20px; }
      .message { border: 1px solid #ddd; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
      .message h2 { margin: 0 0 8px; font-size: 16px; }
      .message pre { margin: 0; white-space: pre-wrap; word-break: break-word; background: #f7f7f7; padding: 10px; border-radius: 6px; }
      small { color: #666; font-weight: 400; }
    </style>
  </head>
  <body>
    <h1>${title}</h1>
    ${body || '<p>No messages available.</p>'}
  </body>
</html>`;
    }
    static escapeHtml(value) {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}
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
let ExportController = class ExportController {
    constructor() {
        /** Export service for handling data conversion */
        this.exportService = ConversationExportService;
    }
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
    async exportConversation(body, res) {
        try {
            const { conversation, format } = body;
            // Validate input data
            if (!conversation) {
                throw new common_1.HttpException('Conversation data is required', common_1.HttpStatus.BAD_REQUEST);
            }
            if (!format) {
                throw new common_1.HttpException('Export format is required', common_1.HttpStatus.BAD_REQUEST);
            }
            // Export conversation data
            const buffer = await this.exportService.export(conversation, format);
            // Set appropriate MIME type based on format
            const mimeType = format === types_1.ExportFormat.MARKDOWN
                ? 'text/markdown'
                : format === types_1.ExportFormat.HTML
                    ? 'text/html'
                    : 'application/json';
            // Set appropriate file extension
            const extension = format === types_1.ExportFormat.MARKDOWN ? 'md' : format === types_1.ExportFormat.HTML ? 'html' : 'json';
            // Set response headers for file download
            res.set({
                'Content-Type': mimeType,
                'Content-Disposition': `attachment; filename="conversation.${extension}"`,
                'Content-Length': buffer.length.toString(),
                // Security headers
                'X-Content-Type-Options': 'nosniff',
                'Cache-Control': 'private, no-cache',
            });
            return res.send(buffer);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            // Log export failure for debugging
            console.error('Export operation failed:', error);
            throw new common_1.HttpException('Export failed - please try again later', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.ExportController = ExportController;
__decorate([
    (0, common_1.Post)('conversation'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ExportController.prototype, "exportConversation", null);
exports.ExportController = ExportController = __decorate([
    (0, common_1.Controller)('export'),
    (0, common_1.UseGuards)(secure_auth_guard_1.SecureAuthGuard),
    (0, secure_auth_guard_1.JwtAuth)(),
    (0, secure_auth_guard_1.SetRateLimitTier)(secure_auth_guard_1.RateLimitTier.API)
], ExportController);
//# sourceMappingURL=export.controller.js.map