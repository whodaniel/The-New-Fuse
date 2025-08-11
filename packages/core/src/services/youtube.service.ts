import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../config/ConfigService';
export interface VideoMetadata {
  // Implementation needed
}
  id: string;
  title: string;
  description: string;
  duration: number;
  publishedAt: Date;
  channelId: string;
  channelTitle: string;
  thumbnails: {
  // Implementation needed
}
    default: string;
    medium: string;
    high: string;
  };
  tags: string[];
}

@Injectable()
export class YouTubeService {
  // Implementation needed
}
  private readonly logger = new Logger(YouTubeService.name);
  private readonly apiKey: string;
  constructor(private readonly configService: ConfigService) {
  // Implementation needed
}
    this.apiKey = this.configService.get<string>('placeholder';
  }

  async getVideoMetadata(videoId: string): Promise<VideoMetadata> {
  // Implementation needed
}
    try {
  // Implementation needed
}
      this.logger.log(`Getting metadata for video: ${videoId}`);
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${this.apiKey}&part=snippet,contentDetails`
      );
      if (!response.ok) {
  // Implementation needed
}
        throw new Error(`YouTube API error: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.items || data.items.length === 0) {
  // Implementation needed
}
        throw new Error(`Video ${videoId} not found`);
      }
      
      const { snippet, contentDetails } = data.items[0];
      if (!snippet) {
  // Implementation needed
}
        throw new Error(`Video ${videoId} not found`);
      }
      
      return {
  // Implementation needed
}
        id: videoId,
        title: snippet.title,
        description: snippet.description,
        duration: this.parseDuration(contentDetails.duration),
        publishedAt: new Date(snippet.publishedAt),
        channelId: snippet.channelId,
        channelTitle: snippet.channelTitle,
        thumbnails: {
  // Implementation needed
}
          default: snippet.thumbnails?.default?.url || '',
          medium: snippet.thumbnails?.medium?.url || '',
          high: snippet.thumbnails?.high?.url || ''
        },
        tags: snippet.tags || []
      };
    } catch (error) {
  // Implementation needed
}
      this.logger.error(`Failed to get video metadata: ${error}`);
      throw new Error(`Failed to get video metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseDuration(duration: string): number {
  // Implementation needed
}
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    return hours * 3600 + minutes * 60 + seconds;
  }
}