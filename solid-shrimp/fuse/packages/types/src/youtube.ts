export interface VideoMetadata {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  channelId: string;
  channelTitle: string;
  thumbnails: {
    default: string;
    medium: string;
    high: string;
  };
  tags: string[];
  duration: number;
  viewCount: number;
  likeCount: number;
}

export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
  offset?: number;
  confidence?: number;
  speaker?: string;
}