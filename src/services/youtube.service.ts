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
      const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${this.apiKey}`);
      const data = await response.json();
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
          default: snippet.thumbnails.default,
          medium: snippet.thumbnails.medium,
          high: snippet.thumbnails.high
        },
        tags: snippet.tags || []
      };
    } catch (error) {
      throw new Error(`Failed to get video metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async getTranscript(videoId: string): Promise<TranscriptSegment[]> {
    try {
      const response = await fetch(`https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${this.apiKey}`);
      const data = await response.json();
      const captionId = data.items[0]?.id;

      if (!captionId) {
        throw new Error('No captions found for this video');
      }

      const transcriptResponse = await fetch(`https://www.googleapis.com/youtube/v3/captions/${captionId}?key=${this.apiKey}`);
      const transcriptData = await transcriptResponse.json();

      return transcriptData.items.map(item => ({
        text: item.text,
        start: item.start,
        duration: item.duration,
        confidence: item.confidence || 1.0
      }));
    } catch (error) {
      throw new Error(`Failed to get transcript: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchVideos(query: string): Promise<VideoMetadata[]> {
    try {
      const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&key=${this.apiKey}`);
      const data = await response.json();
      const videoIds = data.items.map(item => item.id.videoId).join(',');

      const videosResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoIds}&key=${this.apiKey}`);
      const videosData = await videosResponse.json();

      return videosData.items.map(item => ({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        duration: this.parseDuration(item.contentDetails.duration),
        publishedAt: new Date(item.snippet.publishedAt),
        channelId: item.snippet.channelId,
        channelTitle: item.snippet.channelTitle,
        thumbnails: {
          default: item.snippet.thumbnails.default,
          medium: item.snippet.thumbnails.medium,
          high: item.snippet.thumbnails.high
        },
        tags: item.snippet.tags || []
      }));
    } catch (error) {
      throw new Error(`Failed to search videos: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseDuration(duration: string): number {
    const match = duration.match(/PT(?:([0-9]+)H)?(?:([0-9]+)M)?(?:([0-9]+)S)?/);
    if (!match) return 0;

    const [, hours, minutes, seconds] = match;
    return (parseInt(hours || '0') * 3600) +
           (parseInt(minutes || '0') * 60) +
           parseInt(seconds || '0');
  }
}
