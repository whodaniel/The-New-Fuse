import { Injectable } from '@nestjs/common';
import { YoutubeService } from './services/youtube.service.js';
import { TranscriptProcessor } from './transcript/transcript.processor.js';
import { Logger } from '../../utils/src/logger.js';

interface VideoMetadata {
  id: string;
  title: string;
  description: string;
  thumbnails: {
    default: string;
    medium: string;
    high: string;
  };
  publishedAt: string;
  channelId: string;
  channelTitle: string;
  tags: string[];
  duration: string;
}

export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
  confidence: number;
}

@Injectable()
export class YoutubeIntegrator {
  private readonly logger: Logger;
  private readonly youtubeService: YoutubeService;
  private readonly transcriptProcessor: TranscriptProcessor;

  constructor(
    youtubeService: YoutubeService,
    transcriptProcessor: TranscriptProcessor,
    logger: Logger
  ) {
    this.youtubeService = youtubeService;
    this.transcriptProcessor = transcriptProcessor;
    this.logger = logger;
  }

  async getVideoMetadata(videoId: string): Promise<VideoMetadata> {
    try {
      const data = await this.youtubeService.getVideoMetadata(videoId);
      
      return {
        id: data.id,
        title: data.title,
        description: data.description,
        thumbnails: {
          default: data.thumbnails.default.url,
          medium: data.thumbnails.medium.url,
          high: data.thumbnails.high.url
        },
        publishedAt: data.publishedAt.toISOString(),
        channelId: data.channelId,
        channelTitle: data.channelTitle,
        tags: data.tags,
        duration: String(data.duration)
      };
    } catch (error) {
      this.logger.error('Error fetching video metadata:', error);
      throw error;
    }
  }
  
  async searchVideos(query: string): Promise<VideoMetadata[]> {
    try {
      const results = await this.youtubeService.searchVideos(query);
      
      return results.map(data => ({
        id: data.id,
        title: data.title,
        description: data.description,
        thumbnails: {
          default: data.thumbnails.default.url,
          medium: data.thumbnails.medium.url,
          high: data.thumbnails.high.url
        },
        publishedAt: data.publishedAt.toISOString(),
        channelId: data.channelId,
        channelTitle: data.channelTitle,
        tags: data.tags,
        duration: String(data.duration)
      }));
    } catch (error) {
      this.logger.error('Error searching videos:', error);
      throw error;
    }
  }
}
