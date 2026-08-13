import { API_URLS } from '../../shared/constants';

interface Playlist {
  id: string;
  title: string;
  description: string;
  videoCount: number;
  thumbnail?: string;
}

interface PlaylistVideo {
  id: string;
  playlistItemId: string;
  title: string;
  description: string;
  thumbnail?: string;
  channelTitle: string;
  publishedAt: string;
  position: number;
}

interface VideoDetails {
  id: string;
  duration: number;
  durationISO: string;
  title: string;
  channelTitle: string;
  viewCount?: string;
  likeCount?: string;
}

interface LikedVideo {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  channelTitle: string;
  publishedAt: string;
  url: string;
}

class YouTubeService {
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;
  private apiKey: string | null = null;
  private baseUrl = API_URLS.youtube;

  async authenticate(): Promise<boolean> {
    try {
      console.log('Starting YouTube OAuth2 authentication...');
      const token = await chrome.identity.getAuthToken({ interactive: true });

      if (token) {
        this.accessToken = token;
        this.tokenExpiry = Date.now() + 3600 * 1000;

        await chrome.storage.local.set({
          youtubeToken: token,
          youtubeTokenExpiry: this.tokenExpiry,
        });

        console.log('YouTube authentication successful');
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('YouTube authentication failed:', error);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  async isAuthenticated(): Promise<boolean> {
    if (!this.accessToken || !this.tokenExpiry) {
      const data = (await chrome.storage.local.get(['youtubeToken', 'youtubeTokenExpiry'])) as Record<string, any>;

      if (data.youtubeToken && data.youtubeTokenExpiry > Date.now()) {
        this.accessToken = data.youtubeToken;
        this.tokenExpiry = data.youtubeTokenExpiry;
        return true;
      }

      return false;
    }

    return this.tokenExpiry > Date.now();
  }

  async ensureAuthenticated(): Promise<void> {
    if (!(await this.isAuthenticated())) {
      await this.authenticate();
    }
  }

  async makeRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    const isOAuth = await this.isAuthenticated();

    let apiKey = this.apiKey;
    if (!apiKey) {
      const stored = (await chrome.storage.local.get('youtubeApiKey')) as { youtubeApiKey?: string };
      apiKey = stored.youtubeApiKey;
      this.apiKey = apiKey || null;
    }

    const isWriteOperation = ['POST', 'PUT', 'DELETE'].includes(params.method || 'GET');

    if (!isOAuth && !apiKey) {
      throw new Error('Quota Protection: You must specify a YouTube API Key in settings OR Sign In.');
    }

    if (isWriteOperation && !this.accessToken) {
      throw new Error('Write operations require Google Sign-In (OAuth)');
    }

    const url = new URL(`${this.baseUrl}/${endpoint}`);

    if (apiKey) url.searchParams.append('key', apiKey);

    Object.keys(params).forEach((key) => {
      if (key !== 'method' && key !== 'body') {
        url.searchParams.append(key, params[key]);
      }
    });

    const headers: Record<string, string> = { Accept: 'application/json' };

    if (this.accessToken) headers['Authorization'] = `Bearer ${this.accessToken}`;

    const fetchOptions: RequestInit = { method: params.method || 'GET', headers };

    if (params.body) {
      fetchOptions.body = typeof params.body === 'string' ? params.body : JSON.stringify(params.body);
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url.toString(), fetchOptions);

    if (!response.ok) {
      if (!this.accessToken && response.status === 403) {
        throw new Error('API Key Quota Exceeded or Invalid. Please sign in with Google.');
      }
      throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  async getPlaylists(): Promise<Playlist[]> {
    try {
      const data = await this.makeRequest('playlists', {
        part: 'snippet,contentDetails', mine: 'true', maxResults: 50,
      });

      return data.items.map((item: any): Playlist => ({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        videoCount: item.contentDetails.itemCount,
        thumbnail: item.snippet.thumbnails?.default?.url,
      }));
    } catch (error) {
      console.error('Failed to fetch playlists:', error);
      throw error;
    }
  }

  async getPlaylistVideos(playlistId: string, maxResults = 50): Promise<PlaylistVideo[]> {
    try {
      let allVideos: PlaylistVideo[] = [];
      let nextPageToken: string | null = null;

      do {
        const params: Record<string, any> = { part: 'snippet,contentDetails', playlistId, maxResults };
        if (nextPageToken) params.pageToken = nextPageToken;

        const data = await this.makeRequest('playlistItems', params);

        const videos = data.items.map((item: any): PlaylistVideo => ({
          id: item.snippet.resourceId.videoId,
          playlistItemId: item.id,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails?.default?.url,
          channelTitle: item.snippet.channelTitle,
          publishedAt: item.snippet.publishedAt,
          position: item.snippet.position,
        }));

        allVideos = allVideos.concat(videos);
        nextPageToken = data.nextPageToken;
      } while (nextPageToken);

      return allVideos;
    } catch (error) {
      console.error('Failed to fetch playlist videos:', error);
      throw error;
    }
  }

  async getVideoDetails(videoIds: string[]): Promise<VideoDetails[]> {
    try {
      const chunks: string[][] = [];
      for (let i = 0; i < videoIds.length; i += 50) chunks.push(videoIds.slice(i, i + 50));

      let allVideos: VideoDetails[] = [];

      for (const chunk of chunks) {
        const data = await this.makeRequest('videos', {
          part: 'contentDetails,snippet,statistics', id: chunk.join(','),
        });

        const videos = data.items.map((item: any): VideoDetails => ({
          id: item.id,
          duration: this.parseDuration(item.contentDetails.duration),
          durationISO: item.contentDetails.duration,
          title: item.snippet.title,
          channelTitle: item.snippet.channelTitle,
          viewCount: item.statistics?.viewCount,
          likeCount: item.statistics?.likeCount,
        }));

        allVideos = allVideos.concat(videos);
      }

      return allVideos;
    } catch (error) {
      console.error('Failed to fetch video details:', error);
      throw error;
    }
  }

  parseDuration(isoDuration: string): number {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    return hours * 3600 + minutes * 60 + seconds;
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  }

  async addToPlaylist(playlistId: string, videoId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/playlistItems?part=snippet`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snippet: { playlistId, resourceId: { kind: 'youtube#video', videoId } },
        }),
      });

      if (!response.ok) throw new Error(`Failed to add video to playlist: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to add video to playlist:', error);
      throw error;
    }
  }

  async removeFromPlaylist(playlistItemId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/playlistItems?id=${playlistItemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });

      if (!response.ok) throw new Error(`Failed to remove video from playlist: ${response.statusText}`);
      return true;
    } catch (error) {
      console.error('Failed to remove video from playlist:', error);
      throw error;
    }
  }

  async moveVideo(videoId: string, fromPlaylistItemId: string, toPlaylistId: string): Promise<boolean> {
    try {
      await this.addToPlaylist(toPlaylistId, videoId);
      await this.removeFromPlaylist(fromPlaylistItemId);
      return true;
    } catch (error) {
      console.error('Failed to move video:', error);
      throw error;
    }
  }

  async createPlaylist(title: string, description = '', privacy = 'private'): Promise<{ id: string; title: string; description: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/playlists?part=snippet,status`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ snippet: { title, description }, status: { privacyStatus: privacy } }),
      });

      if (!response.ok) throw new Error(`Failed to create playlist: ${response.statusText}`);

      const data = await response.json();
      return { id: data.id, title: data.snippet.title, description: data.snippet.description };
    } catch (error) {
      console.error('Failed to create playlist:', error);
      throw error;
    }
  }

  async getWatchLaterPlaylistId(): Promise<string | null> {
    try {
      const data = await this.makeRequest('channels', { part: 'contentDetails', mine: 'true' });
      if (data.items && data.items.length > 0) return data.items[0].contentDetails.relatedPlaylists.watchLater;
      return null;
    } catch (error) {
      console.error('Failed to get Watch Later playlist:', error);
      throw error;
    }
  }

  async getLikedVideos(maxResults = 50): Promise<LikedVideo[]> {
    try {
      const data = await this.makeRequest('videos', { part: 'snippet,contentDetails', myRating: 'like', maxResults });

      return data.items.map((item: any): LikedVideo => ({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails?.default?.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        url: `https://www.youtube.com/watch?v=${item.id}`,
      }));
    } catch (error) {
      console.error('Failed to fetch liked videos:', error);
      throw error;
    }
  }

  generateWatchHistoryPrompt(videoCount = 50): string {
    return `Using your Personal Intelligence access to my YouTube watch history,
provide my last ${videoCount} watched videos.

Filter out political content.

Format as JSON array:
[
  {
    "title": "Video Title",
    "url": "https://www.youtube.com/watch?v=...",
    "channel": "Channel Name",
    "description": "Brief description"
  }
]`;
  }
}

const youtubeService = new YouTubeService();
export default youtubeService;
