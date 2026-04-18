import { Controller, Post, Body, Res, HttpStatus, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../modules/guards/jwt-auth.guard.js';

type ExportFormat = 'pdf' | 'md' | 'txt';

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
  constructor() {}

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
      // TODO: Re-enable once core package is fixed
      // const buffer = await ConversationExportService.export(conversation, format);
      res.status(HttpStatus.NOT_IMPLEMENTED).json({ 
        error: 'Export service temporarily disabled - core package needs repair' 
      });
    } catch (err: any) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: err.message || 'Export failed' });
    }
  }
}
