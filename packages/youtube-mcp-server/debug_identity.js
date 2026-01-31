import fs from 'fs-extra';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const TOKEN_PATH = path.join(path.dirname(__filename), 'tokens.json');
const CREDENTIALS_PATH =
  '/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/tauri-desktop/src-tauri/credentials/client_secret.json';

async function run() {
  try {
    console.log('Reading tokens from:', TOKEN_PATH);
    if (!fs.existsSync(TOKEN_PATH)) {
      console.error('No tokens found!');
      return;
    }
    const tokens = await fs.readJson(TOKEN_PATH);

    const content = await fs.readJson(CREDENTIALS_PATH);
    const { client_secret, client_id } = content.installed || content.web;

    const auth = new google.auth.OAuth2(client_id, client_secret);
    auth.setCredentials(tokens);

    const youtube = google.youtube({ version: 'v3', auth });

    console.log('Fetching channel info...');
    const channelRes = await youtube.channels.list({
      part: ['snippet', 'contentDetails', 'id'],
      mine: true,
    });

    const channel = channelRes.data.items?.[0];
    if (channel) {
      console.log(`Authenticated as Channel: ${channel.snippet?.title} (ID: ${channel.id})`);
      console.log('Channel Details:', JSON.stringify(channel, null, 2));
    } else {
      console.log('No channel found for these credentials.');
    }

    const playlistsRes = await youtube.playlists.list({
      part: ['snippet', 'contentDetails'],
      mine: true,
      maxResults: 50,
    });

    console.log(`Found ${playlistsRes.data.items?.length || 0} playlists:`);
    playlistsRes.data.items?.forEach((pl) => {
      console.log(`- ${pl.snippet.title} (ID: ${pl.id})`);
    });
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('API Error details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

run();
