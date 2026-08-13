# 🏗️ System Architecture

## Complete Automation Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER WORKFLOW                                │
└─────────────────────────────────────────────────────────────────────┘

Step 1: Extract URLs
┌──────────────────────┐
│ ai_video_library.html│
│  (647 videos)        │
└──────────┬───────────┘
           │ paste
           ↓
┌──────────────────────┐
│ url-extractor.html   │
│  • Parse HTML        │
│  • Extract URLs      │
│  • Format for queue  │
└──────────┬───────────┘
           │ click "🚀 Sync to Queue"
           ↓
┌──────────────────────┐
│ chrome.storage.local │
│  videoQueue: [...]   │
│  reverseOrder: true  │
│  segmentDuration: 45 │
└──────────┬───────────┘
           │
           ↓

Step 2: Automation Engine
┌─────────────────────────────────────────────────────────────────────┐
│                    CHROME EXTENSION                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────┐        ┌──────────────┐      ┌───────────────┐ │
│  │  popup.html    │◄──────►│ background.js│◄────►│contentScript.js│ │
│  │  popup.js      │ msgs   │ (router)     │ msgs │ (automation)   │ │
│  │  popup.css     │        └──────────────┘      └───────┬───────┘ │
│  │                │                                       │         │
│  │ • Queue UI     │                                       │         │
│  │ • Progress bar │                                       │         │
│  │ • Logs display │                                       │         │
│  │ • Controls     │                                       │         │
│  └────────────────┘                                       │         │
│                                                            │         │
└────────────────────────────────────────────────────────────┼─────────┘
                                                             │
                                                             ↓
Step 3: AI Studio Automation
┌─────────────────────────────────────────────────────────────────────┐
│                   aistudio.google.com                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  contentScript.js performs:                                          │
│                                                                      │
│  1. Click [+] Add button                                            │
│  2. Select "YouTube Video"                                          │
│  3. Fill URL + time segments                                        │
│  4. Click "Save"                                                    │
│  5. Input analysis prompt                                           │
│  6. Click "Run"                                                     │
│  7. Wait for completion (MutationObserver)                          │
│  8. Download report                                                 │
│  9. Next video                                                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
           │
           ↓
Step 4: Output
┌──────────────────────┐
│ ~/Downloads/         │
│  Report_633_Seg0.md  │
│  Report_632_Seg0.md  │
│  Report_631_Seg0.md  │
│  ...                 │
└──────────────────────┘
```

---

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                      MESSAGE FLOW                                    │
└─────────────────────────────────────────────────────────────────────┘

URL Extractor                Extension Popup           Content Script
─────────────                ───────────────           ──────────────

[Extract URLs]
     │
     │ postMessage
     ├──────────────────────►[Receive Queue]
     │                              │
     │                              │ chrome.storage.local.set
     │                              ├────────────────────────┐
     │                              │                        │
     │                              │                        ↓
     │                       [Queue Saved]            [Storage Updated]
     │                              │                        │
     │                              │                        │
[Open AI Studio]◄─────────────────┤                        │
     │                              │                        │
     │                              │                        │
     │                       [User clicks                    │
     │                        "Start"]                       │
     │                              │                        │
     │                              │ chrome.tabs.sendMessage│
     │                              ├───────────────────────►│
     │                              │                        │
     │                              │                  [Start Loop]
     │                              │                        │
     │                              │                  [Process Video]
     │                              │                        │
     │                              │                  [Wait Complete]
     │                              │                        │
     │                              │                  [Download]
     │                              │                        │
     │                              │ chrome.runtime.sendMsg │
     │                              │◄───────────────────────┤
     │                              │                        │
     │                       [Update Progress]               │
     │                       [Show Logs]                     │
     │                              │                        │
     │                              │                  [Next Video]
     │                              │                        │
     │                              │         ...            │
     │                              │                        │
     │                              │ chrome.runtime.sendMsg │
     │                              │◄───────────────────────┤
     │                              │                        │
     │                       [AUTOMATION_COMPLETE]     [Done]
```

---

## Retry Logic Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      RETRY MECHANISM                                 │
└─────────────────────────────────────────────────────────────────────┘

processVideo(video, retryCount=0)
     │
     ├─ Try: automateSegment()
     │       │
     │       ├─ Success? ──────────► Download ──► Return true
     │       │
     │       └─ Error?
     │            │
     │            ├─ retryCount < 3?
     │            │       │
     │            │       ├─ Yes: Wait (2^retryCount * 2s)
     │            │       │       │
     │            │       │       └─► processVideo(video, retryCount+1)
     │            │       │                    │
     │            │       │                    └─► (Recursive retry)
     │            │       │
     │            │       └─ No: Ask user
     │            │               │
     │            │               ├─ Continue? ──► Return false (skip)
     │            │               │
     │            │               └─ Stop? ──────► Throw error (halt)
     │            │
     │            └─ Return result

Retry Timeline:
Attempt 1: Immediate
Attempt 2: +2 seconds
Attempt 3: +4 seconds
Attempt 4: +8 seconds
Total: ~14 seconds of retries before user prompt
```

---

## MutationObserver Pattern

```
┌─────────────────────────────────────────────────────────────────────┐
│                   COMPLETION DETECTION                               │
└─────────────────────────────────────────────────────────────────────┘

Click "Run" button
     │
     ↓
Create MutationObserver
     │
     ├─ Watch: document.body
     │   ├─ childList: true    (new elements)
     │   ├─ subtree: true      (entire tree)
     │   ├─ attributes: true   (attribute changes)
     │   └─ attributeFilter: ['disabled', 'aria-disabled', 'class']
     │
     ↓
Wait for changes...
     │
     ├─ DOM Mutation Detected
     │       │
     │       ├─ Check for copy button
     │       ├─ Check for download button
     │       ├─ Check for run button enabled
     │       │
     │       ├─ Found? ──────────► Disconnect observer
     │       │                           │
     │       │                           └─► Resolve promise
     │       │
     │       └─ Not found? ─────► Continue watching
     │
     └─ Timeout (10 min) ──────► Disconnect observer
                                       │
                                       └─► Resolve with timeout flag

Benefits:
✓ Real-time detection (no polling delay)
✓ Multiple completion indicators
✓ Efficient (event-driven)
✓ Timeout protection
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA PIPELINE                                 │
└─────────────────────────────────────────────────────────────────────┘

HTML Library
     │
     ├─ Video entries with IDs and URLs
     │
     ↓
URL Extractor
     │
     ├─ Parse HTML → Extract data → Sort by ID
     │
     ↓
Chrome Storage
     │
     ├─ {
     │    videoQueue: [{id: "633", url: "..."}, ...],
     │    reverseOrder: true,
     │    segmentDuration: 45
     │  }
     │
     ↓
Content Script
     │
     ├─ Load queue → Reverse if needed → Process sequentially
     │
     ↓
AI Studio
     │
     ├─ Video URL + Prompt → AI Analysis → Markdown Report
     │
     ↓
Downloads Folder
     │
     └─ Report_[ID]_Segment[N].md
```

---

## Error Handling Strategy

```
┌─────────────────────────────────────────────────────────────────────┐
│                     ERROR RECOVERY                                   │
└─────────────────────────────────────────────────────────────────────┘

Error Types:

1. Selector Not Found
   ├─ Retry with exponential backoff
   └─ If persistent → Ask user to update selectors

2. Network Error
   ├─ Retry immediately (transient)
   └─ If persistent → Ask user to check connection

3. Timeout
   ├─ Retry with longer timeout
   └─ If persistent → Ask user to skip video

4. Rate Limiting
   ├─ Increase delay between videos
   └─ Wait for quota reset

5. User Cancellation
   ├─ Stop automation gracefully
   └─ Save progress state

Recovery Actions:
├─ Automatic: Retry with backoff (3 attempts)
├─ Semi-automatic: Ask user to continue/skip
└─ Manual: User intervention required
```

---

## State Management

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AUTOMATION STATE                                  │
└─────────────────────────────────────────────────────────────────────┘

automationState = {
  isRunning: boolean,        // Currently processing?
  isPaused: boolean,         // User paused?
  currentQueue: Array,       // Videos to process
  currentIndex: number,      // Current position
  segmentDuration: number,   // Max segment length (seconds)
  currentVideo: Object       // Currently processing video
}

State Transitions:

[Idle]
  │ User clicks "Start"
  ↓
[Running]
  │ User clicks "Pause"
  ↓
[Paused]
  │ User clicks "Resume"
  ↓
[Running]
  │ Error occurs
  ↓
[Error State]
  │ User chooses action
  ├─ Continue → [Running]
  └─ Stop → [Idle]

[Running]
  │ Queue complete
  ↓
[Complete]
  │ Auto-reset
  ↓
[Idle]
```

---

## Performance Optimization

```
┌─────────────────────────────────────────────────────────────────────┐
│                    OPTIMIZATION STRATEGIES                           │
└─────────────────────────────────────────────────────────────────────┘

1. Event-Driven Detection
   ├─ MutationObserver (real-time)
   └─ No polling overhead

2. Efficient Selectors
   ├─ Cache frequently used elements
   └─ Use specific selectors

3. Smart Delays
   ├─ Minimum necessary wait times
   └─ Adaptive based on UI response

4. Memory Management
   ├─ Disconnect observers when done
   └─ Clean up event listeners

5. Error Recovery
   ├─ Exponential backoff (not linear)
   └─ Early exit on fatal errors

6. Rate Limiting
   ├─ 3-second delay between videos
   └─ Prevents API quota issues

Performance Metrics:
├─ CPU: Low (event-driven)
├─ Memory: ~50-100MB
├─ Network: Minimal (only AI Studio API)
└─ Processing: ~2-3 min/video average
```

---

This architecture provides:

- ✅ Robust error handling
- ✅ Efficient resource usage
- ✅ User control and feedback
- ✅ Scalable to 633+ videos
- ✅ Maintainable code structure
