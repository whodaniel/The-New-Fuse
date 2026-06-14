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
export declare class NewsFeedController {
    getNews(limit?: number): NewsItem[];
    pushNews(item: Omit<NewsItem, 'id' | 'timestamp'>): NewsItem;
}
//# sourceMappingURL=news-feed.controller.d.ts.map