# AI Studio Automator Integration

**Integration Date**: January 18, 2026 **Source Project**:
[ai-studio-automator](/path/to/Projects/ai-studio-automator) **Target**: The New
Fuse Chrome Extension

## Overview

The AI Video Intelligence Suite (AI Studio Automator) has been successfully
integrated into The New Fuse Chrome Extension, adding powerful YouTube video
processing and AI knowledge base capabilities.

## What Was Integrated

### 1. **Core Services** (9 modules)

Added to `apps/chrome-extension/src/services/ai-studio/`:

- **analytics-service.js** - Usage tracking and metrics
- **authentication-service.js** - Google OAuth2 authentication
- **developer-mode-service.js** - FREE processing mode for developers
- **knowledge-base-service.js** - Concept extraction and consolidation
- **notebooklm-service.js** - NotebookLM integration for podcasts
- **smart-processing-service.js** - 6-tier AI processing hierarchy
- **storage-service.js** - Data persistence with Chrome Storage API
- **subscription-service.js** - Tier management (Free/Pro/Enterprise)
- **youtube-service.js** - YouTube Data API v3 integration

### 2. **Content Scripts** (4 modules)

Added to `apps/chrome-extension/src/content-scripts/ai-studio/`:

- **ai-studio.js** - AI Studio automation (video upload, prompts, downloads)
- **iframe-bridge.js** - Cross-origin communication for iframes
- **youtube.js** - YouTube page enhancements and quick-add buttons
- **notebooklm.js** - NotebookLM automation for podcast creation

### 3. **Background Service**

Added to `apps/chrome-extension/src/background/`:

- **ai-studio-background.js** - Service worker for orchestration and message
  routing

### 4. **UI Components**

Added to `apps/chrome-extension/src/popup/ai-studio/`:

- **popup.html** - Full AI Video Intelligence UI
- **popup.js** - Event handlers and state management
- **popup.css** - Modern, responsive styling

Plus a new tab component:

- **ai-studio-tab.html** - Tab for the unified TNF extension popup

### 5. **Manifest Updates**

Updated `apps/chrome-extension/manifest.json` with:

- **New Permissions**: identity, cookies, alarms, contextMenus, webRequest,
  notifications, unlimitedStorage
- **Host Permissions**: YouTube, AI Studio, NotebookLM, Google APIs
- **OAuth2 Configuration**: YouTube API scopes
- **Content Scripts**: 4 new content scripts for different domains
- **Service Worker**: Background orchestration

## Features Added

### 🎬 YouTube Video Processing

- **OAuth2 Authentication** - Secure Google sign-in
- **Playlist Management** - Load and browse YouTube playlists
- **Multi-Select Videos** - Queue multiple videos for processing
- **Batch Operations** - Process hundreds of videos automatically

### 🤖 AI Processing (6-Tier Hierarchy)

**Level 1: YouTube Metadata** (FREE)

- Duration, title, description, tags
- Instant results

**Level 2: YouTube Transcripts** (FREE)

- Full video text content
- 90% of video information

**Level 3: Gemini Flash** ($0.01/video)

- AI analysis of transcripts
- Fast, affordable, good quality

**Level 4: Gemini Pro** ($0.15/video)

- Deep AI analysis
- Complex reasoning

**Level 5: Gemini Pro Vision** ($0.30/video)

- Multimodal analysis
- Visual + audio + text

**Level 6: AI Studio** (FREE with subscription)

- Uses existing Gemini Pro subscription
- Highest quality

### 🧠 Knowledge Base

- **Auto-Consolidation** - Merge insights from multiple videos
- **Concept Extraction** - Identify key concepts and themes
- **Deduplication** - Remove redundant information
- **Categorization** - Organize by topic
- **Export** - Markdown/JSON export

### 🎙️ Podcast Creation

- **NotebookLM Integration** - Bulk import to NotebookLM
- **Audio Overview Generation** - AI-generated podcast episodes
- **RSS Feed** - Distribute as podcast
- **Progress Tracking** - Monitor podcast creation

### 💰 Cost Optimization

- **Smart Processing** - Automatically select best tier
- **Cost Tracking** - Real-time cost monitoring
- **75% Savings** - Compared to always using premium tiers
- **Developer Mode** - FREE processing for development/testing

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    TNF Chrome Extension                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────┐        ┌──────────────────┐                │
│  │ Unified Popup  │        │ Background       │                │
│  │                │        │ Service Worker   │                │
│  │ • Fuse Connect │◄──────►│                  │                │
│  │ • AI Studio    │ msgs   │ • Message Router │                │
│  │ • Settings     │        │ • Orchestration  │                │
│  └────────────────┘        └────────┬─────────┘                │
│                                     │                           │
└─────────────────────────────────────┼───────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ↓                 ↓                 ↓
          ┌──────────────────┐ ┌────────────┐ ┌──────────────┐
          │ AI Studio        │ │ YouTube    │ │ NotebookLM   │
          │ Content Script   │ │ Script     │ │ Script       │
          └──────────────────┘ └────────────┘ └──────────────┘
                    │                 │                 │
                    ↓                 ↓                 ↓
          ┌──────────────────┐ ┌────────────┐ ┌──────────────┐
          │ aistudio         │ │ youtube    │ │ notebooklm   │
          │ .google.com      │ │ .com       │ │ .google.com  │
          └──────────────────┘ └────────────┘ └──────────────┘
```

## Data Flow

```
User Action (Popup)
       │
       ↓
Background Service Worker
       │
       ├─► YouTube API (Fetch playlists/videos)
       │
       ├─► Chrome Storage (Save queue)
       │
       ↓
Content Script (AI Studio)
       │
       ├─► Automate video upload
       ├─► Fill prompts
       ├─► Wait for completion
       └─► Download reports
       │
       ↓
Knowledge Base Service
       │
       ├─► Extract concepts
       ├─► Deduplicate
       └─► Consolidate
       │
       ↓
NotebookLM Service
       │
       ├─► Bulk import
       └─► Generate podcast
       │
       ↓
User Downloads/Exports
```

## Integration Benefits

### 1. **Unified Extension**

- One extension for all TNF capabilities
- No need to manage multiple extensions
- Shared authentication and settings

### 2. **Cross-Feature Synergy**

- AI Studio insights can feed into TNF agent network
- YouTube knowledge base can be used by TNF agents
- NotebookLM podcasts can be distributed via TNF

### 3. **Cost Optimization**

- Intelligent tier selection saves 75% on AI processing
- FREE options for metadata and transcripts
- Developer mode for testing

### 4. **Production Ready**

- Robust error handling
- Retry logic with exponential backoff
- Progress tracking and logging
- User-friendly UI

## Usage

### Quick Start

1. **Install Extension**

   ```bash
   cd apps/chrome-extension
   pnpm run build
   # Load dist/ folder in Chrome
   ```

2. **Set Up Google OAuth**
   - Go to https://console.cloud.google.com/
   - Create project: "The New Fuse"
   - Enable YouTube Data API v3
   - Create OAuth 2.0 Client ID (Chrome Extension)
   - Update manifest.json with your Client ID

3. **Use AI Studio Features**
   - Open extension popup
   - Click "AI Studio" tab
   - Sign in with Google
   - Select playlist
   - Choose videos
   - Click "Process"

### Processing a YouTube Playlist

```javascript
// Example: Process a playlist with Gemini Flash
1. Click "AI Studio" tab
2. Click "Sign in with Google"
3. Select playlist from dropdown
4. Click "Load Videos"
5. Select videos to process (or "Select All")
6. Choose processing tier: "Gemini Flash ($0.01/video)"
7. Click "Start Processing"
8. Wait for completion (progress bar shows status)
9. Download reports from Downloads folder
10. Click "Export Knowledge Base" for consolidated insights
```

### Creating a Podcast

```javascript
// Example: Create a podcast from processed videos
1. Process videos (see above)
2. Wait for processing to complete
3. Click "Sync to NotebookLM"
4. Click "Create Podcast"
5. Wait for audio overview generation
6. Download podcast episodes
```

## Cost Examples

### Processing 1,000 Videos

| Strategy           | Cost    | Time        | Quality       |
| ------------------ | ------- | ----------- | ------------- |
| Metadata Only      | $0      | Instant     | Basic         |
| Transcript + Flash | $10     | 1 hour      | Good          |
| Transcript + Pro   | $150    | 2 hours     | Excellent     |
| AI Studio          | $0\*    | 10 hours    | Premium       |
| **Smart Hybrid**   | **$37** | **3 hours** | **Excellent** |

\*Requires Gemini Pro subscription ($20/month)

### Smart Hybrid Strategy

- Use FREE metadata for quick overview (100%)
- Use FREE transcripts for text content (90%)
- Use Gemini Flash for AI analysis (70%)
- Use Gemini Pro for complex videos (20%)
- Use AI Studio for premium videos (10%)

**Result**: 75% cost savings, excellent quality

## Configuration

### Required Environment Variables

```bash
# Google Cloud OAuth
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE

# Optional: Gemini API Keys (for direct API usage)
GEMINI_API_KEY=YOUR_GEMINI_API_KEY

# Optional: YouTube API Key (for additional quota)
YOUTUBE_API_KEY=YOUR_YOUTUBE_API_KEY
```

### Manifest Configuration

Update `apps/chrome-extension/manifest.json`:

```json
{
  "oauth2": {
    "client_id": "YOUR_GOOGLE_CLOUD_CLIENT_ID_HERE",
    "scopes": [
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/drive.appdata",
      "profile",
      "email"
    ]
  }
}
```

## API Integration

The AI Studio services can be accessed via The New Fuse API:

```typescript
// Example: Process a video via TNF API
POST /api/ai-studio/process-video
{
  "videoUrl": "https://youtube.com/watch?v=...",
  "tier": "flash",
  "extractConcepts": true
}

// Response
{
  "status": "success",
  "report": "...",
  "concepts": [...],
  "cost": 0.01
}
```

## Testing

```bash
# Run extension tests
cd apps/chrome-extension
pnpm run test

# Test AI Studio automation
1. Open aistudio.google.com
2. Open extension popup
3. Click "AI Studio" tab
4. Add a test video URL
5. Click "Start Processing"
6. Verify automation works
```

## Troubleshooting

### Common Issues

**OAuth Error: "Invalid Client ID"**

- Update manifest.json with your Google Cloud Client ID
- Ensure OAuth consent screen is configured
- Add extension ID to authorized redirects

**Content Script Not Loading**

- Check manifest.json content_scripts configuration
- Ensure host_permissions include target domains
- Reload extension after manifest changes

**Automation Fails**

- Check AI Studio selectors (may change with UI updates)
- Update selectors in content-scripts/ai-studio/ai-studio.js
- Check console for error messages

**Rate Limiting**

- YouTube API has daily quota limits
- Add delay between API calls
- Use FREE methods (metadata, transcripts) when possible

## Future Enhancements

### Planned Features

- [ ] Cloud sync (Google Drive)
- [ ] Team collaboration
- [ ] Advanced analytics dashboard
- [ ] Custom prompt templates
- [ ] Multi-language support
- [ ] Mobile companion app
- [ ] API access for developers
- [ ] White-label option

### TNF Integration Opportunities

- [ ] Feed AI Studio insights into TNF agent network
- [ ] Use YouTube knowledge base for agent training
- [ ] Distribute NotebookLM podcasts via TNF frontend
- [ ] Create specialized agents for video analysis
- [ ] Build video recommendation system
- [ ] Extract code snippets from coding videos

## Documentation

- **Original Project**: `/path/to/Projects/ai-studio-automator`
- **Architecture**: `ai-studio-automator/ARCHITECTURE.md`
- **Business Strategy**: `ai-studio-automator/BUSINESS-STRATEGY.md`
- **Cost Optimization**: `ai-studio-automator/COST-OPTIMIZATION.md`
- **Quick Start**: `ai-studio-automator/QUICK-START.md`

## Support

For issues or questions:

- Check troubleshooting section above
- Review original project documentation
- Open issue in TNF repository
- Contact TNF development team

---

**Integration completed**: January 18, 2026 **Integrated by**: Claude Sonnet 4.5
**Project**: The New Fuse - Global Brain **Chrome Extension**: Fuse Connect - AI
Bridge
