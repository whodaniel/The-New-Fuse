# YouTube Watch History Integration

## Overview

Two methods to fetch and process your YouTube watch history:

1. **Method A: Gemini Personal Intelligence** (Easiest - Recommended)
2. **Method B: YouTube Data API** (Automated but requires setup)

---

## Method A: Gemini Personal Intelligence (Recommended)

### Step 1: Generate the Prompt

```bash
node fetch-recent-videos.js
```

This outputs a prompt to copy.

### Step 2: Get Your Watch History

1. Go to https://gemini.google.com
2. Paste the prompt
3. Gemini will access your YouTube history using Personal Intelligence
4. Copy the JSON array response

### Step 3: Save the Response

Create `recent-videos.json` with the JSON from Gemini:

```json
[
  {
    "title": "Video Title",
    "url": "https://www.youtube.com/watch?v=abc123",
    "channel": "Channel Name",
    "description": "Brief description"
  },
  ...
]
```

### Step 4: Process Recent Videos

```bash
node process-recent-videos.js
```

This will:

- Identify videos already processed
- Identify videos in library but not processed
- Show NEW videos to add to library
- Generate HTML rows for new videos

### Step 5: Add New Videos to Library

1. Copy the HTML rows from the output
2. Open `ai_video_library.html`
3. Paste rows before `</tbody>`
4. Save the file

### Step 6: Process All Videos

```bash
cd /path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/packages/gemini-browser-skill
GEMINI_API_KEY=your_key node src/DirectAPIProcessor.js
```

---

## Method B: YouTube Data API (Automated)

### Prerequisites

1. Google Cloud Project with YouTube Data API v3 enabled
2. OAuth 2.0 credentials
3. Node.js packages: `googleapis`

### Step 1: Install Dependencies

```bash
npm install googleapis
```

### Step 2: Setup OAuth Credentials

1. Go to https://console.cloud.google.com
2. Create/select project
3. Enable YouTube Data API v3
4. Create OAuth 2.0 credentials
5. Download credentials.json
6. Save to project root

### Step 3: Run Automated Fetcher

```bash
node fetch-watch-history-api.js
```

This will:

- Authenticate via OAuth
- Fetch last 50 watched videos
- Filter political content
- Save to `recent-videos.json`
- Auto-process and add to library

---

## Quick Start (Recommended Path)

```bash
# 1. Get prompt
node fetch-recent-videos.js

# 2. Copy prompt → gemini.google.com → get JSON → save as recent-videos.json

# 3. Process
node process-recent-videos.js

# 4. Add HTML rows to ai_video_library.html

# 5. Process videos
cd /path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/packages/gemini-browser-skill
GEMINI_API_KEY=your_key node src/DirectAPIProcessor.js
```

---

## Automation Script

Create `update-library.sh` for weekly updates:

```bash
#!/bin/bash

echo "🔄 Weekly Library Update"
echo ""

# Step 1: Check current status
echo "📊 Current Status:"
node process-new-videos.js

echo ""
echo "📋 Next steps:"
echo "1. Run: node fetch-recent-videos.js"
echo "2. Get JSON from gemini.google.com"
echo "3. Save as recent-videos.json"
echo "4. Run: node process-recent-videos.js"
echo "5. Update ai_video_library.html with new rows"
echo "6. Process all videos"
echo ""
```

Make it executable:

```bash
chmod +x update-library.sh
```

Run weekly:

```bash
./update-library.sh
```

---

## Integration with Chrome Extension

The Chrome extension already has YouTube OAuth integration. Future enhancement:

### Add "Import Watch History" Button

**In popup.html:**

```html
<button id="importHistory" class="action-button">
  📺 Import Watch History
</button>
```

**In popup.js:**

```javascript
document.getElementById('importHistory').addEventListener('click', async () => {
  const response = await chrome.runtime.sendMessage({
    action: 'YOUTUBE_GET_WATCH_HISTORY',
    maxResults: 50,
  });

  // Display videos
  // Allow user to select which to add
  // Auto-add to library
});
```

**In background.js:**

```javascript
case 'YOUTUBE_GET_WATCH_HISTORY':
  return await getWatchHistory(request.maxResults);

async function getWatchHistory(maxResults = 50) {
  // Use YouTube Data API myRatedVideos endpoint
  // Or YouTube History API
  // Filter and return videos
}
```

---

## Filtering Options

Edit `process-new-videos.js` to customize filters:

```javascript
const POLITICAL_KEYWORDS = [
  'trump',
  'biden',
  'election', // Add/remove keywords
];

// Add custom filters
function isRelevant(video) {
  // Custom logic
  return (
    video.title.toLowerCase().includes('ai') ||
    video.title.toLowerCase().includes('machine learning')
  );
}
```

---

## Batch Processing

Process multiple playlists or watch history sources:

```bash
# Process main library
node process-new-videos.js

# Process recent history
node process-recent-videos.js

# Process specific playlist
node process-playlist.js PLAYLIST_ID

# Consolidate all
cd /path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse
cat data/video-reports/api_*.md > data/consolidated_knowledge.md
```

---

## Cost Tracking

Track API usage:

```javascript
// In DirectAPIProcessor.js
let totalCost = 0;
let videoCount = 0;

function trackCost(model, tokens) {
  const costs = {
    'gemini-1.5-flash': 0.0008,
    'gemini-2.0-flash-exp': 0.0008,
    'gemini-2.5-flash-image': 0.0008,
  };

  totalCost += costs[model] || 0.001;
  videoCount++;

  console.log(
    `💰 Total cost: $${totalCost.toFixed(4)} for ${videoCount} videos`
  );
}
```

---

## Troubleshooting

### "No videos found"

- Check if `recent-videos.json` exists
- Verify JSON format is correct
- Ensure video URLs are valid

### "Already processed"

- Videos may be in library with different index
- Check `data/video-reports/` for existing reports
- Duplicate detection is by video ID

### "Political content filtered"

- Adjust `POLITICAL_KEYWORDS` array
- Videos are skipped to keep knowledge base focused

---

## Next Steps

1. ✅ Run `node fetch-recent-videos.js`
2. ⏳ Get JSON from Gemini
3. ⏳ Run `node process-recent-videos.js`
4. ⏳ Update library
5. ⏳ Process videos

**Status:** Ready to fetch watch history!
