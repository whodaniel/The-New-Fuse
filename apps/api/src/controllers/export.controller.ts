import { Controller, Post, Body, Res, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ExportFormat } from '@the-new-fuse/types';

// Mock conversation export service - this should be replaced with actual implementation
class ConversationExportService {
  static async export(conversation: any, format: ExportFormat): Promise<Buffer> {
    // Placeholder implementation
    const content = JSON.stringify(conversation, null, 2);
    return Buffer.from(content, 'utf-8');
  }
}

@Controller('export')
export class ExportController {
  private exportService = ConversationExportService;

  @Post('conversation')
  async exportConversation(
    @Body() body: { conversation: any; format: ExportFormat },
    @Res() res: Response
  ) {
    try {
      const { conversation, format } = body;
      
      const buffer = await this.exportService.export(conversation, format);
      
      const mimeType = 
        format === ExportFormat.MARKDOWN ? 'text/markdown' :
        format === ExportFormat.HTML ? 'text/html' :
        'application/json';
        
      const extension = 
        format === ExportFormat.MARKDOWN ? 'md' :
        format === ExportFormat.HTML ? 'html' :
        'json';
        
      res.set({
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="conversation.${extension}"`,
        'Content-Length': buffer.length.toString(),
      });
      
      return res.send(buffer);
    } catch (error) {
      throw new HttpException(
        'Export failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
