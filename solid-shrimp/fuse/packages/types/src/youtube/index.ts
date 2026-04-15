/**
 * Extended metadata for YouTube videos
 */
export interface VideoMetadata {
  id: string;
  title: string;
  description: string;
  thumbnails: {
    default: string;
    medium: string;
    high: string;
  };
  publishedAt: string;
  channelId: string;
  channelTitle: string;
  tags?: string[];
  duration: string;
  viewCount: number;
  likeCount: number;
  commentCount?: number;
  favoriteCount?: number;
}

export interface Channel {
  id: string;
  title: string;
  description: string;
  customUrl?: string;
  publishedAt: string;
  thumbnails: {
    default: string;
    medium: string;
    high: string;
  };
  statistics: {
    viewCount: number;
    subscriberCount: number;
    hiddenSubscriberCount: boolean;
    videoCount: number;
  };
}

export interface YoutubeApiResponse<T> {
  kind: string;
  etag: string;
  items: T[];
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  nextPageToken?: string;
  prevPageToken?: string;
}
