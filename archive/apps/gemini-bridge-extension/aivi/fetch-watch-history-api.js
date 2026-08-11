#!/usr/bin/env node

/**
 * Automated YouTube Watch History Fetcher
 * Uses YouTube Data API to fetch recently watched videos
 *
 * Prerequisites:
 * 1. npm install googleapis
 * 2. Google Cloud project with YouTube Data API v3 enabled
 * 3. OAuth 2.0 credentials (credentials.json)
 *
 * Usage: node fetch-watch-history-api.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

console.log('📺 Automated YouTube Watch History Fetcher\n');
console.log('═'.repeat(70));
console.log('\n');

// Check for googleapis package
try {
  require('googleapis');
} catch (e) {
  console.log('❌ Missing dependency: googleapis\n');
  console.log('Install with:');
  console.log('  npm install googleapis\n');
  process.exit(1);
}

const { google } = require('googleapis');

// Configuration
const SCOPES = ['https://www.googleapis.com/auth/youtube.readonly'];
const TOKEN_PATH = 'youtube-token.json';
const CREDENTIALS_PATH = 'credentials.json';
const OUTPUT_FILE = 'recent-videos.json';

const POLITICAL_KEYWORDS = [
  'trump',
  'biden',
  'election',
  'politics',
  'political',
  'democrat',
  'republican',
  'congress',
  'senate',
  'president',
  'government',
  'policy',
  'legislation',
  'vote',
  'voting',
  'campaign',
  'liberal',
  'conservative',
];

function isPolitical(title) {
  const lowerTitle = title.toLowerCase();
  return POLITICAL_KEYWORDS.some((keyword) => lowerTitle.includes(keyword));
}

async function loadCredentials() {
  try {
    const content = fs.readFileSync(CREDENTIALS_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.log('❌ Error: credentials.json not found\n');
    console.log('To create credentials:');
    console.log('1. Go to https://console.cloud.google.com');
    console.log('2. Create/select project');
    console.log('3. Enable YouTube Data API v3');
    console.log('4. Create OAuth 2.0 credentials');
    console.log('5. Download as credentials.json');
    console.log('6. Place in this directory\n');
    process.exit(1);
  }
}

async function authorize(credentials) {
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Check for existing token
  try {
    const token = fs.readFileSync(TOKEN_PATH, 'utf-8');
    oAuth2Client.setCredentials(JSON.parse(token));
    return oAuth2Client;
  } catch (err) {
    return getNewToken(oAuth2Client);
  }
}

function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('🔐 Authorize this app by visiting:\n');
  console.log(authUrl);
  console.log('\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return reject(err);
        oAuth2Client.setCredentials(token);
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
        console.log('✅ Token stored to', TOKEN_PATH);
        resolve(oAuth2Client);
      });
    });
  });
}

async function getWatchHistory(auth, maxResults = 50) {
  const youtube = google.youtube({ version: 'v3', auth });

  console.log('📥 Fetching watch history...\n');

  try {
    // Get user's channel to access watch history playlist
    const channelsResponse = await youtube.channels.list({
      part: 'contentDetails',
      mine: true,
    });

    if (!channelsResponse.data.items || channelsResponse.data.items.length === 0) {
      throw new Error('No channel found');
    }

    // Note: YouTube removed access to watch history via API for privacy
    // Alternative: Use liked videos or a specific playlist
    console.log('⚠️  YouTube API no longer provides direct watch history access\n');
    console.log('Alternative approaches:');
    console.log('1. Use Gemini Personal Intelligence (recommended)');
    console.log('2. Export from YouTube Takeout');
    console.log('3. Use a specific playlist instead\n');

    // Fetch liked videos as an alternative
    console.log('📺 Fetching liked videos instead...\n');

    const response = await youtube.videos.list({
      part: 'snippet',
      myRating: 'like',
      maxResults: maxResults,
    });

    const videos = response.data.items.map((item) => ({
      title: item.snippet.title,
      url: `https://www.youtube.com/watch?v=${item.id}`,
      channel: item.snippet.channelTitle,
      description: item.snippet.description.substring(0, 200),
    }));

    return videos;
  } catch (error) {
    console.error('❌ Error fetching videos:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const credentials = await loadCredentials();
    const auth = await authorize(credentials);
    let videos = await getWatchHistory(auth, 50);

    // Filter political content
    const originalCount = videos.length;
    videos = videos.filter((v) => !isPolitical(v.title));

    console.log(`\n📊 Results:`);
    console.log(`   Total videos: ${originalCount}`);
    console.log(`   After filtering: ${videos.length}`);
    console.log(`   Filtered out: ${originalCount - videos.length} political videos\n`);

    // Save to JSON
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(videos, null, 2));
    console.log(`✅ Saved to ${OUTPUT_FILE}\n`);

    // Show preview
    console.log('📋 Preview (first 5 videos):\n');
    videos.slice(0, 5).forEach((v, i) => {
      console.log(`${i + 1}. ${v.title}`);
      console.log(`   ${v.channel}`);
      console.log(`   ${v.url}\n`);
    });

    console.log('═'.repeat(70));
    console.log('\n🚀 Next steps:\n');
    console.log('1. Run: node process-recent-videos.js');
    console.log('2. Review new videos to add');
    console.log('3. Update ai_video_library.html');
    console.log('4. Process videos\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
