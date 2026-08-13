import { Body, Controller, Get, NotFoundException, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { FeedbackService } from './feedback.service.js';

export class CreateFeedbackDto {
  type: 'bug' | 'feature' | 'ux' | 'other';
  message: string;
  source?: 'user' | 'internal' | 'beta';
  contextUrl?: string;
  userAgent?: string;
  screenResolution?: string;
  screenshotUrl?: string;
  stepsToReproduce?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  reporterName?: string;
  reporterEmail?: string;
}

export class UpdateFeedbackDto {
  status?: 'new' | 'triaged' | 'in_progress' | 'done';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
}

export class FeedbackQueryDto {
  status?: string;
  type?: string;
  limit?: number;
  offset?: number;
}

@Controller('api/feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  async createFeedback(@Body() dto: CreateFeedbackDto) {
    return this.feedbackService.create(dto);
  }

  @Get()
  async listFeedback(@Query() query: FeedbackQueryDto) {
    return this.feedbackService.findAll(query);
  }

  @Get('stats')
  async getStats() {
    return this.feedbackService.getStats();
  }

  @Get(':id')
  async getFeedback(@Param('id', ParseUUIDPipe) id: string) {
    const feedback = await this.feedbackService.findById(id);
    if (!feedback) {
      throw new NotFoundException(`Feedback ${id} not found`);
    }
    return feedback;
  }
}