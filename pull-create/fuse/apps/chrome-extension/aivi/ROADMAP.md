# AI Video Intelligence Suite - Development Roadmap

## Last Updated: January 4, 2026

---

## 🎯 Short-Term Goal: Process Your 633+ Videos NOW

**Objective**: Get the automation working so you can process your entire
playlist using AI Studio's free Gemini Pro interface.

### Current Issues to Fix

#### Issue 1: Red "!" Badge in Toolbar

**Cause**: `AUTOMATION_ERROR` message being sent to background, triggering error
state **Location**: `background.js` lines 186-189

**Fix**: The automation is likely failing at one of these points:

1. Content script not finding DOM elements (AI Studio UI changes)
2. AI Studio tab not being properly detected
3. Queue not being passed correctly to content script

#### Issue 2: Blank "Current Video" Display

**Cause**: No video is being processed because automation isn't starting
properly **Location**: `ai-studio.js` line 76-83 (automationState)

**Fix**: Need to ensure:

1. `processingState.config.queue` is being read correctly on tab reload
2. Content script `init()` function has valid data

#### Issue 3: 0/0 Progress Counter

**Cause**: Video queue isn't being passed/stored correctly before automation
starts **Location**: `popup.js` startProcessing() -> `background.js`
startAutomation()

### Immediate Fix Tasks

```
[ ] Task 1: Fix DOM Selectors in ai-studio.js
    - AI Studio's UI may have changed; update selectors
    - Add fallback selectors for common UI patterns
    - Add debug logging to identify which step fails

[ ] Task 2: Verify Queue Flow
    - Popup selects videos -> AUTOMATION_START -> background stores config
    - AI Studio tab reloads -> content script reads processingState.config.queue
    - Should see: "Queue loaded: X videos" in console

[ ] Task 3: Add Robust Error Handling
    - Catch specific errors and display meaningful messages
    - Take screenshot on error for debugging
    - Add retry logic for transient failures
```

### Alternative Approach: Simplified Manual Mode

If DOM automation is too fragile, implement a **semi-automated mode**:

1. Extension popup shows the video list
2. User clicks a video -> Extension:
   - Copies the YouTube URL to clipboard
   - Opens AI Studio new chat
   - User pastes URL manually
   - Extension waits for completion and auto-downloads

### New Priority: Port Gap Analysis from CLI Tool

**Objective**: Bring the robust "Visual Gap Detection" logic from
`gemini-browser-skill` (CLI) into the Extension.

**Tasks**:

1. **Port `LocalAnalyst.ts` Logic**: Adapt the Gap Detection prompt for the
   Extension's `contentScript.js`.
2. **Implement Two-Phase Flow**:
   - Phase 1: Transcript-only process (Fast/Cheap).
   - Phase 2: User review of "Gap Flags".
   - Phase 3: Targeted Multimodal processing for flagged segments.
3. **Add "Visual Gaps" UI**: Show detected gaps in the Extension Popup.

---

## 🚀 Medium-Term Goal: Commercial Release

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           RAILWAY BACKEND                                │
│  ┌─────────────┐  ┌─────────────────┐  ┌──────────────────────────────┐ │
│  │ PostgreSQL  │  │ Node.js API     │  │ Redis Queue                  │ │
│  │ (Supabase)  │  │ (Express/Hono)  │  │ (Background Jobs)            │ │
│  └─────────────┘  └─────────────────┘  └──────────────────────────────┘ │
│         │                 │                        │                     │
│         └─────────────────┼────────────────────────┘                     │
│                           │                                              │
│  ┌────────────────────────┴────────────────────────────────────────────┐│
│  │                        API Endpoints                                 ││
│  │  POST /api/auth/google    - OAuth login                             ││
│  │  GET  /api/playlists      - List user's playlists                   ││
│  │  POST /api/queue          - Add videos to processing queue          ││
│  │  GET  /api/queue          - Get user's queue status                 ││
│  │  POST /api/process        - Start processing (uses AI Studio API)   ││
│  │  GET  /api/reports        - Get processed reports                   ││
│  │  POST /api/subscribe      - Stripe subscription webhook             ││
│  └──────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
           ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
           │ Chrome       │ │ Web          │ │ Mobile App   │
           │ Extension    │ │ Dashboard    │ │ (Future)     │
           │ (Import UI)  │ │ (Full UI)    │ │              │
           └──────────────┘ └──────────────┘ └──────────────┘
```

### Database Schema (PostgreSQL)

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  google_id VARCHAR(255),
  youtube_token_encrypted TEXT,
  tier VARCHAR(20) DEFAULT 'free',
  stripe_customer_id VARCHAR(255),
  daily_usage INTEGER DEFAULT 0,
  total_processed INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Video Queue
CREATE TABLE video_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  youtube_video_id VARCHAR(20) NOT NULL,
  title VARCHAR(500),
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
  priority INTEGER DEFAULT 0,
  added_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT
);

-- Processed Reports
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_queue_id UUID REFERENCES video_queue(id),
  user_id UUID REFERENCES users(id),
  segment_index INTEGER DEFAULT 0,
  content_markdown TEXT,
  word_count INTEGER,
  key_topics JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Subscription Plans
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  stripe_subscription_id VARCHAR(255),
  tier VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Railway Services

```yaml
# railway.toml
[build]
  builder = "NIXPACKS"

[deploy]
  startCommand = "npm start"
  healthcheckPath = "/health"
  restartPolicyType = "ON_FAILURE"

[[services]]
  name = "api"

[[services]]
  name = "worker"
  startCommand = "npm run worker"
```

### Chrome Extension Distribution

#### 1. Chrome Web Store Requirements

- [ ] Privacy policy page
- [ ] Terms of service page
- [ ] Support email
- [ ] Marketing screenshots (1280x800 or 640x400)
- [ ] Promotional tile (440x280)
- [ ] Description (max 132 characters)
- [ ] Detailed description (max unlimited)

#### 2. Extension Manifest Updates for Production

```json
{
  "name": "AI Video Intelligence Suite",
  "description": "Transform YouTube videos into actionable AI-powered insights",
  "externally_connectable": {
    "matches": ["https://aivideosuite.com/*"]
  },
  "host_permissions": ["https://api.aivideosuite.com/*"]
}
```

#### 3. Pricing Tiers (Stripe Products)

| Tier       | Monthly | Annual | Features                                            |
| ---------- | ------- | ------ | --------------------------------------------------- |
| Free       | $0      | $0     | 5 videos/day, 30-min max per video                  |
| Pro        | $19     | $190   | Unlimited videos, custom prompts, NotebookLM export |
| Team       | $49     | $490   | 5 seats, API access, priority support               |
| Enterprise | Custom  | Custom | Unlimited seats, SSO, dedicated support             |

---

## 📋 Implementation Phases

### Phase 1: Fix Current Extension (Week 1)

- [x] Set up extension structure
- [x] YouTube OAuth integration
- [x] Playlist fetching
- [ ] **Fix DOM automation for AI Studio**
- [ ] **Test with 5 videos end-to-end**
- [ ] **Process your 633-video playlist**

### Phase 2: Railway Backend (Week 2-3)

- [ ] Set up Railway project
- [ ] Create PostgreSQL database
- [ ] Implement user authentication (Google OAuth)
- [ ] Create queue management API
- [ ] Implement Stripe subscription handling

### Phase 3: Chrome Web Store (Week 3-4)

- [ ] Update extension to use backend API
- [ ] Create privacy policy and terms
- [ ] Design marketing materials
- [ ] Submit for Chrome Web Store review
- [ ] Handle review feedback

### Phase 4: Web Dashboard (Week 4-5)

- [ ] Create Next.js dashboard
- [ ] Implement video queue management
- [ ] Implement report viewing
- [ ] Add usage analytics
- [ ] Deploy to Vercel/Railway

### Phase 5: Launch (Week 5-6)

- [ ] Beta testing with select users
- [ ] Gather feedback and iterate
- [ ] Public launch announcement
- [ ] Marketing and content creation

---

## 🔧 Next Action Items

### RIGHT NOW (To process your playlist):

1. Reload the extension in Chrome (chrome://extensions -> reload)
2. Open AI Studio in a tab
3. Open the extension popup
4. Start automation
5. Watch the console for errors
6. Report which step fails

### If automation fails:

1. Open AI Studio: https://aistudio.google.com/app/prompts/new_chat
2. Open DevTools (F12)
3. Run: `chrome.storage.local.get('processingState', console.log)`
4. Check if queue is populated
5. Manually trigger automation:
   ```js
   // In console
   chrome.runtime.sendMessage({
     action: 'START_AUTOMATION',
     data: {
       /* your queue data */
     },
   });
   ```

---

## 📱 Contact & Support

For questions about this roadmap, contact the development team.
