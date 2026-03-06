const fs = require('fs-extra');
const { execSync } = require('child_process');
const { google } = require('googleapis');

// --- CONFIGURATION ---
const CREDENTIALS_PATH = "/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/tauri-desktop/src-tauri/credentials/client_secret.json";
const TOKEN_PATH = "/path/to/Desktop/A1-Inter-LLM-Com/mcp-servers/youtube-mcp-server/dist/tokens.json";
const GEMINI_CLI_PATH = "/path/to/.nvm/versions/node/v24.12.0/bin/gemini";

// --- USER PREFERENCES ---
// Set your preferred free-tier model here
const USER_SELECTED_MODEL = "gemini-2.0-flash"; 

async function getYouTubeClient() {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error(`Credentials not found at ${CREDENTIALS_PATH}`);
  }
  
  const content = await fs.readJson(CREDENTIALS_PATH);
  const { client_secret, client_id, redirect_uris } = content.installed || content.web;
  
  const oAuth2Client = new google.auth.OAuth2(
    client_id, 
    client_secret, 
    redirect_uris ? redirect_uris[0] : "http://localhost"
  );

  if (fs.existsSync(TOKEN_PATH)) {
    const tokens = await fs.readJson(TOKEN_PATH);
    oAuth2Client.setCredentials(tokens);
    return oAuth2Client;
  } else {
    throw new Error(`Tokens not found at ${TOKEN_PATH}. Please authenticate via your MCP server.`);
  }
}

async function processVideos() {
  try {
    console.log("Fetching YouTube Watch Later playlist...");
    const auth = await getYouTubeClient();
    const youtube = google.youtube({ version: 'v3', auth });

    const res = await youtube.playlistItems.list({
      part: ["snippet", "contentDetails"],
      playlistId: "WL",
      maxResults: 1 // Processing 1 video for this demonstration
    });

    const videos = res.data.items || [];
    
    for (const item of videos) {
      const title = item.snippet.title;
      const videoUrl = `https://www.youtube.com/watch?v=${item.contentDetails.videoId}`;

      console.log(`\nProcessing Video: ${title}`);
      
      // Constructing the exact command as per your instruction
      // gemini -m "[MODEL]" "Analyze this video: [URL]"
      const command = `"${GEMINI_CLI_PATH}" -m "${USER_SELECTED_MODEL}" "Analyze this video: ${videoUrl}"`;
      
      console.log(`Executing CLI command: ${command}`);
      
      try {
        const output = execSync(command, { 
            encoding: 'utf-8',
            stdio: ['ignore', 'inherit', 'inherit'] // 'inherit' allows you to see the CLI's progress and colors directly
        });
      } catch (cliError) {
        console.error("\n[!] Gemini CLI returned an error.");
      }
    }

  } catch (error) {
    console.error("Pipeline Error:", error.message);
  }
}

processVideos();