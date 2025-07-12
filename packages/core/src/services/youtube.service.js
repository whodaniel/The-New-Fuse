var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var YouTubeService_1;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../config/ConfigService';
let YouTubeService = YouTubeService_1 = class YouTubeService {
    configService;
    logger = new Logger(YouTubeService_1.name);
    apiKey;
    constructor(configService) {
        this.configService = configService;
        this.apiKey = this.configService.get('YOUTUBE_API_KEY') || '';
    }
    async getVideoMetadata(videoId) {
        try {
            this.logger.log(`Getting metadata for video: ${videoId}`);
            const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${this.apiKey}&part=snippet,contentDetails`);
            if (!response.ok) {
                throw new Error(`YouTube API error: ${response.status}`);
            }
            const data = await response.json();
            if (!data.items || data.items.length === 0) {
                throw new Error(`Video ${videoId} not found`);
            }
            const { snippet, contentDetails } = data.items[0];
            if (!snippet) {
                throw new Error(`Video ${videoId} not found`);
            }
            return {
                id: videoId,
                title: snippet.title,
                description: snippet.description,
                duration: this.parseDuration(contentDetails.duration),
                publishedAt: new Date(snippet.publishedAt),
                channelId: snippet.channelId,
                channelTitle: snippet.channelTitle,
                thumbnails: {
                    default: snippet.thumbnails?.default?.url || '',
                    medium: snippet.thumbnails?.medium?.url || '',
                    high: snippet.thumbnails?.high?.url || ''
                },
                tags: snippet.tags || []
            };
        }
        catch (error) {
            this.logger.error(`Failed to get video metadata: ${error}`);
            throw new Error(`Failed to get video metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    parseDuration(duration) {
        const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match)
            return 0;
        const hours = parseInt(match[1] || '0');
        const minutes = parseInt(match[2] || '0');
        const seconds = parseInt(match[3] || '0');
        return hours * 3600 + minutes * 60 + seconds;
    }
};
YouTubeService = YouTubeService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], YouTubeService);
export { YouTubeService };
