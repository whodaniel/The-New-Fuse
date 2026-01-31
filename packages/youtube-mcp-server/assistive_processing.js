import { exec } from 'child_process';
import fs from 'fs';
import readline from 'readline';

const PLAYLIST_FILE = 'playlist_videos.md';
const START_INDEX = 626; // Based on grep results ("Why Does Noam Chomsky Say AI Failed?")
const CHUNK_START = 0; // 0 minutes
const CHUNK_END = 45; // 45 minutes

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Clipboard Helper
function copyToClipboard(text) {
  const proc = exec('pbcopy');
  proc.stdin.write(text);
  proc.stdin.end();
}

// Open URL Helper
function openUrl(url) {
  exec(`open "${url}"`);
}

async function run() {
  console.log('Loading playlist...');
  const content = fs.readFileSync(PLAYLIST_FILE, 'utf-8');
  const lines = content.split('\n').filter((line) => line.trim() !== '');

  // Parse
  const videos = lines
    .map((line) => {
      const match = line.match(/^(\d+)\.\s+\[(.*?)\]\((.*?)\)/);
      if (match) {
        return {
          index: parseInt(match[1]),
          title: match[2],
          url: match[3],
        };
      }
      return null;
    })
    .filter((v) => v !== null);

  // Filter for older AI videos (starting from index 626 and going DOWN to 1)
  // Actually the file is 1..647.
  // We want to start at 626 and go to 1 (Newer).
  // So we filter videos where index <= 626
  const queue = videos.filter((v) => v.index <= START_INDEX).sort((a, b) => b.index - a.index); // Sort descending (626, 625, ...)

  console.log(`Found ${queue.length} videos to process (Starting at #${START_INDEX}).`);
  console.log('----------------------------------------------------------------');
  console.log('INSTRUCTIONS:');
  console.log('1. This script will open Google AI Studio.');
  console.log('2. It will COPY the video URL to your clipboard.');
  console.log("3. Paste the URL into the 'Video settings' dialog in AI Studio.");
  console.log('4. Then, it will COPY the Prompt to your clipboard.');
  console.log('5. Paste the Prompt into the chat box and hit Run.');
  console.log('----------------------------------------------------------------');

  for (const video of queue) {
    console.log(`\n[Current Video]: #${video.index} - ${video.title}`);

    // 1. Open AI Studio
    openUrl('https://aistudio.google.com/app/prompts/new_chat?model=gemini-3-flash-preview');

    // 2. Copy URL
    copyToClipboard(video.url);
    console.log(`\n>>> URL Copied! Paste it now: ${video.url}`);

    await new Promise((resolve) => rl.question('Press ENTER after pasting URL...', resolve));

    // 3. Copy Prompt
    const prompt = `Analyze this video to extract all key points of information. Focus on AI-related concepts, innovations, and technical details. Since we are processing from oldest to newest, capture the information accurately as a baseline. Provide a dense, structured summary.`;
    copyToClipboard(prompt);
    console.log(`\n>>> Prompt Copied! Paste it now.`);

    await new Promise((resolve) =>
      rl.question('Press ENTER to move to the next video...', resolve)
    );
  }

  console.log('Done!');
  rl.close();
}

run();
