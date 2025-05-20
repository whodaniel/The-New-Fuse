import { YoutubeService } from './services/youtube.service.js';
import { TranscriptProcessor } from './transcript/transcript.processor.js';
import { VideoMetadata } from '@the-new-fuse/types';
export declare class YoutubeIntegrator {
    private readonly logger;
    private readonly youtubeService;
    private readonly transcriptProcessor;
    constructor(youtubeService: YoutubeService, transcriptProcessor: TranscriptProcessor);
    processVideo(videoId: string): Promise<void>;
    getVideoMetadata(videoId: string): Promise<VideoMetadata>;
    searchVideos(query: string): Promise<VideoMetadata[]>;
}
