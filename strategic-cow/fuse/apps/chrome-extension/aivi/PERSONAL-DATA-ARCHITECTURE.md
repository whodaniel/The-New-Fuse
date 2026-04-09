# Personal Data Architecture

## Overview

The AI Video Intelligence Suite now supports **programmatic personal data
management**, allowing every user to:

1. Keep their personal video library and knowledge base completely separate from
   the application
2. Choose their own storage location
3. Have proper folder structure automatically created
4. Maintain their data in a private Git repository
5. Use the application without mixing personal data with code

---

## Architecture

### Application vs Personal Data

```
┌─────────────────────────────────────────────────────────────┐
│  AI Video Intelligence Suite (Public GitHub Repo)          │
│  /path/to/Projects/ai-video-intelligence-suite│
│                                                             │
│  Contains:                                                  │
│  - Chrome extension framework                               │
│  - Processing scripts (generic)                             │
│  - OAuth2 integration                                       │
│  - Documentation                                            │
│  - PersonalDataManager class                                │
│                                                             │
│  Does NOT contain:                                          │
│  - User video libraries                                     │
│  - Processing reports                                       │
│  - Personal credentials                                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Uses
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Personal AI Knowledge Base (Private Git Repo)             │
│  /path/to/.../my-ai-knowledge-base            │
│                                                             │
│  Contains:                                                  │
│  - YOUR video library                                       │
│  - YOUR processing reports                                  │
│  - YOUR knowledge base                                      │
│  - YOUR configuration                                       │
│  - YOUR statistics                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Personal Data Structure

```
my-ai-knowledge-base/
├── video-library/
│   ├── ai_video_library.html          # Master video catalog
│   ├── recent-videos.json             # Watch history imports
│   └── processing-queue.json          # Videos queued for processing
│
├── video-reports/
│   ├── api_001_videoId.md            # AI-analyzed reports
│   ├── api_002_videoId.md
│   └── ... (645 files)
│
├── knowledge-base/
│   ├── consolidated_ai_knowledge.md   # All reports merged (2.5MB)
│   ├── topics/                        # Organized by topic
│   │   ├── rag-systems.md
│   │   ├── agent-frameworks.md
│   │   └── ...
│   ├── tools/                         # Organized by tool
│   │   ├── langchain.md
│   │   ├── groq.md
│   │   └── ...
│   └── concepts/                      # Organized by concept
│       ├── prompt-engineering.md
│       ├── vector-search.md
│       └── ...
│
├── exports/
│   ├── notebooklm/                    # NotebookLM exports
│   │   ├── all-videos-urls.txt
│   │   ├── batch-1-urls.txt
│   │   └── ...
│   ├── podcasts/                      # Generated audio files
│   │   └── ai-knowledge-2026-01-19.mp3
│   └── summaries/                     # AI-generated summaries
│       └── weekly-summary-2026-01-19.md
│
├── processing-logs/
│   ├── api-processing-2026-01-19.log
│   └── processing-history.json
│
├── config/
│   ├── processing-config.json         # Processing settings
│   ├── preferences.json               # User preferences
│   └── stats.json                     # Statistics
│
├── backups/                           # Automatic backups
│   └── backup-2026-01-19.tar.gz
│
├── .git/                              # Private Git repo
├── .gitignore                         # Protects sensitive files
├── README.md                          # Personal documentation
├── quick-stats.js                     # Helper script
└── backup.sh                          # Backup script
```

---

## Setup Process

### For You (One-Time)

```bash
# 1. Run automated setup
cd /path/to/Projects/ai-video-intelligence-suite
node setup-personal-knowledge-base.js

# Prompts:
#   - Choose location (default: ~/Desktop/A1-Inter-LLM-Com/my-ai-knowledge-base)
#   - Migrate existing data? (y/n)
#   - Initialize Git repo? (y/n)

# 2. Creates complete structure
# 3. Migrates your existing 645 reports
# 4. Updates application config
# 5. Creates helper scripts

# 3. Create private GitHub repo
cd /path/to/Desktop/A1-Inter-LLM-Com/my-ai-knowledge-base
gh repo create my-ai-knowledge-base --private --source=.
git push -u origin main

# 4. Done! Application now uses your personal data location
```

### For Any User

```bash
# 1. Clone AI Video Intelligence Suite
git clone https://github.com/whodaniel/ai-video-intelligence-suite
cd ai-video-intelligence-suite

# 2. Run setup
node setup-personal-knowledge-base.js ~/my-ai-videos

# 3. Start using
# Application automatically reads/writes to ~/my-ai-videos/
```

---

## PersonalDataManager API

### Initialization

```javascript
const PersonalDataManager = require('./lib/PersonalDataManager');
const pdm = new PersonalDataManager(__dirname);

// Check if configured
if (!pdm.isConfigured()) {
  console.error('Run setup: node setup-personal-knowledge-base.js');
  process.exit(1);
}
```

### Get Paths

```javascript
// Get base path
const basePath = pdm.getPersonalDataPath();
// Returns: /Users/you/my-ai-knowledge-base

// Get specific directories
const libraryPath = pdm.getVideoLibraryPath();
// Returns: /Users/you/my-ai-knowledge-base/video-library/ai_video_library.html

const reportsDir = pdm.getVideoReportsDir();
// Returns: /Users/you/my-ai-knowledge-base/video-reports

const kbDir = pdm.getKnowledgeBaseDir();
// Returns: /Users/you/my-ai-knowledge-base/knowledge-base

const exportsDir = pdm.getExportsDir();
// Returns: /Users/you/my-ai-knowledge-base/exports
```

### Configuration & Stats

```javascript
// Load user's processing config
const config = pdm.loadProcessingConfig();
// Returns: { apiKey, model, maxConcurrent, ... }

// Load preferences
const prefs = pdm.loadPreferences();
// Returns: { autoBackup, exportFormats, ... }

// Load statistics
const stats = pdm.loadStats();
// Returns: { totalVideos, processedVideos, totalCost, ... }

// Update statistics
pdm.updateStats({
  totalVideos: 650,
  processedVideos: 645,
  totalCost: 0.52,
});
```

### Report Management

```javascript
// Check if video is processed
const isProcessed = pdm.isVideoProcessed('4ukqsKajWnk', 575);
// Returns: true/false

// Get all reports
const allReports = pdm.getAllReports();
// Returns: ['/path/to/api_575_4ukqsKajWnk.md', ...]

// Save new report
const content = generateReport(videoData);
const filepath = pdm.saveReport('newVideoId', 576, content);
// Saves to: video-reports/api_576_newVideoId.md
```

### Knowledge Base Operations

```javascript
// Generate consolidated knowledge base
const kbPath = pdm.generateConsolidatedKB();
// Merges all reports into: knowledge-base/consolidated_ai_knowledge.md

// Export for NotebookLM (URLs)
const urlsFile = pdm.exportForNotebookLM('urls');
// Creates: exports/notebooklm/all-videos-1234567890.txt

// Export for NotebookLM (Markdown)
const mdFile = pdm.exportForNotebookLM('markdown');
// Creates: exports/notebooklm/consolidated-1234567890.md
```

### Backup

```javascript
// Create backup
const backupPath = pdm.createBackup();
// Creates: backups/backup-2026-01-19.tar.gz
```

---

## Integration with Processing Scripts

### Old Way (Hardcoded Paths)

```javascript
// ❌ Bad: Hardcoded personal data path
const REPORTS_DIR = '/path/to/Desktop/.../video-reports';
const LIBRARY_FILE = '/path/to/Desktop/.../ai_video_library.html';

// Only works for one user!
```

### New Way (PersonalDataManager)

```javascript
// ✅ Good: Uses PersonalDataManager
const PersonalDataManager = require('./lib/PersonalDataManager');
const pdm = new PersonalDataManager(__dirname);

const REPORTS_DIR = pdm.getVideoReportsDir();
const LIBRARY_FILE = pdm.getVideoLibraryPath();

// Works for any user!
```

### Example: Video Processor

```javascript
const PersonalDataManager = require('./lib/PersonalDataManager');

class VideoProcessor {
  constructor() {
    this.pdm = new PersonalDataManager(__dirname);

    if (!this.pdm.isConfigured()) {
      throw new Error('Personal data not configured. Run setup.');
    }

    this.config = this.pdm.loadProcessingConfig();
  }

  async processVideo(videoId, index) {
    // Check if already processed
    if (this.pdm.isVideoProcessed(videoId, index)) {
      console.log(`Video ${videoId} already processed`);
      return;
    }

    // Process video
    const analysis = await this.analyzeVideo(videoId);

    // Save report
    const content = this.formatReport(analysis);
    const filepath = this.pdm.saveReport(videoId, index, content);

    // Update stats
    const stats = this.pdm.loadStats();
    this.pdm.updateStats({
      processedVideos: stats.processedVideos + 1,
      totalCost: stats.totalCost + 0.0008,
    });

    console.log(`✅ Saved report: ${filepath}`);
  }
}
```

---

## Chrome Extension Integration

### Background Service Worker

```javascript
// background.js
const PersonalDataManager = require('./lib/PersonalDataManager');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'GET_PERSONAL_DATA_PATH') {
    const pdm = new PersonalDataManager();
    sendResponse({ path: pdm.getPersonalDataPath() });
  }

  if (request.action === 'GET_STATS') {
    const pdm = new PersonalDataManager();
    const stats = pdm.loadStats();
    sendResponse(stats);
  }

  if (request.action === 'EXPORT_FOR_NOTEBOOKLM') {
    const pdm = new PersonalDataManager();
    const file = pdm.exportForNotebookLM(request.format);
    sendResponse({ file });
  }

  return true; // Async response
});
```

### Popup UI

```javascript
// popup.js
async function updateStats() {
  const response = await chrome.runtime.sendMessage({
    action: 'GET_STATS',
  });

  document.getElementById('videos-total').textContent = response.totalVideos;
  document.getElementById('videos-processed').textContent =
    response.processedVideos;
  document.getElementById('processing-cost').textContent =
    `$${response.totalCost.toFixed(2)}`;
}

async function exportForNotebookLM() {
  const response = await chrome.runtime.sendMessage({
    action: 'EXPORT_FOR_NOTEBOOKLM',
    format: 'urls',
  });

  // Download the file
  chrome.downloads.download({
    url: URL.createObjectURL(new Blob([response.file])),
    filename: 'notebooklm-export.txt',
  });
}
```

---

## Benefits

### For Users

1. ✅ **Complete Privacy** - Personal data never committed to public repos
2. ✅ **Portability** - Move knowledge base anywhere
3. ✅ **Backup** - Easy to backup entire knowledge base
4. ✅ **Version Control** - Git history of your knowledge evolution
5. ✅ **Multi-Device** - Sync via private GitHub repo
6. ✅ **Organized** - Proper folder structure automatically

### For Developers

1. ✅ **Multi-User Ready** - No hardcoded paths
2. ✅ **Clean Separation** - Application code separate from user data
3. ✅ **Maintainable** - Single source of truth for paths
4. ✅ **Testable** - Easy to test with mock personal data
5. ✅ **Scalable** - Works for 1 user or 1,000 users

### For Distribution

1. ✅ **Chrome Web Store Ready** - No personal data in extension
2. ✅ **Open Source Friendly** - Public repo contains no private data
3. ✅ **Professional** - Proper architecture for production app
4. ✅ **Compliant** - GDPR/privacy friendly

---

## Security

### What's Protected

- ✅ Video library (your viewing history)
- ✅ Processing reports (your AI insights)
- ✅ API keys (your credentials)
- ✅ Personal preferences
- ✅ Processing logs

### How It's Protected

1. **Separate Repository** - Personal data in its own Git repo
2. **.gitignore** - Sensitive files excluded
3. **Private Repo** - GitHub repo set to private
4. **Local-Only Config** - config.json not committed
5. **No Hardcoded Paths** - Paths never in public code

---

## Migration Guide

### Moving from Old System

```bash
# Your current structure (scattered):
/The-New-Fuse/data/video-reports/       # 645 reports
/The-New-Fuse/ai_video_library.html     # Library
/ai-studio-automator/data/              # Some data

# Run automated migration:
node setup-personal-knowledge-base.js

# Prompts will guide you to:
1. Choose new location
2. Automatically migrate existing data
3. Update application config
4. Create helper scripts

# New structure (organized):
/my-ai-knowledge-base/
├── video-library/ai_video_library.html
├── video-reports/ (645 files)
└── ... (all organized)
```

---

## Future Enhancements

### Planned Features

1. **Cloud Sync** - Optional sync to cloud storage (S3, Google Drive)
2. **Encryption** - Encrypt sensitive reports
3. **Sharing** - Selective sharing of specific reports
4. **Collaboration** - Multi-user knowledge bases
5. **Analytics** - Advanced analytics dashboard
6. **AI Search** - Vector search across all reports

### Community Features

1. **Template Sharing** - Share organizational templates
2. **Knowledge Export** - Export to various formats
3. **Integration APIs** - Connect to other tools
4. **Mobile App** - Access on mobile devices

---

## Troubleshooting

### "Personal data not configured"

```bash
# Run setup:
node setup-personal-knowledge-base.js
```

### "Cannot find config.json"

```bash
# Setup creates config.json automatically
# If missing, run setup again
```

### "Permission denied"

```bash
# Check folder permissions:
chmod -R 755 /path/to/my-ai-knowledge-base
```

### "Git not initialized"

```bash
# Re-initialize:
cd /path/to/my-ai-knowledge-base
git init
git add .
git commit -m "Initial commit"
```

---

## Summary

The Personal Data Architecture provides:

- ✅ **Separation** - Application code vs user data
- ✅ **Automation** - One command setup
- ✅ **Flexibility** - User chooses location
- ✅ **Privacy** - Never commits personal data
- ✅ **Scalability** - Works for any number of users
- ✅ **Professional** - Production-ready architecture

**Status:** Complete and ready to use! **Documentation:** This file **Setup:**
`node setup-personal-knowledge-base.js`
