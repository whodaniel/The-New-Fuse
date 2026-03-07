#!/usr/bin/env node

/**
 * Fetch Recent YouTube Watch History
 *
 * Uses Gemini Personal Intelligence to get your recently watched videos
 *
 * Instructions:
 * 1. Go to gemini.google.com
 * 2. Paste the prompt below
 * 3. Copy the JSON output to recent-videos.json
 * 4. Run: node process-recent-videos.js
 */

console.log('📺 YouTube Recent Watch History Fetcher\n');
console.log('═'.repeat(70));
console.log('\n🤖 PROMPT FOR GEMINI PERSONAL INTELLIGENCE:\n');
console.log('─'.repeat(70));

const prompt = `Using your access to my YouTube watch history, please provide my last 50 watched videos.

For each video, provide:
- Video title
- Video URL
- Channel name
- Brief description/topic

Filter out any political content (politics, elections, government, etc.)

Format as a JSON array:
[
  {
    "title": "Video Title",
    "url": "https://www.youtube.com/watch?v=...",
    "channel": "Channel Name",
    "description": "Brief description"
  },
  ...
]

Only include videos related to:
- Technology
- AI/Machine Learning
- Programming
- Software Development
- Creative Tools
- Science
- Education`;

console.log(prompt);
console.log('\n' + '─'.repeat(70));
console.log('\n📋 NEXT STEPS:\n');
console.log('1. Copy the prompt above');
console.log('2. Go to https://gemini.google.com');
console.log('3. Paste and submit');
console.log('4. Copy the JSON response');
console.log('5. Save to: recent-videos.json');
console.log('6. Run: node process-recent-videos.js\n');
console.log('═'.repeat(70));
console.log('\n');
