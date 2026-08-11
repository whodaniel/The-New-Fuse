# Adding New Videos to Your AI Knowledge Base

This guide covers three ways to add and process new videos:

## Current Status

- **Library size:** 647 videos
- **Already processed:** 635 videos (98.1%)
- **Unprocessed in library:** 12 videos
- **Filtered out:** 2 political videos

---

## Option 1: Process Remaining Videos in Library

You have 12 unprocessed videos already in your library.

### Videos to Process

1. #575: Build Blazing-Fast LLM Apps with Groq, Langflow, & Langchain
2. #576: Building a Generative UI App With LangChain Python
3. #577: New Discovery: LLMs have a Performance Phase
4. #578: How to Make AI Influencers For FREE
5. #579: How to use Llama 3 API for FREE
6. #580: Gold Gang (100% AI) - AI Music Video
7. #582: The Manipulation Expert (Robert Greene)
8. #583: LCM for Krita
9. #584: World's First AGI Agent (Devin)
10. #585: INSANELY Fast AI Cold Call Agent
11. #635: Mushroom Cultivation (non-AI, can skip)
12. #643: Krusty Krab vocoded (non-AI, can skip)

### To Process These:

```bash
cd /path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/packages/gemini-browser-skill
GEMINI_API_KEY=your_key node src/DirectAPIProcessor.js
```

---

## Option 2: Add New Videos from Your Playlist

If you've added new videos to your YouTube playlist, you need to update the
library HTML.

### Step 1: Extract Playlist HTML

1. Go to your YouTube playlist
2. Open browser DevTools (F12)
3. Run this in Console:

```javascript
// Extract all video data from playlist
const videos = Array.from(
  document.querySelectorAll('#content ytd-playlist-video-renderer')
).map((el) => {
  const titleEl = el.querySelector('#video-title');
  return {
    title: titleEl.textContent.trim(),
    url: titleEl.href,
  };
});

// Generate HTML
const startIndex = 648; // Next index after current library
const html = videos
  .map(
    (v, i) => `    <tr>
      <td style="text-align: center; padding: 12px;">${startIndex + i}</td>
      <td style="padding: 12px;"><a href="${v.url}" target="_blank" style="color: #1a73e8; text-decoration: none;">${v.title}</a></td>
    </tr>`
  )
  .join('\\n');

console.log(html);
```

### Step 2: Update Library File

1. Open `ai_video_library.html`
2. Find the last `</tr>` before `</tbody>`
3. Paste the new HTML rows
4. Save the file

### Step 3: Process New Videos

```bash
node process-new-videos.js  # Check what's new
cd /path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/packages/gemini-browser-skill
GEMINI_API_KEY=your_key node src/DirectAPIProcessor.js
```

---

## Option 3: Process Your Last 50 Recently Watched Videos

Use Gemini Personal Intelligence to fetch your recent watch history.

### Step 1: Fetch Recent Videos

```bash
node fetch-recent-videos.js
```

This will display a prompt. Copy it.

### Step 2: Get Your Watch History from Gemini

1. Go to https://gemini.google.com
2. Paste the prompt from Step 1
3. Gemini will access your YouTube history and return a JSON array
4. Copy the entire JSON response
5. Save it as `recent-videos.json` in this directory

### Step 3: Analyze Recent Videos

```bash
node process-recent-videos.js
```

This will:

- Show which videos are already processed
- Show which videos are in your library but not processed
- Show NEW videos to add to your library
- Generate HTML rows for new videos

### Step 4: Add New Videos to Library

1. Copy the HTML rows from the output
2. Open `ai_video_library.html`
3. Paste the rows at the end (before `</tbody>`)
4. Save the file

### Step 5: Process All New Videos

```bash
cd /path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/packages/gemini-browser-skill
GEMINI_API_KEY=your_key node src/DirectAPIProcessor.js
```

---

## Automated Processing Workflow

For the best experience, here's the recommended workflow:

### 1. Weekly Update Routine

```bash
# Check current status
node process-new-videos.js

# Fetch recent watch history
node fetch-recent-videos.js
# (Follow prompts to get data from Gemini)

# Analyze recent videos
node process-recent-videos.js

# Process everything
cd /path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/packages/gemini-browser-skill
GEMINI_API_KEY=your_key node src/DirectAPIProcessor.js
```

### 2. Monitor Progress

```bash
bash ~/Desktop/PROCESSING-MONITOR.sh
```

Or check logs:

```bash
tail -f /tmp/api-processing.log
```

### 3. Check Final Status

```bash
cd /path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse
ls data/video-reports/*.md | wc -l
```

---

## Filtering Political Content

The system automatically filters out videos with political keywords:

- trump, biden, election, politics, political
- democrat, republican, congress, senate, president
- government, policy, legislation, vote, voting
- campaign, liberal, conservative

If you want to adjust this filter, edit `process-new-videos.js` and modify the
`POLITICAL_KEYWORDS` array.

---

## Cost Estimates

- **Per video:** ~$0.0008 (using gemini-1.5-flash)
- **50 new videos:** ~$0.04
- **100 new videos:** ~$0.08

Very affordable for continuous knowledge base expansion!

---

## Troubleshooting

### "No transcript available"

Some videos don't have auto-generated captions. For these:

1. They'll be skipped by DirectAPIProcessor
2. Use Gemini Personal Intelligence (see MISSING-VIDEOS-FOR-GEMINI.md)
3. Or skip them if not critical

### "API quota exceeded"

The system will automatically switch to a higher-quota model. Just wait for
processing to complete.

### Videos processed but not in library

If a video was processed but isn't in your library HTML:

1. Find the report in `data/video-reports/`
2. Get the video ID from the filename
3. Add it to the library manually

---

## Next Steps After Processing

Once you've processed all your videos:

1. **Consolidate knowledge base:**

   ```bash
   cd /path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse
   cat data/video-reports/api_*.md > data/consolidated_ai_knowledge.md
   ```

2. **Upload to NotebookLM:**
   - Go to https://notebooklm.google.com
   - Create new notebook
   - Upload `consolidated_ai_knowledge.md`
   - Generate audio overview/podcast

3. **Commit to GitHub:**
   ```bash
   cd /path/to/Projects/ai-studio-automator
   git add .
   git commit -m "Update: Processed additional videos, now at X/647"
   git push
   ```

---

**Status:** Ready to process new videos! **Tools:** All scripts in
`/path/to/Projects/ai-studio-automator/`
