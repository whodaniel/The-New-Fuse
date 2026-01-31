import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const GEMINI_CLI = '/Users/<owner>/.nvm/versions/node/v24.12.0/bin/gemini';
const OUTPUT_DIR = 'processed_videos';
const PLAYLIST_FILE = 'playlist_videos.md';
// Trying the thinking model as CLI seems to force thinking mode
const MODEL = 'gemini-2.0-flash-thinking-exp';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

// Read and parse playlist
const content = fs.readFileSync(PLAYLIST_FILE, 'utf-8');
const lines = content.split('\n').filter((line) => line.trim() !== '');

// Parse lines: "Index. [Title](URL)"
const videos = lines
  .map((line) => {
    const match = line.match(/^(\d+)\.\s+\[(.*?)\]\((.*?)\)/);
    if (match) {
      return {
        index: parseInt(match[1]),
        title: match[2].replace(/[\/\\:"*?<>|]+/g, '_'), // Sanitize title for filename
        url: match[3],
      };
    }
    return null;
  })
  .filter((v) => v !== null);

// REVERSE array to process from Oldest (#647) to Newest (#1)
videos.reverse();

console.log(`Found ${videos.length} videos. Starting processing from Oldest to Newest...`);

let processedCount = 0;
const MAX_VIDEOS = 3; // Limit to 3 for testing

for (const video of videos) {
  if (processedCount >= MAX_VIDEOS) {
    console.log(`\nStopped after processing ${MAX_VIDEOS} videos for testing.`);
    break;
  }

  const filename = `${video.index}_${video.title}.md`;
  const filePath = path.join(OUTPUT_DIR, filename);

  if (fs.existsSync(filePath)) {
    console.log(`Skipping ${filename} (already exists)`);
    continue;
  }

  console.log(`\nProcessing #${video.index}: ${video.title}`);
  console.log(`URL: ${video.url}`);

  const prompt =
    'Analyze this video to extract all key points of information. Focus on AI-related concepts, innovations, and technical details. Since we are processing from oldest to newest, note that this information might be dated, but capture it accurately as a baseline. Provide a dense, structured summary.';

  // Construct command
  const command = `"${GEMINI_CLI}" -m "${MODEL}" "${prompt} ${video.url}"`;

  try {
    console.log('Executing Gemini CLI...');
    const output = execSync(command, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] });
    fs.writeFileSync(filePath, output);
    console.log(`[SUCCESS] Saved to ${filename}`);
    processedCount++;
  } catch (error) {
    console.error(`[FAILED] Processing #${video.index}`);
    const errMsg = error.stderr || error.message;
    console.error(errMsg);
    // Save error log
    fs.writeFileSync(filePath + '.error', errMsg);
    processedCount++;
  }
}
