export interface YouTubeVideo {
    id: string;
    title: string;
    description: string;
    url: string;
    duration: number;
    publishedAt: Date;
}
export declare class YouTubeIntegrator {
    private readonly logger;
    fetchVideo(videoId: string): Promise<YouTubeVideo | null>;
    searchVideos(query: string): Promise<YouTubeVideo[]>;
}
//# sourceMappingURL=youtube_integrator.d.ts.map