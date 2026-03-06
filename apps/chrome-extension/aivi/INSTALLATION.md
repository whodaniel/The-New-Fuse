# Quick Installation Guide

## Step 1: Load the Extension in Chrome

1. Open Google Chrome
2. Navigate to `chrome://extensions/`
3. Toggle **"Developer mode"** ON (top right corner)
4. Click **"Load unpacked"**
5. Navigate to and select this folder:
   `/path/to/.gemini/antigravity/scratch/ai-studio-automator`
6. The extension should now appear in your extensions list

## Step 2: Pin the Extension (Optional)

1. Click the puzzle piece icon in Chrome's toolbar
2. Find "AI Studio Video Automator"
3. Click the pin icon to keep it visible

## Step 3: Prepare Your Video Queue

You'll need your video URLs from the `ai_video_library.html` file. The format
should be:

```
633,https://www.youtube.com/watch?v=VIDEO_ID
632,https://www.youtube.com/watch?v=VIDEO_ID
...
```

## Step 4: Navigate to AI Studio

1. Go to [Google AI Studio](https://aistudio.google.com/app/prompts/new_chat)
2. Make sure you're logged in with your Google AI Pro account
3. You should see the chat interface

## Step 5: Start Automation

1. Click the extension icon in Chrome
2. Paste your video URLs into the textarea
3. Click "Load Queue"
4. Configure settings:
   - ✅ **Reverse Order** (to process #633 → #1)
   - **Segment Duration**: 45 minutes (default)
5. Click **"Start Automation"**

## Step 6: Monitor Progress

Watch the extension popup for:

- Real-time logs
- Progress bar
- Current video being processed
- Status updates

You can **Pause**, **Resume**, or **Stop** at any time.

## Troubleshooting

### Extension won't load

- Make sure all files are in the same folder
- Check that Developer mode is enabled
- Try reloading the extension

### Automation not starting

- Verify you're on `aistudio.google.com`
- Check that you've loaded the queue first
- Open DevTools (F12) and check for errors

### Selectors not working

Google may have updated their UI. Check the console for errors and update
selectors in `contentScript.js` if needed.

## Next Steps

Once you have videos processing, you can:

- Download the generated markdown reports from AI Studio
- Process multiple videos in sequence
- Adjust the prompt in `contentScript.js` if needed

---

**Need help?** Check the main README.md for detailed documentation.
