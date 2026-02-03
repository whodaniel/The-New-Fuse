import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { DEFAULT_CONFIG, fileExists, getConfig, readJsonFile, writeJsonFile } from './config.js';
// Lazy load these types to avoid runtime cost
import type { OAuth2Client } from 'google-auth-library';
import http from 'http';
import open from 'open';
import { fileURLToPath } from 'url';

// Configuration Constants
const __filename = fileURLToPath(import.meta.url);
const SCOPES = DEFAULT_CONFIG.scopes;

// Initialize Server immediately
const server = new McpServer({
  name: 'youtube-curator',
  version: '1.0.0',
});

let oauth2Client: OAuth2Client | null = null;

async function getOAuthClient() {
  if (oauth2Client) return oauth2Client;

  const config = getConfig();

  if (!(await fileExists(config.credentialsPath))) {
    throw new Error(
      `YouTube credentials file not found at ${config.credentialsPath}. Please set the YOUTUBE_CREDENTIALS_PATH environment variable or place client_secret.json in the working directory.`
    );
  }

  const content = await readJsonFile<any>(config.credentialsPath);
  const { client_secret, client_id } = content.installed || content.web;

  // Lazy load googleapis here
  const { google } = await import('googleapis');

  // We'll use a local server for the callback, so we dynamically set the redirect URI
  oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    config.redirectUri // Use configured redirect URI
  );

  // Try to load tokens
  if (await fileExists(config.tokenPath)) {
    const tokens = await readJsonFile<any>(config.tokenPath);
    oauth2Client.setCredentials(tokens);
  }

  return oauth2Client;
}

async function saveTokens(tokens: any) {
  const config = getConfig();
  await writeJsonFile(config.tokenPath, tokens);
  console.error(`Tokens saved to ${config.tokenPath}`);
}

// Tool: Authenticate
server.tool(
  'authenticate',
  'Authenticate with YouTube. Opens a browser window for the user to login.',
  {},
  async () => {
    const client = await getOAuthClient();

    return new Promise((resolve, reject) => {
      // Create a local server to receive the callback
      const server = http.createServer(async (req, res) => {
        try {
          if (req.url && req.url.startsWith('/?code=')) {
            const urlParams = new URL(
              req.url,
              `http://localhost:${(server.address() as any).port}`
            );
            const code = urlParams.searchParams.get('code');

            if (code) {
              const { tokens } = await client.getToken({
                code,
                redirect_uri: `http://localhost:${(server.address() as any).port}`,
              });
              client.setCredentials(tokens);
              await saveTokens(tokens);

              res.end('Authentication successful! You can close this window.');
              server.close();
              resolve({
                content: [{ type: 'text', text: 'Authentication successful! Tokens saved.' }],
              });
            }
          }
        } catch (e: any) {
          res.end('Authentication failed.');
          server.close();
          reject(e);
        }
      });

      server.listen(0, () => {
        const address = server.address();
        if (address && typeof address !== 'string') {
          const port = address.port;
          const redirectUri = `http://localhost:${port}`;

          // Generate Auth URL with the specific redirect_uri for this session
          const authUrl = client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
            redirect_uri: redirectUri,
            prompt: 'consent select_account',
          });

          console.error(`Opening auth URL: ${authUrl}`);
          open(authUrl);
        }
      });
    });
  }
);

// Tool: Get Watch Later Videos
const getWatchLaterSchema: Record<string, any> = {
  maxResults: z.number().optional().default(10).describe('Number of videos to return'),
};

server.tool(
  'get_watch_later',
  "Retrieve videos from the user's Watch Later playlist.",
  getWatchLaterSchema,
  async (args: any) => {
    const { maxResults = 10 } = args as { maxResults?: number };
    const client = await getOAuthClient();

    if (!client.credentials || !client.credentials.access_token) {
      return {
        content: [
          {
            type: 'text',
            text: "Authentication required. Please run the 'authenticate' tool first.",
          },
        ],
      };
    }

    // Lazy load googleapis here
    const { google } = await import('googleapis');
    const youtube = google.youtube({ version: 'v3', auth: client });

    try {
      // "WL" is the standard playlist ID for Watch Later for the authenticated user
      let playlistId = 'WL';

      const res = await youtube.playlistItems.list({
        part: ['snippet', 'contentDetails'],
        playlistId: playlistId,
        maxResults: maxResults,
      });

      const videos =
        res.data.items?.map((item) => ({
          title: item.snippet?.title,
          videoId: item.contentDetails?.videoId,
          channel: item.snippet?.channelTitle,
          description: item.snippet?.description,
          thumbnail: item.snippet?.thumbnails?.high?.url,
        })) || [];

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(videos, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Error fetching Watch Later: ${error.message}` }],
      };
    }
  }
);

// Tool: Archive Video (Remove from Playlist)
const archiveVideoSchema: Record<string, any> = {
  videoId: z.string().describe('The ID of the video to remove (not the playlist item ID)'),
  playlistId: z.string().optional().default('WL').describe('The playlist ID to remove from'),
};

server.tool(
  'archive_video',
  'Remove a video from a playlist (default: Watch Later) after watching.',
  archiveVideoSchema,
  async (args: any) => {
    const { videoId, playlistId = 'WL' } = args as { videoId: string; playlistId?: string };
    const client = await getOAuthClient();
    if (!client.credentials?.access_token) {
      return { content: [{ type: 'text', text: 'Auth required.' }] };
    }

    // Lazy load googleapis here
    const { google } = await import('googleapis');
    const youtube = google.youtube({ version: 'v3', auth: client });

    try {
      // Find the playlist item ID first
      let playlistItemId: string | null | undefined = null;

      // 1. Try exact match filter
      const listRes = await youtube.playlistItems.list({
        part: ['id', 'contentDetails'],
        playlistId: playlistId,
        videoId: videoId,
      });

      if (listRes.data.items && listRes.data.items.length > 0) {
        playlistItemId = listRes.data.items[0].id;
      }

      // 2. Fallback scan if standard filter fails or behaves unexpectedly
      if (!playlistItemId) {
        const scanRes = await youtube.playlistItems.list({
          part: ['id', 'contentDetails'],
          playlistId: playlistId,
          maxResults: 50,
        });
        const match = scanRes.data.items?.find((i: any) => i.contentDetails?.videoId === videoId);
        if (match) playlistItemId = match.id;
      }

      if (!playlistItemId) {
        return {
          content: [
            { type: 'text', text: `Video ${videoId} not found in playlist ${playlistId}.` },
          ],
        };
      }

      await youtube.playlistItems.delete({
        id: playlistItemId,
      });

      return {
        content: [
          {
            type: 'text',
            text: `Successfully removed video ${videoId} from playlist ${playlistId}.`,
          },
        ],
      };
    } catch (error: any) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Error archiving video: ${error.message}` }],
      };
    }
  }
);

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('YouTube Curator MCP Server running on stdio');
}

run();
