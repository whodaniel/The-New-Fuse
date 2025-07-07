import { ConfigService } from '../config/ConfigService';
export interface VideoMetadata {
    id: string;
    title: string;
    description: string;
    duration: number;
    publishedAt: Date;
    channelId: string;
    channelTitle: string;
    thumbnails: {
        default: string;
        medium: string;
        high: string;
    };
    tags: string[];
}
export declare class YouTubeService {
    private readonly configService;
    private readonly logger;
    private readonly apiKey;
    constructor(configService: ConfigService);
    getVideoMetadata(videoId: string): Promise<VideoMetadata>;
    private parseDuration;
}
//# sourceMappingURL=youtube.service.d.ts.map