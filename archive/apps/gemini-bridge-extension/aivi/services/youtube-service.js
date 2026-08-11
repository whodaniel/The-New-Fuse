// YouTube API Service
// Handles all YouTube API interactions including OAuth2, playlists, and video management

class YouTubeService {
  constructor() {
    this.accessToken = null;
    this.tokenExpiry = null;
    this.baseUrl = 'https://www.googleapis.com/youtube/v3';
  }

  // OAuth2 Authentication
  async authenticate() {
    try {
      console.log('Starting YouTube OAuth2 authentication...');

      const token = await chrome.identity.getAuthToken({ interactive: true });

      if (token) {
        this.accessToken = token;
        this.tokenExpiry = Date.now() + 3600 * 1000; // 1 hour

        // Store token
        await chrome.storage.local.set({
          youtubeToken: token,
          youtubeTokenExpiry: this.tokenExpiry,
        });

        console.log('YouTube authentication successful');
        return true;
      }

      return false;
    } catch (error) {
      console.error('YouTube authentication failed:', error);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  // Check if token is valid
  async isAuthenticated() {
    if (!this.accessToken || !this.tokenExpiry) {
      // Try to load from storage
      const data = await chrome.storage.local.get(['youtubeToken', 'youtubeTokenExpiry']);

      if (data.youtubeToken && data.youtubeTokenExpiry > Date.now()) {
        this.accessToken = data.youtubeToken;
        this.tokenExpiry = data.youtubeTokenExpiry;
        return true;
      }

      return false;
    }

    return this.tokenExpiry > Date.now();
  }

  // Ensure we have a valid token
  async ensureAuthenticated() {
    if (!(await this.isAuthenticated())) {
      await this.authenticate();
    }
  }

  // Make authenticated API request
  async makeRequest(endpoint, params = {}) {
    // Check if we have an OAuth token
    const isOAuth = await this.isAuthenticated();

    // If NOT authenticated via OAuth, check for API key
    let apiKey = this.apiKey;
    if (!apiKey) {
      const stored = await chrome.storage.local.get('youtubeApiKey');
      apiKey = stored.youtubeApiKey;
      this.apiKey = apiKey;
    }

    // specific operations like insert/delete ALWAYS require OAuth
    const isWriteOperation = ['POST', 'PUT', 'DELETE'].includes(params.method || 'GET');

    // STRICT QUOTA PROTECTION:
    // We do NOT allow using the extension's default project quota implicitly.
    // The user MUST either:
    // 1. Sign In (using their own quota via OAuth, effectively)
    //    *Note: OAuth actually shares project quota for read ops in some APIs,
    //     but allows us to track per-user. To be 100% safe, we prefer API Key.*
    // 2. Provide their own API Key.

    // If not signed in AND no API key, we must fail.
    // We do NOT attempt to auto-authenticate here to avoid annoying popups.
    if (!isOAuth && !apiKey) {
      throw new Error(
        'Quota Protection: You must specific a YouTube API Key in settings OR Sign In.'
      );
    }

    // Write operations require OAuth (Security)
    if (isWriteOperation && !this.accessToken) {
      throw new Error('Write operations require Google Sign-In (OAuth)');
    }

    const url = new URL(`${this.baseUrl}/${endpoint}`);

    // Use user's API key if available, otherwise fallback/nothing
    if (apiKey) {
      url.searchParams.append('key', apiKey);
    }

    Object.keys(params).forEach((key) => {
      if (key !== 'method' && key !== 'body') {
        url.searchParams.append(key, params[key]);
      }
    });

    const headers = {
      Accept: 'application/json',
    };

    // Only add Bearer token if we have one
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const fetchOptions = {
      method: params.method || 'GET',
      headers,
    };

    if (params.body) {
      fetchOptions.body =
        typeof params.body === 'string' ? params.body : JSON.stringify(params.body);
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url.toString(), fetchOptions);

    if (!response.ok) {
      // If 403/401 and we were using API key, might be quota or invalid key
      if (!this.accessToken && response.status === 403) {
        throw new Error('API Key Quota Exceeded or Invalid. Please sign in with Google.');
      }
      throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  // Get user's playlists
  async getPlaylists() {
    try {
      const data = await this.makeRequest('playlists', {
        part: 'snippet,contentDetails',
        mine: 'true',
        maxResults: 50,
      });

      return data.items.map((item) => ({
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

  // Get videos from a playlist
  async getPlaylistVideos(playlistId, maxResults = 50) {
    try {
      let allVideos = [];
      let nextPageToken = null;

      do {
        const params = {
          part: 'snippet,contentDetails',
          playlistId: playlistId,
          maxResults: maxResults,
        };

        if (nextPageToken) {
          params.pageToken = nextPageToken;
        }

        const data = await this.makeRequest('playlistItems', params);

        const videos = data.items.map((item) => ({
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

  // Get video details including duration
  async getVideoDetails(videoIds) {
    try {
      // YouTube API allows up to 50 video IDs per request
      const chunks = [];
      for (let i = 0; i < videoIds.length; i += 50) {
        chunks.push(videoIds.slice(i, i + 50));
      }

      let allVideos = [];

      for (const chunk of chunks) {
        const data = await this.makeRequest('videos', {
          part: 'contentDetails,snippet,statistics',
          id: chunk.join(','),
        });

        const videos = data.items.map((item) => ({
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

  // Parse ISO 8601 duration to seconds
  parseDuration(isoDuration) {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

    if (!match) return 0;

    const hours = parseInt(match[1] || 0);
    const minutes = parseInt(match[2] || 0);
    const seconds = parseInt(match[3] || 0);

    return hours * 3600 + minutes * 60 + seconds;
  }

  // Format seconds to readable duration
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  // Add video to playlist
  async addToPlaylist(playlistId, videoId) {
    try {
      const response = await fetch(`${this.baseUrl}/playlistItems?part=snippet`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snippet: {
            playlistId: playlistId,
            resourceId: {
              kind: 'youtube#video',
              videoId: videoId,
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to add video to playlist: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to add video to playlist:', error);
      throw error;
    }
  }

  // Remove video from playlist
  async removeFromPlaylist(playlistItemId) {
    try {
      const response = await fetch(`${this.baseUrl}/playlistItems?id=${playlistItemId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to remove video from playlist: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to remove video from playlist:', error);
      throw error;
    }
  }

  // Move video to another playlist
  async moveVideo(videoId, fromPlaylistItemId, toPlaylistId) {
    try {
      // Add to new playlist
      await this.addToPlaylist(toPlaylistId, videoId);

      // Remove from old playlist
      await this.removeFromPlaylist(fromPlaylistItemId);

      return true;
    } catch (error) {
      console.error('Failed to move video:', error);
      throw error;
    }
  }

  // Create new playlist
  async createPlaylist(title, description = '', privacy = 'private') {
    try {
      const response = await fetch(`${this.baseUrl}/playlists?part=snippet,status`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snippet: {
            title: title,
            description: description,
          },
          status: {
            privacyStatus: privacy,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create playlist: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        id: data.id,
        title: data.snippet.title,
        description: data.snippet.description,
      };
    } catch (error) {
      console.error('Failed to create playlist:', error);
      throw error;
    }
  }

  // Get Watch Later playlist ID
  async getWatchLaterPlaylistId() {
    try {
      const data = await this.makeRequest('channels', {
        part: 'contentDetails',
        mine: 'true',
      });

      if (data.items && data.items.length > 0) {
        return data.items[0].contentDetails.relatedPlaylists.watchLater;
      }

      return null;
    } catch (error) {
      console.error('Failed to get Watch Later playlist:', error);
      throw error;
    }
  }

  // Sign out
  async signOut() {
    try {
      if (this.accessToken) {
        await chrome.identity.removeCachedAuthToken({ token: this.accessToken });
      }

      this.accessToken = null;
      this.tokenExpiry = null;

      await chrome.storage.local.remove(['youtubeToken', 'youtubeTokenExpiry']);

      return true;
    } catch (error) {
      console.error('Failed to sign out:', error);
      throw error;
    }
  }
}

// Export singleton instance
const youtubeService = new YouTubeService();
export default youtubeService;
