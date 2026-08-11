# 🎯 MANUAL SETUP GUIDE - Google Cloud OAuth

## ✅ What We've Completed Automatically:

1. ✅ **Verified you're signed in** to Google Cloud (owner@example.com)
2. ✅ **Found existing project** "Antigravity-YouTube" (ID:
   antigravity-youtube-482003)
3. ✅ **Verified YouTube Data API v3 is enabled** ✅

---

## 📋 WHAT YOU NEED TO DO MANUALLY:

### Step 1: Configure OAuth Consent Screen (5 minutes)

**Go to:**
https://console.cloud.google.com/apis/credentials/consent?project=antigravity-youtube-482003

1. **Choose User Type:**
   - Select **"External"**
   - Click **"Create"**

2. **Fill in App Information:**

   ```
   App name: AI Video Intelligence Suite
   User support email: owner@example.com
   App logo: (optional - skip for now)
   ```

3. **App Domain (optional - skip for now):**
   - Leave blank

4. **Developer Contact:**

   ```
   Email: owner@example.com
   ```

5. **Click "Save and Continue"**

6. **Scopes:**
   - Click **"Add or Remove Scopes"**
   - Search for: `youtube.readonly`
   - Check: `https://www.googleapis.com/auth/youtube.readonly`
   - Search for: `drive.appdata`
   - Check: `https://www.googleapis.com/auth/drive.appdata`
   - Click **"Update"**
   - Click **"Save and Continue"**

7. **Test Users:**
   - Click **"+ Add Users"**
   - Add: `owner@example.com`
   - Click **"Add"**
   - Click **"Save and Continue"**

8. **Summary:**
   - Review everything
   - Click **"Back to Dashboard"**

---

### Step 2: Load Extension to Get Extension ID (2 minutes)

**Before creating OAuth credentials, we need the Extension ID!**

1. **Open Chrome/Antigravity**

2. **Go to:** `chrome://extensions/`

3. **Enable Developer Mode:**
   - Toggle switch in top right corner

4. **Click "Load unpacked"**

5. **Navigate to:**

   ```
   /path/to/Projects/ai-studio-automator/
   ```

6. **Click "Select"**

7. **COPY THE EXTENSION ID:**
   - Look under the extension name
   - It's a long string like: `abcdefghijklmnopqrstuvwxyz123456`
   - **COPY THIS!** You'll need it in the next step!

---

### Step 3: Create OAuth Client ID (3 minutes)

**Go to:**
https://console.cloud.google.com/apis/credentials?project=antigravity-youtube-482003

1. **Click "+ CREATE CREDENTIALS"** (top of page)

2. **Select "OAuth client ID"**

3. **Application type:**
   - Select **"Chrome extension"** from dropdown

4. **Name:**

   ```
   AI Video Intelligence Suite
   ```

5. **Item ID:**
   - **PASTE YOUR EXTENSION ID** (from Step 2)
   - Example: `abcdefghijklmnopqrstuvwxyz123456`

6. **Click "Create"**

7. **COPY THE CLIENT ID:**
   - A popup will show your Client ID
   - It looks like: `123456789-abc123.apps.googleusercontent.com`
   - **COPY THIS!** You'll need it next!

---

### Step 4: Update manifest.json (1 minute)

1. **Open file:**

   ```
   /path/to/Projects/ai-studio-automator/manifest.json
   ```

2. **Find line 28:**

   ```json
   "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
   ```

3. **Replace with your actual Client ID:**

   ```json
   "client_id": "123456789-abc123.apps.googleusercontent.com",
   ```

4. **Save the file**

---

### Step 5: Reload Extension (1 minute)

1. **Go back to:** `chrome://extensions/`

2. **Find "AI Video Intelligence Suite"**

3. **Click the reload icon** (circular arrow)

---

### Step 6: Test Authentication (2 minutes)

1. **Click the extension icon** in your browser toolbar
   - If you don't see it, click the puzzle piece icon and pin it

2. **Click "Sign in with Google"**

3. **Select your account** (owner@example.com)

4. **Review permissions:**
   - YouTube readonly access
   - Drive appdata access

5. **Click "Allow"**

6. **You should see:**
   - Your email in the header
   - "FREE" tier badge
   - Playlist dropdown

7. **Click the playlist dropdown**
   - Your YouTube playlists should load!

---

## ✅ SUCCESS CHECKLIST

- [ ] OAuth consent screen configured
- [ ] Extension loaded in Chrome
- [ ] Extension ID copied
- [ ] OAuth Client ID created
- [ ] Client ID copied
- [ ] manifest.json updated
- [ ] Extension reloaded
- [ ] Sign in successful
- [ ] Playlists loading

---

## 🎉 WHEN YOU'RE DONE:

**You'll have:**

- ✅ Working YouTube authentication
- ✅ Access to all your playlists
- ✅ Ability to select and process videos
- ✅ Full extension functionality

---

## 🐛 TROUBLESHOOTING

### "Sign in failed"

- Check Client ID in manifest.json
- Make sure it matches exactly from Google Cloud
- Reload extension after changes

### "Playlists won't load"

- Check YouTube Data API is enabled (it is!)
- Verify you're signed in
- Check browser console for errors

### "Extension won't load"

- Check for syntax errors in manifest.json
- Make sure all files are present
- Check browser console

---

## 📞 NEED HELP?

**Check the browser console:**

1. Right-click extension icon
2. Click "Inspect popup"
3. Go to "Console" tab
4. Look for red error messages

---

**Estimated Time:** 15 minutes total  
**Difficulty:** Easy  
**Prerequisites:** Google account (you have it!)

**LET'S DO THIS!** 🚀
