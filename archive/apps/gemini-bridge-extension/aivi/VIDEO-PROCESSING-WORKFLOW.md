# 📹 Video Processing Workflow

Complete guide to processing your YouTube video library using the AI Video
Intelligence Suite.

---

## 🎯 Overview

Your personal video library contains **647 AI-related YouTube videos**. The
processing system extracts transcripts, analyzes them with Gemini AI, and builds
a searchable knowledge base.

### Current Status (as of latest update)

- **Total Videos:** 647
- **Processed:** ~166 (25.7%)
- **Remaining:** ~481 (74.3%)
- **Estimated Time:** ~20-25 hours
- **Estimated Cost:** ~$0.40 remaining

---

## 📁 Processing Scripts

### 1. `cli/status.js` - Status Dashboard

Check current processing state and statistics.

```bash
node cli/status.js
```

**Shows:**

- Completion percentage with visual progress bar
- Videos completed, remaining, failed, skipped
- Cost estimates and time remaining
- Next actions to take
- Recent unprocessed videos

### 2. `batch-processor.js` - Main Processing Engine

Enhanced batch processor with resume capability.

```bash
# Check status first
node check-status.js

# Resume processing all remaining videos
node batch-processor.js --resume

# Process specific range
node batch-processor.js --start=200 --end=300

# Process in smaller batches (default 50)
node batch-processor.js --resume --batch-size=25
```

**Features:**

- ✅ Resume capability (saves progress to `processing-progress.json`)
- ✅ Batch processing with rate limiting
- ✅ Retry logic for failed videos
- ✅ Automatic transcript extraction via yt-dlp
- ✅ Progress tracking and summary reports
- ✅ Error handling and recovery

### 3. `generate-knowledge-base.js` - Knowledge Base Generator

Consolidates all reports into a searchable knowledge base.

```bash
node generate-knowledge-base.js
```

**Outputs:**

- `knowledge-base/consolidated_ai_knowledge.md` - Complete knowledge base
- `knowledge-base/topics/*.md` - Category-specific files
- `knowledge-base/README.md` - Index and navigation

### 4. `export-for-notebooklm.js` - NotebookLM Export

Exports video lists for NotebookLM bulk import.

```bash
node export-for-notebooklm.js
```

**Outputs:**

- `notebooklm-exports/all-videos-urls.txt`
- `notebooklm-exports/unprocessed-videos-urls.txt`
- `notebooklm-exports/processed-videos-urls.txt`

---

## 🚀 Quick Start

### Prerequisites

1. **Set up Gemini API Key:**

```bash
export GEMINI_API_KEY="your-gemini-api-key-here"
```

2. **Ensure yt-dlp is installed:**

```bash
yt-dlp --version
# If not installed: brew install yt-dlp
```

3. **Verify video library exists:**

- File:
  `/path/to/Desktop/A1-Inter-LLM-Com/my-ai-knowledge-base/video-library/ai_video_library.html`
- Should contain 647 videos

### Step-by-Step Processing

```bash
# 1. Check current status
node check-status.js

# 2. Start batch processing (this will take several hours)
node batch-processor.js --resume

# 3. Process runs in background - check progress anytime
node check-status.js

# 4. When complete, generate knowledge base
node generate-knowledge-base.js

# 5. Export for NotebookLM if needed
node export-for-notebooklm.js
```

---

## 📊 Processing Details

### How It Works

1. **Transcript Extraction**
   - Uses `yt-dlp` to fetch YouTube auto-captions
   - Supports English subtitles (en, en-US, en-GB)
   - Skips videos without transcripts

2. **AI Analysis**
   - Sends transcripts to Gemini 1.5 Flash API
   - Extracts: Key Points, AI Concepts, Technical Details, Visual Context Flags
   - Rate limited to ~1 request per second

3. **Report Generation**
   - Saves markdown report per video
   - File naming: `api_{index}_{videoId}.md`
   - Includes metadata and AI analysis

4. **Progress Tracking**
   - Saves state to `processing-progress.json`
   - Tracks completed, failed, and skipped videos
   - Generates summary after each batch

### Cost Breakdown

| Item                       | Cost     |
| -------------------------- | -------- |
| Per video (Flash model)    | ~$0.0008 |
| 481 remaining videos       | ~$0.38   |
| Total for complete library | ~$0.52   |

### Time Estimates

| Batch Size | Time per Video  | Time for 481 Videos |
| ---------- | --------------- | ------------------- |
| 1          | 2.5s            | ~20 minutes         |
| 50         | 2.5s + overhead | ~25 hours           |

---

## 🔄 Resume Capability

The processor saves progress to `processing-progress.json`:

```json
{
  "completed": [{ "index": 1, "videoId": "...", "timestamp": "..." }],
  "failed": [{ "index": 5, "videoId": "...", "error": "..." }],
  "skipped": [{ "index": 3, "reason": "no_transcript" }],
  "lastProcessedIndex": 166,
  "startTime": "2026-01-30T01:55:00.000Z"
}
```

**To resume:** Simply run `node batch-processor.js --resume`

**To reset:** Delete `processing-progress.json`

---

## 📂 Output Structure

```
my-ai-knowledge-base/
├── video-reports/
│   ├── api_001_videoId.md          # AI-analyzed reports
│   ├── api_002_videoId.md
│   └── ... (647 files when complete)
│
├── knowledge-base/
│   ├── consolidated_ai_knowledge.md  # Master knowledge base
│   ├── README.md                      # Index
│   └── topics/
│       ├── llms-and-transformers.md
│       ├── rag-and-vector-dbs.md
│       └── ...
│
├── processing-summary.md            # Processing statistics
└── notebooklm-exports/
    ├── all-videos-urls.txt
    └── processed-videos-urls.txt
```

---

## 🛠️ Troubleshooting

### "GEMINI_API_KEY not set"

```bash
export GEMINI_API_KEY="your-key-here"
# Or add to ~/.zshrc for persistence
```

### "yt-dlp not found"

```bash
brew install yt-dlp
# or
pip install yt-dlp
```

### Videos failing consistently

```bash
# Check specific video
node batch-processor.js --start=200 --end=200

# View failed videos in progress file
cat processing-progress.json | jq '.failed'
```

### Process interrupted

```bash
# Simply resume - it will skip already processed videos
node batch-processor.js --resume
```

---

## 📈 Monitoring Progress

### Real-time monitoring

```bash
# Watch status updates
watch -n 30 node check-status.js

# Or check summary file
tail -f my-ai-knowledge-base/processing-summary.md
```

### After each batch

The processor automatically generates:

- Console progress updates
- `processing-progress.json` (state)
- `processing-summary.md` (human-readable report)

---

## 🎉 Expected Outcomes

After completing all 647 videos:

1. **647 markdown reports** in `video-reports/`
2. **Consolidated knowledge base** (~2-3 MB markdown file)
3. **Topic-organized files** for easy navigation
4. **NotebookLM-ready exports** for audio overviews
5. **Complete searchable index** of your AI video library

---

## 💡 Tips

- Run overnight:
  `nohup node batch-processor.js --resume > processing.log 2>&1 &`
- Process in parallel ranges (different terminal windows):
  ```bash
  node batch-processor.js --start=1 --end=200
  node batch-processor.js --start=201 --end=400
  node batch-processor.js --start=401 --end=647
  ```
- Check cost in Google Cloud Console to track API usage

---

_Generated for AI Video Intelligence Suite_
