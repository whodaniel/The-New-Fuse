import fs from 'fs-extra';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const TOKEN_PATH = path.join(path.dirname(__filename), 'tokens.json');
const CREDENTIALS_PATH =
  '/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/tauri-desktop/src-tauri/credentials/client_secret.json';
const VIDEO_ID = 'bIZB1hIJ4u8';

async function run() {
  try {
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

    const res = await youtube.videos.list({
      part: ['contentDetails', 'snippet'],
      id: [VIDEO_ID],
    });

    const video = res.data.items?.[0];
    if (video) {
      console.log(`Title: ${video.snippet.title}`);
      console.log(`Duration: ${video.contentDetails.duration}`);
    } else {
      console.log('Video not found.');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

run();
