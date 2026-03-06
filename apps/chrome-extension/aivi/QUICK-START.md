# 🚀 QUICK START GUIDE

## Get Your Extension Running in 30 Minutes!

---

## ⚡ Prerequisites

- Google account
- Chrome or Antigravity browser
- 30 minutes of time

---

## 📋 Step-by-Step Setup

### Step 1: Google Cloud Setup (15 minutes)

#### 1.1 Create Project

```
1. Go to: https://console.cloud.google.com/
2. Click "Select a project" → "New Project"
3. Project name: "AI Video Intelligence Suite"
4. Click "Create"
5. Wait for project to be created
```

#### 1.2 Enable YouTube API

```
1. In your new project, click "APIs & Services" → "Library"
2. Search for: "YouTube Data API v3"
3. Click on it
4. Click "Enable"
5. Wait for it to enable
```

#### 1.3 Create OAuth Credentials

```
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure consent screen:
   - User Type: External
   - App name: AI Video Intelligence Suite
   - User support email: your@email.com
   - Developer contact: your@email.com
   - Click "Save and Continue"
   - Scopes: Skip for now
   - Test users: Add your email
   - Click "Save and Continue"
4. Back to Create OAuth client ID:
   - Application type: Chrome Extension
   - Name: AI Video Intelligence Suite
   - Click "Create"
5. COPY THE CLIENT ID (looks like: xxxxx.apps.googleusercontent.com)
```

---

### Step 2: Update Extension (2 minutes)

#### 2.1 Open manifest.json

```bash
# Open in your editor:
/path/to/Projects/ai-studio-automator/manifest.json
```

#### 2.2 Update Client ID

```javascript
// Find line 19 (in the oauth2 section):
"client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",

// Replace with your actual Client ID from Step 1.3
"client_id": "123456789-abcdefg.apps.googleusercontent.com",
```

#### 2.3 Save the file

---

### Step 3: Load Extension (5 minutes)

#### 3.1 Open Extensions Page

```
Chrome/Antigravity → More Tools → Extensions
Or go to: chrome://extensions/
```

#### 3.2 Enable Developer Mode

```
Toggle "Developer mode" in the top right corner
```

#### 3.3 Load Unpacked Extension

```
1. Click "Load unpacked"
2. Navigate to: /path/to/Projects/ai-studio-automator/
3. Click "Select"
4. Extension should now appear in the list
```

#### 3.4 Note Your Extension ID

```
Look for the ID under the extension name
Example: abcdefghijklmnopqrstuvwxyz123456

COPY THIS ID - you'll need it next!
```

---

### Step 4: Update OAuth Settings (3 minutes)

#### 4.1 Go Back to Google Cloud Console

```
https://console.cloud.google.com/apis/credentials
```

#### 4.2 Edit OAuth Client

```
1. Find your OAuth 2.0 Client ID
2. Click the edit icon (pencil)
3. Scroll to "Authorized JavaScript origins"
4. Click "Add URI"
5. Enter: chrome-extension://YOUR_EXTENSION_ID
   (Replace YOUR_EXTENSION_ID with the ID from Step 3.4)
6. Click "Save"
```

---

### Step 5: Test the Extension (5 minutes)

#### 5.1 Open Extension

```
1. Click the extension icon in your browser toolbar
   (If you don't see it, click the puzzle piece icon and pin it)
2. The popup should open
```

#### 5.2 Sign In

```
1. Click "Sign in with Google"
2. Select your Google account
3. Review permissions
4. Click "Allow"
```

#### 5.3 Verify It Works

```
1. After signing in, you should see:
   - Your email in the header
   - "FREE" tier badge
   - Playlist dropdown
2. Click the playlist dropdown
3. Your YouTube playlists should load!
```

---

## ✅ Success Checklist

- [ ] Google Cloud project created
- [ ] YouTube Data API enabled
- [ ] OAuth client created
- [ ] Client ID copied
- [ ] manifest.json updated
- [ ] Extension loaded in browser
- [ ] Extension ID noted
- [ ] OAuth settings updated
- [ ] Extension opens without errors
- [ ] Sign in works
- [ ] Playlists load

---

## 🎉 You're Ready!

If all checkboxes are checked, your extension is working!

### Next Steps:

1. Select a playlist
2. Choose some videos
3. Click "Process Selected"
4. Watch the magic happen! ✨

---

## 🐛 Troubleshooting

### "Sign in failed"

- Check Client ID in manifest.json
- Verify OAuth client is created
- Make sure Extension ID is added to authorized origins

### "Playlists won't load"

- Check YouTube Data API is enabled
- Verify you're signed in
- Check browser console for errors

### "Extension won't load"

- Check for syntax errors in manifest.json
- Verify all files are present
- Check browser console for errors

### Still Having Issues?

1. Open chrome://extensions/
2. Click "Inspect views: service worker"
3. Check console for errors
4. Look for red error messages

---

## 📞 Need Help?

### Check These Files:

- `FINAL-STATUS.md` - Complete status and features
- `IMPLEMENTATION-GUIDE.md` - Detailed development guide
- `PRODUCT-PLAN.md` - Full product specification

### Common Fixes:

```bash
# Reload extension after changes
1. Go to chrome://extensions/
2. Click the reload icon on your extension

# Check for errors
1. Right-click extension icon
2. Click "Inspect popup"
3. Check Console tab
```

---

## 🎯 What You Can Do Now

### Basic Features (Working Now!)

- ✅ Authenticate with YouTube
- ✅ Browse your playlists
- ✅ View videos with thumbnails
- ✅ Select multiple videos
- ✅ Search and filter
- ✅ Add to processing queue
- ✅ Track daily usage (free tier)

### Advanced Features (Coming Soon)

- ⏳ Process through AI Studio
- ⏳ Auto-download reports
- ⏳ NotebookLM integration
- ⏳ Podcast creation

---

## 🚀 Ready to Process Videos?

1. **Select a playlist** from the dropdown
2. **Choose videos** you want to process
3. **Click "Process Selected"**
4. **Monitor progress** in the processing view
5. **Download reports** automatically

---

**Estimated Setup Time:** 30 minutes  
**Difficulty:** Easy  
**Prerequisites:** Google account

**LET'S GO! 🎉**
