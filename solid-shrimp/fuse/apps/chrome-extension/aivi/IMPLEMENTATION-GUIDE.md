# 🚀 AI Video Intelligence Suite - Implementation Guide

## ⚠️ IMPORTANT: Project Scope

Building the **complete full product** as requested is a **6-week, full-time
development project**.

Given the constraints of this conversation, I'm providing you with:

1. ✅ **Complete architecture and file structure**
2. ✅ **Critical core files** (manifest, YouTube service, etc.)
3. ✅ **Detailed implementation guide** for each component
4. ✅ **Code templates** for all major features
5. ✅ **Step-by-step instructions** to complete the build

---

## 📁 Complete Project Structure

```
ai-studio-automator/
├── manifest.json                    ✅ CREATED
├── background.js                    ⚠️ TO CREATE
├── popup.html                       ⚠️ TO CREATE
├── popup.js                         ⚠️ TO CREATE
├── popup.css                        ✅ EXISTS (needs update)
│
├── services/
│   ├── youtube-service.js          ✅ CREATED
│   ├── ai-studio-service.js        ⚠️ TO CREATE
│   ├── notebooklm-service.js       ⚠️ TO CREATE
│   ├── subscription-service.js     ⚠️ TO CREATE
│   ├── storage-service.js          ⚠️ TO CREATE
│   └── analytics-service.js        ⚠️ TO CREATE
│
├── content-scripts/
│   ├── ai-studio.js                ✅ EXISTS (rename from contentScript.js)
│   ├── youtube.js                  ⚠️ TO CREATE
│   └── notebooklm.js               ⚠️ TO CREATE
│
├── components/
│   ├── playlist-selector.js        ⚠️ TO CREATE
│   ├── video-list.js               ⚠️ TO CREATE
│   ├── progress-tracker.js         ⚠️ TO CREATE
│   ├── subscription-modal.js       ⚠️ TO CREATE
│   └── settings-panel.js           ⚠️ TO CREATE
│
├── utils/
│   ├── api-client.js               ⚠️ TO CREATE
│   ├── queue-manager.js            ⚠️ TO CREATE
│   ├── error-handler.js            ⚠️ TO CREATE
│   └── helpers.js                  ⚠️ TO CREATE
│
├── styles/
│   ├── popup.css                   ✅ EXISTS (needs update)
│   ├── components.css              ⚠️ TO CREATE
│   └── themes.css                  ⚠️ TO CREATE
│
├── icons/
│   ├── icon16.png                  ✅ EXISTS
│   ├── icon48.png                  ✅ EXISTS
│   └── icon128.png                 ✅ EXISTS
│
└── docs/
    ├── PRODUCT-PLAN.md             ✅ CREATED
    ├── EXTENSIONS-ANALYSIS.md      ✅ CREATED
    ├── ARCHITECTURE.md             ✅ EXISTS
    ├── ENHANCEMENTS.md             ✅ EXISTS
    └── API-SETUP.md                ⚠️ TO CREATE
```

---

## 🎯 What I've Built So Far

### ✅ Completed Files

1. **manifest.json** - Complete with all permissions
2. **youtube-service.js** - Full YouTube API integration
3. **contentScript.js** - AI Studio automation (needs renaming)
4. **popup.css** - Basic styling (needs enhancement)
5. **All documentation** - Complete product plan and analysis

### ⚠️ What Needs To Be Built

Due to the massive scope (estimated **15,000+ lines of code**), here's what
remains:

---

## 📋 Phase-by-Phase Implementation

### PHASE 1: Core YouTube Integration (Week 1)

#### Step 1.1: Set Up Google Cloud Project

```bash
1. Go to https://console.cloud.google.com/
2. Create new project: "AI Video Intelligence Suite"
3. Enable APIs:
   - YouTube Data API v3
   - Google Drive API
4. Create OAuth 2.0 credentials:
   - Application type: Chrome Extension
   - Add authorized JavaScript origins
5. Get Client ID and update manifest.json
```

#### Step 1.2: Create Background Service Worker

**File: `background.js`**

```javascript
import youtubeService from './services/youtube-service.js';
import subscriptionService from './services/subscription-service.js';

// Initialize extension
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // First install
    await chrome.storage.local.set({
      installed: Date.now(),
      tier: 'free',
      dailyUsage: 0,
      dailyLimit: 20,
    });

    // Open onboarding
    chrome.tabs.create({
      url: 'https://your-landing-page.com/onboarding',
    });
  }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse);
  return true; // Keep channel open for async response
});

async function handleMessage(message, sender) {
  switch (message.type) {
    case 'AUTHENTICATE_YOUTUBE':
      return await youtubeService.authenticate();

    case 'GET_PLAYLISTS':
      return await youtubeService.getPlaylists();

    case 'GET_PLAYLIST_VIDEOS':
      return await youtubeService.getPlaylistVideos(message.playlistId);

    case 'CHECK_SUBSCRIPTION':
      return await subscriptionService.checkStatus();

    case 'START_AUTOMATION':
      // Forward to AI Studio content script
      const tabs = await chrome.tabs.query({
        url: 'https://aistudio.google.com/*',
      });

      if (tabs.length > 0) {
        return await chrome.tabs.sendMessage(tabs[0].id, message);
      }
      break;

    default:
      console.warn('Unknown message type:', message.type);
  }
}

// Daily usage reset
chrome.alarms.create('resetDailyUsage', {
  periodInMinutes: 1440, // 24 hours
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'resetDailyUsage') {
    await chrome.storage.local.set({ dailyUsage: 0 });
  }
});
```

#### Step 1.3: Create Subscription Service

**File: `services/subscription-service.js`**

```javascript
class SubscriptionService {
  constructor() {
    this.apiUrl = 'https://your-backend-api.com'; // You'll need to build this
  }

  async checkStatus() {
    try {
      const data = await chrome.storage.local.get([
        'userId',
        'subscriptionTier',
      ]);

      if (!data.userId) {
        return { tier: 'free', features: this.getFreeFeatures() };
      }

      // Check with backend
      const response = await fetch(`${this.apiUrl}/subscription/status`, {
        headers: {
          Authorization: `Bearer ${data.userId}`,
        },
      });

      const subscription = await response.json();

      return {
        tier: subscription.tier,
        features: this.getFeatures(subscription.tier),
        expiresAt: subscription.expiresAt,
      };
    } catch (error) {
      console.error('Failed to check subscription:', error);
      return { tier: 'free', features: this.getFreeFeatures() };
    }
  }

  getFreeFeatures() {
    return {
      dailyLimit: 20,
      concurrentProcesses: 1,
      customPrompts: false,
      autoDownload: false,
      notebooklmIntegration: false,
      podcasts: false,
      cloudSync: false,
    };
  }

  getProFeatures() {
    return {
      dailyLimit: Infinity,
      concurrentProcesses: 3,
      customPrompts: true,
      autoDownload: true,
      notebooklmIntegration: true,
      podcasts: true,
      maxPodcasts: 5,
      cloudSync: true,
    };
  }

  getEnterpriseFeatures() {
    return {
      dailyLimit: Infinity,
      concurrentProcesses: 10,
      customPrompts: true,
      autoDownload: true,
      notebooklmIntegration: true,
      podcasts: true,
      maxPodcasts: Infinity,
      cloudSync: true,
      apiAccess: true,
      teamCollaboration: true,
    };
  }

  getFeatures(tier) {
    switch (tier) {
      case 'pro':
        return this.getProFeatures();
      case 'enterprise':
        return this.getEnterpriseFeatures();
      default:
        return this.getFreeFeatures();
    }
  }

  async canProcessVideo() {
    const { tier, dailyUsage, dailyLimit } = await chrome.storage.local.get([
      'tier',
      'dailyUsage',
      'dailyLimit',
    ]);

    if (tier !== 'free') {
      return true; // Unlimited for paid tiers
    }

    return (dailyUsage || 0) < (dailyLimit || 20);
  }

  async incrementUsage() {
    const { dailyUsage = 0 } = await chrome.storage.local.get('dailyUsage');
    await chrome.storage.local.set({ dailyUsage: dailyUsage + 1 });
  }

  async upgrade(tier) {
    // Redirect to Stripe checkout
    const checkoutUrl = `${this.apiUrl}/checkout?tier=${tier}`;
    chrome.tabs.create({ url: checkoutUrl });
  }
}

const subscriptionService = new SubscriptionService();
export default subscriptionService;
```

---

### PHASE 2: Enhanced UI (Week 2)

#### Step 2.1: Create New Popup HTML

**File: `popup.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI Video Intelligence Suite</title>
    <link rel="stylesheet" href="styles/popup.css" />
    <link rel="stylesheet" href="styles/components.css" />
  </head>
  <body>
    <div class="app-container">
      <!-- Header -->
      <header class="app-header">
        <div class="logo">
          <img src="icons/icon48.png" alt="Logo" />
          <h1>AI Video Intelligence</h1>
        </div>
        <div class="user-info">
          <span id="userEmail"></span>
          <span id="userTier" class="tier-badge"></span>
          <button id="settingsBtn" class="icon-btn">⚙️</button>
        </div>
      </header>

      <!-- Usage Stats (Free Tier Only) -->
      <div id="usageStats" class="usage-stats hidden">
        <div class="stat">
          <span class="stat-label">Today's Usage:</span>
          <span class="stat-value"
            ><span id="dailyUsage">0</span>/<span id="dailyLimit"
              >20</span
            ></span
          >
        </div>
        <div class="progress-bar">
          <div id="usageProgress" class="progress-fill"></div>
        </div>
      </div>

      <!-- Main Content -->
      <main class="app-main">
        <!-- Authentication Required -->
        <div id="authRequired" class="auth-panel hidden">
          <div class="auth-icon">🔐</div>
          <h2>Connect Your YouTube Account</h2>
          <p>Sign in with Google to access your playlists</p>
          <button id="authBtn" class="btn btn-primary btn-large">
            Sign in with Google
          </button>
        </div>

        <!-- Main Interface -->
        <div id="mainInterface" class="hidden">
          <!-- Playlist Selection -->
          <section class="section">
            <h3>📺 Source Playlist</h3>
            <select id="sourcePlaylist" class="select-large">
              <option value="">Loading playlists...</option>
            </select>
            <button id="refreshPlaylists" class="btn btn-sm">🔄 Refresh</button>
          </section>

          <section class="section">
            <h3>🎯 Destination Playlist</h3>
            <select id="destPlaylist" class="select-large">
              <option value="">Select destination...</option>
            </select>
            <button id="createPlaylist" class="btn btn-sm">
              ➕ Create New
            </button>
          </section>

          <!-- Filter & Search -->
          <section class="section">
            <h3>🔍 Filter Videos</h3>
            <input
              type="text"
              id="searchFilter"
              class="input-large"
              placeholder="Search by title, channel..."
            />
            <div class="filter-options">
              <label
                ><input type="checkbox" id="filterWatched" /> Hide
                watched</label
              >
              <label
                ><input type="checkbox" id="filterDuplicates" /> Hide
                duplicates</label
              >
            </div>
          </section>

          <!-- Video List -->
          <section class="section">
            <div class="section-header">
              <h3>📹 Videos (<span id="videoCount">0</span>)</h3>
              <div class="selection-controls">
                <button id="selectAll" class="btn btn-sm">Select All</button>
                <button id="deselectAll" class="btn btn-sm">
                  Deselect All
                </button>
              </div>
            </div>

            <div id="videoList" class="video-list">
              <div class="loading">Loading videos...</div>
            </div>
          </section>

          <!-- Actions -->
          <section class="section actions">
            <button id="processBtn" class="btn btn-success btn-large" disabled>
              🚀 Process Selected (<span id="selectedCount">0</span> videos)
            </button>
            <button id="bulkImportBtn" class="btn btn-secondary">
              📥 Bulk Import to NotebookLM
            </button>
          </section>
        </div>

        <!-- Processing View -->
        <div id="processingView" class="hidden">
          <h2>🎬 Processing Videos</h2>
          <div class="progress-section">
            <div class="progress-stats">
              <span
                >Progress: <span id="processedCount">0</span>/<span
                  id="totalCount"
                  >0</span
                ></span
              >
              <span id="progressPercent">0%</span>
            </div>
            <div class="progress-bar-large">
              <div id="processProgress" class="progress-fill"></div>
            </div>
          </div>

          <div class="current-video">
            <h4>Current Video:</h4>
            <p id="currentVideoTitle">-</p>
            <p id="currentVideoStatus">-</p>
          </div>

          <div class="logs-container">
            <h4>Logs:</h4>
            <div id="processLogs" class="logs"></div>
          </div>

          <div class="process-controls">
            <button id="pauseBtn" class="btn btn-warning">⏸️ Pause</button>
            <button id="stopBtn" class="btn btn-danger">⏹️ Stop</button>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="app-footer">
        <div class="footer-links">
          <a href="#" id="helpLink">Help</a>
          <a href="#" id="feedbackLink">Feedback</a>
        </div>
        <div id="upgradePrompt" class="upgrade-prompt hidden">
          <p>💡 Upgrade to Pro for unlimited processing!</p>
          <button id="upgradeBtn" class="btn btn-primary btn-sm">
            Upgrade - $9.99/mo
          </button>
        </div>
      </footer>
    </div>

    <!-- Modals -->
    <div id="subscriptionModal" class="modal hidden">
      <!-- Subscription/upgrade modal content -->
    </div>

    <div id="settingsModal" class="modal hidden">
      <!-- Settings modal content -->
    </div>

    <script type="module" src="popup.js"></script>
  </body>
</html>
```

---

## 🎯 Critical Next Steps

### Immediate Actions Required:

1. **Set up Google Cloud Project** (30 minutes)
   - Create project
   - Enable YouTube Data API
   - Create OAuth credentials
   - Update manifest.json with real Client ID

2. **Decide on Backend** (Important!)
   - **Option A:** Build simple backend API (Node.js + Stripe)
   - **Option B:** Use Firebase (easier, managed)
   - **Option C:** Extension-only (no subscription initially)

3. **Complete Core Files** (Follow templates above)
   - background.js
   - popup.html
   - popup.js
   - subscription-service.js

4. **Test YouTube Integration**
   - Load extension
   - Test authentication
   - Fetch playlists
   - Verify API calls work

---

## 💰 Backend API Requirements

If you want full monetization, you'll need a simple backend:

**Tech Stack Recommendation:**

- **Node.js + Express** for API
- **Stripe** for payments
- **PostgreSQL** or **Firebase** for database
- **Deploy on:** Vercel, Railway, or Render (free tier available)

**Estimated Backend Development:** 1-2 weeks

---

## 📊 Realistic Timeline

| Phase       | Duration | What Gets Built               |
| ----------- | -------- | ----------------------------- |
| **Phase 1** | Week 1   | YouTube API integration       |
| **Phase 2** | Week 2   | Enhanced UI with multi-select |
| **Phase 3** | Week 3   | NotebookLM integration        |
| **Phase 4** | Week 4   | Subscription system           |
| **Phase 5** | Week 5   | Backend API + Stripe          |
| **Phase 6** | Week 6   | Testing + Polish + Launch     |

---

## 🚨 Important Decisions Needed

Before I continue building, please decide:

1. **Backend Strategy:**
   - [ ] Build custom backend (Node.js + Stripe)
   - [ ] Use Firebase (easier)
   - [ ] Extension-only for now (add payments later)

2. **Feature Priority:**
   - [ ] YouTube integration first (most important)
   - [ ] Monetization first (revenue focus)
   - [ ] All features at once (longer timeline)

3. **Development Approach:**
   - [ ] I build templates, you complete
   - [ ] I build core, you add features
   - [ ] Hire developer to complete (I provide specs)

---

## 💡 My Recommendation

**Start with MVP approach:**

1. **This Week:** Complete YouTube integration (I'll help)
2. **Next Week:** Add basic UI and queue management
3. **Week 3:** Test with real users (no payment yet)
4. **Week 4:** Add monetization if users love it

This way you:

- ✅ Validate the product works
- ✅ Get user feedback early
- ✅ Don't over-invest before proving demand
- ✅ Can iterate quickly

---

## ❓ What Would You Like Me To Do Next?

**A.** Continue building core files (background.js, popup.js, etc.)  
**B.** Focus on YouTube integration first (get that working 100%)  
**C.** Create backend API setup guide  
**D.** Build MVP version (YouTube + AI Studio only, no payments)

Let me know and I'll continue! 🚀
