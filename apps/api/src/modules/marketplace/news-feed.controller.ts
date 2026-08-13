import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  sourceUrl: string;
  type: 'video_ingestion' | 'news_announcement' | 'price_change' | 'model_launch';
  attribution: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// In-memory store for now, will be migrated to Drizzle
const newsStore: NewsItem[] = [];

@ApiTags('marketplace-news')
@Controller('marketplace/news')
export class NewsFeedController {
  @Get()
  @ApiOperation({ summary: 'Get the AI news feed' })
  getNews(@Query('limit') limit: number = 20) {
    return newsStore
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  @Post()
  @ApiOperation({ summary: 'Push a new item to the feed' })
  pushNews(@Body() item: Omit<NewsItem, 'id' | 'timestamp'>) {
    const newItem: NewsItem = {
      ...item,
      id: `news-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    newsStore.push(newItem);
    
    // Keep last 500 items
    if (newsStore.length > 500) {
      newsStore.shift();
    }
    
    return newItem;
  }
}
