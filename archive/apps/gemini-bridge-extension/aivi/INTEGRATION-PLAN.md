# AI Video Intelligence Suite → The New Fuse Integration Plan

## Executive Summary

This document outlines the strategy for:

1. Separating personal video data from the public AI Video Intelligence Suite
   repository
2. Integrating AI Video Intelligence capabilities into The New Fuse
3. Leveraging NotebookLM's new bulk YouTube URL feature
4. Creating an evolving knowledge base system

---

## 1. Repository Reorganization

### Public Repository (ai-video-intelligence-suite)

**Keep in GitHub:** Core technology without personal data

✅ **Include:**

- Chrome extension core (manifest, background.js, popup.js, content scripts)
- Processing scripts (framework only, no personal data)
- Documentation (generic guides, not personal status)
- Tool architecture
- OAuth2 integration code
- API integration patterns

❌ **Exclude (added to .gitignore):**

- Personal video library (ai_video_library.html)
- Video reports (data/video-reports/)
- Processing status docs (PROCESSING-COMPLETE-SUMMARY.md, etc.)
- JSON data files (\*-videos.json)
- Consolidated knowledge base (consolidated_ai_knowledge.md)
- API keys and credentials

### Personal Data Location

**Store locally:** `/path/to/Desktop/A1-Inter-LLM-Com/my-ai-knowledge-base/`

```
The-New-Fuse/
├── data/
│   ├── video-library/
│   │   ├── ai_video_library.html
│   │   ├── recent-videos.json
│   │   └── processing-status.json
│   ├── video-reports/
│   │   ├── api_*.md (645 files)
│   │   └── transcript_*.md (legacy)
│   ├── knowledge-base/
│   │   ├── consolidated_ai_knowledge.md
│   │   ├── index/
│   │   └── embeddings/
│   └── processing-logs/
```

---

## 2. NotebookLM Bulk YouTube URL Integration

### New Feature Analysis

**NotebookLM Now Accepts:**

- Bulk YouTube URLs (space or newline separated)
- Only text transcripts imported
- Public videos only
- Recently uploaded may not be available

### Integration Strategy

#### Option A: Direct YouTube URL Export

Create a tool that exports video URLs directly for NotebookLM:

```javascript
// generate-notebooklm-urls.js
const videos = loadVideoLibrary();
const urls = videos.map((v) => v.url).join('\n');
fs.writeFileSync('notebooklm-urls.txt', urls);
console.log(`Generated ${videos.length} URLs for NotebookLM`);
```

**Pros:**

- Simple, fast
- No AI processing cost
- Uses NotebookLM's native YouTube support

**Cons:**

- Loses our structured analysis (keyPoints, aiConcepts, etc.)
- Dependent on YouTube's captions availability
- No custom prompt engineering
- Can't filter or prioritize content

#### Option B: Hybrid Approach (RECOMMENDED)

Use our analysis for rich knowledge base, NotebookLM for quick summaries:

1. **Primary Knowledge Base:** Use our 645 processed reports (2.5MB)
   - Rich structured data
   - Custom analysis
   - Tagged and categorized

2. **NotebookLM Quick Summaries:** Bulk upload URLs for:
   - New videos before processing
   - Quick podcast generation
   - Verification of our analysis
   - Different perspective

**Implementation:**

```javascript
// Export URLs for NotebookLM quick check
function exportForNotebookLM(videos) {
  return {
    allUrls: videos.map((v) => v.url).join('\n'),
    unprocessedUrls: videos
      .filter((v) => !v.processed)
      .map((v) => v.url)
      .join('\n'),
    priorityUrls: videos
      .filter((v) => v.priority)
      .map((v) => v.url)
      .join('\n'),
  };
}
```

---

## 3. The New Fuse Integration Architecture

### Current State (from Explore agent findings)

**TNF Chrome Extension:**
`/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/chrome-extension/`

**Already Has:**

- ✅ YouTube OAuth2 service (`src/v5/services/ai-studio/youtube-service.js`)
- ✅ AI Studio automation (`src/v5/content/ai-studio/ai-studio.js`)
- ✅ NotebookLM integration (`src/v5/services/ai-studio/notebooklm-service.js`)
- ✅ Services tab with AI Video Intelligence card
- ✅ 6-tier processing hierarchy (FREE → AI Studio)
- ✅ Knowledge base service (`knowledge-base-service.js`)

**Missing from AI Video Intelligence Suite:**

- ❌ Multi-account switching fix (background.js improvements)
- ❌ Watch history fetching tools
- ❌ Gemini Personal Intelligence integration
- ❌ Consolidated knowledge base generation
- ❌ Direct API processing (DirectAPIProcessor.js)
- ❌ Recent video processing workflows

### Integration Plan

#### Phase 1: Core Enhancements (Non-Breaking)

**1.1 Enhanced Authentication** File:
`The-New-Fuse/apps/chrome-extension/src/v5/services/ai-studio/authentication-service.js`

Add from AI Video Intelligence Suite:

- Account switching detection
- Enhanced token clearing
- User profile fetching
- Account comparison logic

```javascript
// NEW: Add to authentication-service.js
async handleAuthSuccess(token) {
  // Fetch user profile
  const userProfile = await this.fetchUserProfile(token);

  // Check for account switch
  const stored = await chrome.storage.local.get('lastAuthAccount');
  if (stored.lastAuthAccount && userProfile.email !== stored.lastAuthAccount) {
    console.log(`Account switched from ${stored.lastAuthAccount} to ${userProfile.email}`);
    // Clear cached data
    await this.clearAccountData();
  }

  // Store new account
  await chrome.storage.local.set({
    lastAuthAccount: userProfile.email,
    userProfile: userProfile
  });
}

async clearAccountData() {
  await chrome.storage.local.remove([
    'cachedPlaylists',
    'cachedVideos',
    'processingQueue'
  ]);
}
```

**1.2 Watch History Integration** File:
`The-New-Fuse/apps/chrome-extension/src/v5/services/ai-studio/youtube-service.js`

Add methods:

```javascript
// NEW: Add to YouTubeService class
async getRecentWatchHistory(maxResults = 50) {
  // Note: Direct API access removed by YouTube
  // Use liked videos as proxy or Gemini Personal Intelligence
  return await this.getLikedVideos(maxResults);
}

async getLikedVideos(maxResults = 50) {
  const response = await fetch(
    `${this.baseUrl}/videos?part=snippet&myRating=like&maxResults=${maxResults}`,
    { headers: { Authorization: `Bearer ${this.accessToken}` } }
  );
  return response.json();
}

generateGeminiPrompt(videoCount = 50) {
  return `Using your Personal Intelligence access to my YouTube watch history,
provide my last ${videoCount} watched videos.

Filter out political content.

Format as JSON array:
[
  {
    "title": "Video Title",
    "url": "https://www.youtube.com/watch?v=...",
    "channel": "Channel Name",
    "description": "Brief description"
  }
]`;
}
```

**1.3 Direct API Processing** New File:
`The-New-Fuse/packages/gemini-browser-skill/src/DirectAPIProcessor.js`

Copy from AI Video Intelligence Suite with modifications:

- Remove hardcoded paths
- Use TNF config system
- Integrate with TNF storage
- Add to processing pipeline

**1.4 Knowledge Base Generation** File:
`The-New-Fuse/apps/chrome-extension/src/v5/services/ai-studio/knowledge-base-service.js`

Enhance with:

```javascript
// NEW: Add consolidation methods
async generateConsolidatedKnowledgeBase(reports) {
  const consolidated = reports.map(r => this.parseReport(r)).join('\n\n---\n\n');

  // Store in indexed DB for search
  await this.indexKnowledgeBase(consolidated);

  return {
    content: consolidated,
    size: consolidated.length,
    reportCount: reports.length,
    generated: new Date().toISOString()
  };
}

async exportForNotebookLM(format = 'urls') {
  if (format === 'urls') {
    // Bulk URL export
    const videos = await this.getAllVideos();
    return videos.map(v => v.url).join('\n');
  } else {
    // Consolidated markdown export
    return await this.generateConsolidatedKnowledgeBase(reports);
  }
}
```

#### Phase 2: UI Enhancements (Services Tab)

**2.1 Update Services Tab** File:
`The-New-Fuse/apps/chrome-extension/src/v5/popup/index.html`

Enhance AI Video Intelligence card:

```html
<div class="service-card">
  <div class="service-header">
    <h3>🎬 AI Video Intelligence</h3>
    <span class="status-dot" id="ai-video-status"></span>
  </div>
  <p>YouTube + AI Studio + NotebookLM</p>

  <!-- NEW: Expanded controls -->
  <div class="service-actions">
    <button id="ai-video-auth" class="btn-primary">🔐 Auth</button>
    <button id="ai-video-process" class="btn-secondary">⚡ Process</button>
    <button id="ai-video-history" class="btn-secondary">
      📺 Import History
    </button>
    <button id="ai-video-export" class="btn-secondary">📤 Export</button>
  </div>

  <!-- NEW: Stats display -->
  <div class="service-stats">
    <span>Processed: <strong id="videos-processed">0</strong></span>
    <span>Library: <strong id="videos-total">0</strong></span>
    <span>Cost: <strong id="processing-cost">$0.00</strong></span>
  </div>

  <!-- NEW: Account display -->
  <div class="account-info">
    <small id="current-account">Not authenticated</small>
  </div>
</div>
```

**2.2 Enhanced Popup Logic** File:
`The-New-Fuse/apps/chrome-extension/src/v5/popup/popup.js`

Add handlers:

```javascript
// NEW: Enhanced AI Video Intelligence controls
document
  .getElementById('ai-video-history')
  .addEventListener('click', async () => {
    const prompt = await chrome.runtime.sendMessage({
      action: 'AI_VIDEO_GENERATE_HISTORY_PROMPT',
    });

    // Show modal with prompt
    showPromptModal(prompt, 'gemini.google.com');
  });

document
  .getElementById('ai-video-export')
  .addEventListener('click', async () => {
    const options = [
      'URLs for NotebookLM',
      'Consolidated Markdown',
      'JSON Data',
    ];
    const choice = await showChoiceModal('Export Format', options);

    const result = await chrome.runtime.sendMessage({
      action: 'AI_VIDEO_EXPORT',
      format: choice,
    });

    downloadFile(result.filename, result.content);
  });

// NEW: Update stats display
async function refreshAIVideoStats() {
  const stats = await chrome.runtime.sendMessage({
    action: 'AI_VIDEO_GET_STATS',
  });

  document.getElementById('videos-processed').textContent = stats.processed;
  document.getElementById('videos-total').textContent = stats.total;
  document.getElementById('processing-cost').textContent =
    `$${stats.cost.toFixed(2)}`;
  document.getElementById('current-account').textContent =
    stats.account || 'Not authenticated';
}
```

#### Phase 3: Knowledge Base System

**3.1 Evolving Knowledge Base Architecture**

Create: `The-New-Fuse/packages/knowledge-base/`

```
knowledge-base/
├── src/
│   ├── ingest/
│   │   ├── VideoProcessor.ts
│   │   ├── TranscriptExtractor.ts
│   │   └── GeminiAnalyzer.ts
│   ├── index/
│   │   ├── VectorStore.ts
│   │   ├── SemanticSearch.ts
│   │   └── ConceptGraph.ts
│   ├── evolution/
│   │   ├── ContentRanker.ts       # Ranks by recency, relevance
│   │   ├── DuplicateDetector.ts   # Finds similar content
│   │   └── VersionManager.ts      # Tracks content evolution
│   └── retrieval/
│       ├── QueryEngine.ts
│       ├── ContextBuilder.ts
│       └── AgentInterface.ts
├── package.json
└── README.md
```

**3.2 Evolution Strategy**

```typescript
// ContentRanker.ts - Determines which knowledge to keep
class ContentRanker {
  rankVideos(videos: Video[]): RankedVideo[] {
    return videos
      .map((v) => ({
        ...v,
        score: this.calculateScore(v),
        rank: 0, // Set after sorting
      }))
      .sort((a, b) => b.score - a.score);
  }

  calculateScore(video: Video): number {
    let score = 0;

    // Recency (newer = better)
    const ageInDays = (Date.now() - video.publishedAt) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 100 - ageInDays / 3.65); // Decay over 1 year

    // Relevance (AI concepts mentioned)
    score += video.aiConcepts.length * 5;

    // Technical depth
    score += video.technicalDetails.length * 3;

    // Uniqueness (not duplicate)
    score += video.isUnique ? 20 : 0;

    return score;
  }

  identifyObsolete(videos: RankedVideo[]): Video[] {
    // Find videos superseded by newer content
    return videos.filter(
      (v) => v.score < 50 && this.hasNewerEquivalent(v, videos)
    );
  }
}
```

**3.3 Agent Interface**

```typescript
// AgentInterface.ts - How TNF agents access knowledge
class KnowledgeBaseAgent {
  async query(
    userQuery: string,
    context?: AgentContext
  ): Promise<KnowledgeResult> {
    // Semantic search
    const relevantVideos = await this.vectorStore.search(userQuery, 10);

    // Build context
    const knowledge = await this.contextBuilder.build(relevantVideos, context);

    // Return structured knowledge
    return {
      videos: relevantVideos,
      concepts: this.extractConcepts(relevantVideos),
      techniques: this.extractTechniques(relevantVideos),
      tools: this.extractTools(relevantVideos),
      context: knowledge,
    };
  }

  async getLatestOnTopic(topic: string): Promise<Video[]> {
    const videos = await this.search(topic);
    return videos.sort((a, b) => b.publishedAt - a.publishedAt).slice(0, 5);
  }
}
```

---

## 4. Implementation Roadmap

### Week 1: Foundation

- ✅ Separate personal data from public repo (.gitignore)
- ✅ Copy personal data to TNF/data/
- ✅ Update AI Video Intelligence Suite repo (remove personal files)
- ✅ Create INTEGRATION-PLAN.md (this document)

### Week 2: Core Integration

- [ ] Enhance TNF authentication with account switching
- [ ] Add watch history tools to TNF youtube-service
- [ ] Integrate DirectAPIProcessor into TNF pipeline
- [ ] Add bulk export features

### Week 3: UI & UX

- [ ] Update Services tab with enhanced controls
- [ ] Add stats display
- [ ] Add export options (URLs, Markdown, JSON)
- [ ] Add history import workflow

### Week 4: Knowledge Base

- [ ] Create knowledge-base package
- [ ] Implement vector search
- [ ] Build content ranking system
- [ ] Create agent interface

### Week 5: Testing & Docs

- [ ] Test all features
- [ ] Update TNF documentation
- [ ] Create user guides
- [ ] Video tutorials

---

## 5. Key Decisions

### Question 1: NotebookLM Strategy

**Decision:** Hybrid approach

- Use NotebookLM bulk URLs for quick summaries
- Keep our rich analysis as primary knowledge base
- Provides redundancy and different perspectives

### Question 2: Data Storage

**Decision:** TNF-centric storage

- Personal video data in `TNF/data/video-library/`
- Reports in `TNF/data/video-reports/`
- Knowledge base in `TNF/data/knowledge-base/`
- Processing logs in `TNF/data/processing-logs/`

### Question 3: Processing Pipeline

**Decision:** Tiered approach

1. NotebookLM bulk URLs (free, fast, basic)
2. DirectAPI with Gemini Flash (cheap, structured)
3. Gemini Personal Intelligence (manual, rich context)
4. AI Studio automation (visual content)

---

## 6. Safety Checklist

Before making any changes to TNF:

- [ ] Backup current TNF state
- [ ] Read existing code thoroughly
- [ ] Test in isolation first
- [ ] Use feature flags for new code
- [ ] Monitor for regressions
- [ ] Document all changes
- [ ] Create rollback plan

**Critical Files to NOT Break:**

- TNF relay server
- WebSocket connections
- Agent federation system
- Native host integration
- Existing popup functionality

---

## 7. Next Steps

1. **Review this plan** - Confirm strategy
2. **Backup TNF** - Full project backup
3. **Start Phase 1.1** - Authentication enhancements
4. **Test incrementally** - Each feature in isolation
5. **Document changes** - Update TNF docs as we go

---

**Status:** Ready for implementation **Priority:** High (evolving knowledge base
core to TNF mission) **Risk:** Medium (requires careful TNF integration)
**Timeline:** 5 weeks to full integration
