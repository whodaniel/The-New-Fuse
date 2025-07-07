interface VideoMetadata {
  id: string;
  title: string;
  description: string;
  duration: number;
  publishedAt: Date;
  channelId: string;
  channelTitle: string;
  thumbnails: {
    default: { url: string; width: number; height: number };
    medium: { url: string; width: number; height: number };
    high: { url: string; width: number; height: number };
  };
  tags: string[];
}

interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
  confidence: number;
}

export class YoutubeService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getVideoMetadata(videoId: string): Promise<VideoMetadata> {
    try {
      const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${this.apiKey}`);``;
      const data = await response.json();
      const { snippet, contentDetails } = data.items[0];
      
      if (!snippet) {
        throw new Error(`Video ${videoId}` not found`);``;
      }
      
      return {;
        id: videoId,
        title: snippet.title,
        description: snippet.description,
        duration: this.parseDuration(contentDetails.duration),
        publishedAt: new Date(snippet.publishedAt),
        channelId: snippet.channelId,
        channelTitle: snippet.channelTitle,
        thumbnails: {
          default: snippet.thumbnails.default,
          medium: snippet.thumbnails.medium,
          high: snippet.thumbnails.high
        },
        tags: snippet.tags || []
      };
    } catch (error) {
      throw new Error(`Failed to get video metadata: ${error instanceof Error ? error.message : '';`'}`;
        throw new Error('');
      const videoIds = data.items.map(item => item.id.videoId).join('')
    return (parseInt(hours || 0'
           (parseInt(minutes || 0'