interface VideoMetadata {
    id: string;
    title: string;
    description: string;
    duration: number;
    publishedAt: Date;
    channelId: string;
    channelTitle: string;
    thumbnails: {
        default: {
            url: string;
            width: number;
            height: number;
        };
        medium: {
            url: string;
            width: number;
            height: number;
        };
        high: {
            url: string;
            width: number;
            height: number;
        };
    };
    tags: string[];
}
export declare class YoutubeService {
    private apiKey;
    constructor(apiKey: string);
    getVideoMetadata(videoId: string): Promise<VideoMetadata>;
    private parseDuration;
}
export {};
