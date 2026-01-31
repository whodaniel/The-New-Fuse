import fs from 'fs-extra';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const TOKEN_PATH = path.join(path.dirname(__filename), 'tokens.json');
const CREDENTIALS_PATH =
  '/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/tauri-desktop/src-tauri/credentials/client_secret.json';
const PLAYLIST_ID = 'PLSdNsZjFbYrWdF6KK6ruKzLrSFinpVCa_';

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

    let allVideos = [];
    let nextPageToken = undefined;

    console.log(`Fetching videos from playlist: ${PLAYLIST_ID}...`);

    do {
      const res = await youtube.playlistItems.list({
        part: ['snippet', 'contentDetails'],
        playlistId: PLAYLIST_ID,
        maxResults: 50,
        pageToken: nextPageToken,
      });

      const items = res.data.items || [];
      allVideos.push(
        ...items.map((item) => ({
          title: item.snippet?.title,
          url: `https://www.youtube.com/watch?v=${item.contentDetails?.videoId}`,
          id: item.contentDetails?.videoId,
        }))
      );

      nextPageToken = res.data.nextPageToken;
      process.stdout.write(`.`);
    } while (nextPageToken);

    console.log(`\nFound ${allVideos.length} videos.`);

    console.log(`\nFound ${allVideos.length} videos. Saving to playlist_videos.md...`);

    const fileContent = allVideos.map((v, i) => `${i + 1}. [${v.title}](${v.url})`).join('\n');
    await fs.writeFile('playlist_videos.md', fileContent);
    console.log('File saved successfully.');
  } catch (error) {
    console.error('\nError:', error.message);
  }
}

run();
