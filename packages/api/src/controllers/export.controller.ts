import { Controller, Post, Body, Res, HttpStatus, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ConversationExportService, ExportFormat } from '@the-new-fuse/core/src/services/ConversationExportService';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../modules/guards/jwt-auth.guard.js';

class ExportConversationDto {
  @IsString()
  @IsNotEmpty()
  conversation!: string;

  @IsString()
  @IsIn(['pdf', 'md', 'txt'])
  format!: ExportFormat;
}

@ApiTags('Export')
@UseGuards(JwtAuthGuard)
@Controller('export')
export class ExportController {
  constructor(private readonly exportService: typeof ConversationExportService) {}

  /**
   * POST /api/v1/export/conversation
   * Body: { conversation: string, format: "pdf" | "md" | "txt" }
   * Response: PDF or text/markdown file
   */
  @Post('conversation')
  @ApiOperation({ summary: 'Export conversation as PDF, Markdown, or Text' })
  @ApiBody({ type: ExportConversationDto })
  @ApiResponse({ status: 200, description: 'Exported file' })
  @ApiResponse({ status: 400, description: 'Missing or invalid input' })
  @ApiResponse({ status: 500, description: 'Export failed' })
  async exportConversation(
    @Body() body: ExportConversationDto,
    @Res() res: Response
  ) {
    const { conversation, format } = body;
    if (!conversation || !format) {
      return res.status(HttpStatus.BAD_REQUEST).json({ error: 'Missing conversation or format' });
    }
    try {
      const buffer = await this.exportService.export(conversation, format);
      const mime =
        format === 'pdf' ? 'application/pdf' :
        format === 'md' ? 'text/markdown' :
        'text/plain';
      res.setHeader('Content-Type', mime);
      res.setHeader('Content-Disposition', `attachment; filename=conversation.${format}`);
      res.send(buffer);
    } catch (err: any) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: err.message || 'Export failed' });
    }
  }
}
