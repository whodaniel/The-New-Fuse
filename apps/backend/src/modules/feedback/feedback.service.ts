import { Injectable } from '@nestjs/common';
import { drizzleFeedbackRepository } from '@the-new-fuse/database';

interface CreateFeedbackDto {
  type: 'bug' | 'feature' | 'ux' | 'other';
  message: string;
  source?: 'user' | 'internal' | 'beta';
  contextUrl?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  reporterName?: string;
  reporterEmail?: string;
}

interface FeedbackQueryDto {
  status?: string;
  type?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class FeedbackService {
  async create(dto: CreateFeedbackDto) {
    return drizzleFeedbackRepository.create({
      type: dto.type,
      message: dto.message,
      source: dto.source,
      contextUrl: dto.contextUrl,
      priority: dto.priority,
      reporterName: dto.reporterName,
      reporterEmail: dto.reporterEmail,
    });
  }

  async findAll(query: FeedbackQueryDto) {
    return drizzleFeedbackRepository.findAll({
      status: query.status,
      type: query.type,
      limit: query.limit,
      offset: query.offset,
    });
  }

  async findById(id: string) {
    return drizzleFeedbackRepository.findById(id);
  }

  async getStats() {
    return drizzleFeedbackRepository.getStats();
  }
}