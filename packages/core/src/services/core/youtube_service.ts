import { Injectable } from '@nestjs/common';
import { google, youtube_v3 } from 'googleapis';

@Injectable()
export class YoutubeService {
  private youtube: youtube_v3.Youtube;

  constructor() {
    this.youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY,
    });
  }

  async searchVideos(query: string) {
    const response = await this.youtube.search.list({
      part: ['snippet'],
      q: query,
      type: ['video'],
    });
    return response.data;
  }

  async getVideoDetails(videoId: string) {
    const response = await this.youtube.videos.list({
      part: ['snippet', 'contentDetails', 'statistics'],
      id: [videoId],
    });
    return response.data;
  }

  async getChannelDetails(channelId: string) {
    const response = await this.youtube.channels.list({
      part: ['snippet', 'statistics'],
      id: [channelId],
    });
    return response.data;
  }

  async getComments(videoId: string) {
    const response = await this.youtube.commentThreads.list({
      part: ['snippet', 'replies'],
      videoId: videoId,
    });
    return response.data;
  }
}
