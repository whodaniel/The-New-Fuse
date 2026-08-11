# AI Studio V5 Integration Plan

**Target**: Fuse Connect V6 Chrome Extension (dist-v5) **Primary UI**:
Injectable FloatingPanel **Secondary UI**: Extension Popup **Date**: January 18,
2026

## Integration Points

### 1. Injectable FloatingPanel - "Services" Tab

**Location**: `apps/chrome-extension/src/v5/content/injectable/FloatingPanel.ts`

The AI Studio features will be added to the existing "services" tab in the
floating panel that appears on AI platform pages.

#### Current Services Tab Structure

```typescript
// Existing tabs:
- chat: Main chat/messaging interface
- agents: Connected agents list
- channels: Federation channels
- notifications: System notifications
- **services**: ← ADD AI STUDIO HERE
- settings: Configuration
- tasks: Orchestration tasks
```

#### AI Studio Features to Add

**A. YouTube Video Processing**

- OAuth2 authentication button
- Playlist selector dropdown
- Video queue management
- Processing tier selector (FREE/Flash/Pro/Vision/AI Studio)
- Start/Pause/Stop controls
- Progress bar with current video status

**B. Knowledge Base**

- Concept count display
- Export to Markdown button
- Sync to NotebookLM button
- Search functionality (inline)

**C. Podcast Creation**

- Create Podcast button
- Audio overview status
- RSS feed link (when ready)

**D. Cost Tracking**

- Current session cost
- Total cost (all time)
- Cost per video breakdown

### 2. Extension Popup - "Services" Tab

**Location**: `apps/chrome-extension/src/v5/popup/index.html` + `popup.js`

Add AI Studio as service cards similar to existing TNF services (relay, backend,
frontend).

#### Service Cards to Add

```html
<div class="service-card" data-service="ai-studio">
  <div class="service-icon">🎬</div>
  <div class="service-info">
    <div class="service-name">AI Video Intelligence</div>
    <div class="service-port">YouTube + AI Studio</div>
  </div>
  <div class="service-status">
    <span class="status-dot" id="ai-studio-status"></span>
  </div>
  <div class="service-actions">
    <button class="btn-small">Auth</button>
    <button class="btn-small">Process</button>
  </div>
</div>
```

### 3. V5 Manifest Updates

**Location**: `apps/chrome-extension/src/v5/manifest.json`

#### Permissions to Add

```json
{
  "permissions": [
    "identity", // OAuth2
    "cookies", // YouTube auth
    "alarms", // Scheduled tasks
    "contextMenus", // Right-click menus
    "webRequest", // API interception
    "unlimitedStorage" // Knowledge base storage
  ],

  "host_permissions": [
    "https://*.youtube.com/*",
    "https://aistudio.google.com/*",
    "https://notebooklm.google.com/*",
    "https://www.googleapis.com/*",
    "https://*.usercontent.goog/*"
  ],

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

#### Content Scripts to Add

```json
{
  "content_scripts": [
    {
      "matches": ["https://aistudio.google.com/*"],
      "js": ["content/ai-studio-automation.js"],
      "run_at": "document_idle",
      "all_frames": true
    },
    {
      "matches": ["https://*.youtube.com/*"],
      "js": ["content/youtube-integration.js"],
      "run_at": "document_idle"
    },
    {
      "matches": ["https://notebooklm.google.com/*"],
      "js": ["content/notebooklm-integration.js"],
      "run_at": "document_idle"
    }
  ]
}
```

### 4. Webpack Config Updates

**Location**: `apps/chrome-extension/webpack.v5.config.cjs`

#### Entry Points to Add

```javascript
entry: {
  'background/index': './src/v5/background/index.ts',
  'content/index': './src/v5/content/index.ts',
  'popup/popup': './src/v5/popup/popup.js',

  // NEW AI STUDIO ENTRIES
  'content/ai-studio-automation': './src/v5/content/ai-studio/ai-studio.ts',
  'content/youtube-integration': './src/v5/content/ai-studio/youtube.ts',
  'content/notebooklm-integration': './src/v5/content/ai-studio/notebooklm.ts',
},
```

## File Structure

```
apps/chrome-extension/src/v5/
├── background/
│   └── index.ts                          # Add AI Studio message handlers
├── content/
│   ├── index.ts                          # Main content script
│   ├── injectable/
│   │   └── FloatingPanel.ts              # ← ADD AI STUDIO TAB CONTENT HERE
│   └── ai-studio/                        # NEW
│       ├── ai-studio.ts                  # AI Studio automation (converted to TS)
│       ├── youtube.ts                    # YouTube integration (converted to TS)
│       ├── notebooklm.ts                 # NotebookLM integration (converted to TS)
│       └── iframe-bridge.ts              # Cross-origin communication
├── services/                             # NEW
│   └── ai-studio/
│       ├── youtube-service.ts            # YouTube API integration
│       ├── processing-service.ts         # AI processing logic
│       ├── knowledge-base-service.ts     # KB management
│       ├── notebooklm-service.ts         # Podcast creation
│       ├── auth-service.ts               # OAuth2 handler
│       └── storage-service.ts            # Data persistence
├── popup/
│   ├── index.html                        # ← ADD AI STUDIO SERVICE CARD
│   └── popup.js                          # ← ADD AI STUDIO HANDLERS
└── shared/
    └── types.ts                          # Add AI Studio types
```

## Implementation Steps

### Step 1: Convert JS to TypeScript

- [x] Move AI Studio .js files to V5 structure
- [ ] Convert to TypeScript (.ts)
- [ ] Add type definitions
- [ ] Fix import/export statements

### Step 2: Add to FloatingPanel

- [ ] Add AI Studio content to `renderServicesTab()`
- [ ] Add event handlers for AI Studio controls
- [ ] Add state management for video queue
- [ ] Add progress tracking UI

### Step 3: Add to Popup

- [ ] Add AI Studio service cards to Services tab HTML
- [ ] Add event handlers in popup.js
- [ ] Add status indicators
- [ ] Add quick actions (Auth, Process)

### Step 4: Update Manifest & Webpack

- [ ] Update V5 manifest.json with permissions
- [ ] Add OAuth2 configuration
- [ ] Update webpack config with new entry points
- [ ] Add copy patterns for assets

### Step 5: Background Script Integration

- [ ] Add message handlers for AI Studio events
- [ ] Add OAuth2 flow handlers
- [ ] Add state synchronization
- [ ] Add native messaging for automation

### Step 6: Testing

- [ ] Test OAuth2 flow
- [ ] Test video processing automation
- [ ] Test knowledge base operations
- [ ] Test NotebookLM integration
- [ ] Test popup controls
- [ ] Test floating panel UI

## UI Mock-ups

### FloatingPanel - Services Tab

```
┌──────────────────────────────────────┐
│ 🎬 AI Video Intelligence            │
├──────────────────────────────────────┤
│                                      │
│ [🔐 Sign in with Google]            │
│                                      │
│ 📺 Playlist: [Select...        ▼]   │
│ [Load Videos]                        │
│                                      │
│ 📋 Queue (0 videos)                  │
│ ┌──────────────────────────────────┐ │
│ │ (empty)                          │ │
│ └──────────────────────────────────┘ │
│                                      │
│ 🎯 Processing: [Gemini Flash   ▼]   │
│                                      │
│ [▶ Start] [⏸ Pause] [⏹ Stop]       │
│                                      │
│ ⚡ Progress: ████████░░░░ 8/10       │
│ Currently: "How to Build Apps..."    │
│                                      │
│ 🧠 Knowledge Base                    │
│ Concepts: 147 | Videos: 10           │
│ [Export MD] [Sync NotebookLM]        │
│                                      │
│ 💰 Cost: $0.08 session / $2.45 total│
└──────────────────────────────────────┘
```

### Popup - Services Tab

```
┌──────────────────────────────────────┐
│ TNF Services                    🔄   │
├──────────────────────────────────────┤
│                                      │
│ 🔌 TNF Relay          [●] Running    │
│ Port 3001                            │
│ [Start] [Stop]                       │
│                                      │
│ ⚙ TNF Backend         [○] Stopped   │
│ Port 3000                            │
│ [Start] [Stop]                       │
│                                      │
│ 🌐 TNF Frontend       [●] Running    │
│ Port 3002                            │
│ [Start] [Stop]                       │
│                                      │
│ 🎬 AI Video Intelligence [○]         │
│ YouTube + AI Studio                  │
│ [Auth] [Process]                     │
│                                      │
│ [🚀 Start All Services]              │
│ [⏹ Stop All Services]                │
└──────────────────────────────────────┘
```

## Type Definitions to Add

```typescript
// apps/chrome-extension/src/v5/shared/types.ts

export interface AIStudioState {
  isAuthenticated: boolean;
  userEmail: string | null;
  currentPlaylist: YouTubePlaylist | null;
  videoQueue: VideoQueueItem[];
  processingTier: ProcessingTier;
  isProcessing: boolean;
  currentVideoIndex: number;
  sessionCost: number;
  totalCost: number;
  knowledgeBase: KnowledgeBase;
}

export type ProcessingTier =
  | 'metadata'
  | 'transcript'
  | 'flash'
  | 'pro'
  | 'vision'
  | 'ai-studio';

export interface VideoQueueItem {
  id: string;
  title: string;
  url: string;
  duration: number;
  processed: boolean;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  report?: string;
  cost?: number;
}

export interface YouTubePlaylist {
  id: string;
  title: string;
  videoCount: number;
  videos: VideoQueueItem[];
}

export interface KnowledgeBase {
  concepts: Concept[];
  totalVideos: number;
  lastUpdated: number;
}

export interface Concept {
  id: string;
  name: string;
  description: string;
  sources: string[]; // video IDs
  count: number;
}
```

## Cost Optimization Strategy

The AI Studio integration implements a 6-tier processing hierarchy:

1. **Metadata** (FREE) - Basic video info
2. **Transcript** (FREE) - Full text content
3. **Gemini Flash** ($0.01/video) - Fast AI analysis
4. **Gemini Pro** ($0.15/video) - Deep analysis
5. **Gemini Vision** ($0.30/video) - Multimodal
6. **AI Studio** (FREE\*) - Premium with subscription

**Smart Hybrid Strategy**: Process 1,000 videos for $37 (vs $150 all-premium)

## Next Steps

1. **Immediate**: Convert AI Studio JS files to TypeScript
2. **High Priority**: Add AI Studio UI to FloatingPanel services tab
3. **High Priority**: Update V5 manifest with permissions
4. **Medium Priority**: Add service cards to popup
5. **Medium Priority**: Implement OAuth2 flow
6. **Low Priority**: Add advanced features (cost tracking, analytics)

## Benefits

### For Users on AI Platforms

- Process YouTube videos while using ChatGPT/Claude/Gemini
- Build knowledge base from educational content
- Create AI-generated podcasts from videos
- All within the same floating panel interface

### For TNF Ecosystem

- AI Studio insights can feed into agent network
- Video knowledge base enhances agent capabilities
- Unified interface for all AI tools
- Cost-optimized processing saves 75%

---

**Status**: Ready for implementation **Priority**: High **Est. Completion**: 2-3
hours of focused work
