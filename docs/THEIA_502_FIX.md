# SkIDEancer 502 Bad Gateway - Application Not Responding

**Updated**: December 20, 2025 - 20:03 EST  
**Status**: Port routing fixed, application not responding  
**Error**: "Application failed to respond" - 502 Bad Gateway

---

## ✅ PROGRESS SO FAR

- ✅ Port updated from 3000 → 3007
- ✅ Railway is routing correctly to port 3007
- ❌ SkIDEancer application not responding on port 3007

**This is progress!** The routing is correct now; we just need to fix the
SkIDEancer startup.

---

## 🔍 DIAGNOSIS

### Error Analysis

```
502 Bad Gateway
"Application failed to respond"
```

**This means**:

- ✅ Railway is routing traffic to port 3007 correctly
- ❌ No process is listening on port 3007
- ❌ SkIDEancer server didn't start, or started on wrong port

---

## 🚨 IMMEDIATE ACTION REQUIRED

### Step 1: Check Railway Deployment Logs

1. **Go to Railway Dashboard**:
   https://railway.com/project/041cee9d-8648-4074-b5a6-0eae436de1d1/service/c83fc5bd-af38-4fd2-847f-260a2fc69f0c

2. **Click "Deployments" tab**

3. **Click the most recent deployment**

4. **Look for these specific errors**:

#### ❌ Common Error #1: Port Environment Variable

```
Error: Port 3007 is already in use
```

**Solution**: Use `$PORT` instead of hardcoded 3007

#### ❌ Common Error #2: Missing Dependencies

```
Error: Cannot find module '@ide/core'
yarn install failed
```

**Solution**: Ensure `yarn install` runs before start

#### ❌ Common Error #3: Start Command Not Found

```
Error: Cannot find module 'src-gen/backend/server.js'
```

**Solution**: Need to run `ide build` first

#### ❌ Common Error #4: Node Version

```
Error: The engine "node" is incompatible with this module
```

**Solution**: Set `NODE_VERSION=18` in environment variables

---

## 🛠️ LIKELY FIXES

### Fix #1: Missing Build Step (Most Likely)

SkIDEancer requires compilation before running. The start command should be:

**Current (Broken)**:

```bash
node src-gen/backend/server.js --hostname=0.0.0.0 --port=3007
```

**Correct**:

```bash
yarn build && node src-gen/backend/server.js --hostname=0.0.0.0 --port=$PORT
```

**OR** set separate build and start commands:

**In Railway → Settings → Deploy**:

- **Build Command**: `yarn install && yarn build`
- **Start Command**:
  `node src-gen/backend/server.js --hostname=0.0.0.0 --port=$PORT`

### Fix #2: Use Railway's $PORT Variable

Update start command to use Railway's dynamic port:

```bash
node src-gen/backend/server.js --hostname=0.0.0.0 --port=${PORT:-3007}
```

This uses `$PORT` if set, falls back to 3007.

### Fix #3: Check package.json Scripts

The `package.json` in `whodaniel/skideancer-ide` should have:

```json
{
  "scripts": {
    "build": "ide build --mode production",
    "start": "node src-gen/backend/server.js",
    "start:production": "node src-gen/backend/server.js --hostname=0.0.0.0 --port=${PORT:-3007}"
  }
}
```

Then Railway start command can be:

```bash
yarn start:production
```

### Fix #4: Dockerfile (If Using Docker)

If the repo has a Dockerfile, it should look like:

```dockerfile
FROM node:18-alpine

RUN npm install -g yarn

WORKDIR /app

# Install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source
COPY . .

# Build SkIDEancer
RUN yarn build

# Expose port (Railway will override this)
EXPOSE 3007

# Start SkIDEancer
CMD ["node", "src-gen/backend/server.js", "--hostname=0.0.0.0", "--port=${PORT:-3007}"]
```

---

## 📝 THINGS TO CHECK IN RAILWAY DASHBOARD

### 1. Environment Variables

Go to **Settings → Variables** and ensure:

```bash
NODE_ENV=production
PORT=3007  # Or let Railway auto-assign
NODE_VERSION=18  # If using Nixpacks
```

### 2. Build Settings

Go to **Settings → Deploy** and check:

- **Build Command**: Should run `yarn build`
- **Start Command**: Should start the server
- **Root Directory**: Should be `/` (entire repo)

### 3. Service Settings

Go to **Settings → General**:

- **Deployment Method**: Should be GitHub (auto-deploy on push)
- **Branch**: Should be `main` or `master`

---

## 🎯 RECOMMENDED ACTION PLAN

### Immediate (5 minutes):

1. **Check Railway logs** for the exact error
2. **Copy/paste the error** here so I can provide specific fix
3. **Take screenshot** of Settings → Deploy section

### Quick Fix (10 minutes):

Based on common issues, try this in Railway:

**Settings → Deploy → Start Command**:

```bash
yarn build && node src-gen/backend/server.js --hostname=0.0.0.0 --port=$PORT
```

**Settings → Variables → Add Variable**:

```
NODE_VERSION=18
```

Then click **Redeploy** from Deployments tab.

---

## 🔍 WHAT TO LOOK FOR IN LOGS

### ✅ Success Indicators

```
✓ yarn install
✓ Building frontend...
✓ Webpack compiled successfully
✓ SkIDEancer app listening on: 0.0.0.0:3007
✓ Server running at http://0.0.0.0:3007
```

### ❌ Failure Indicators

```
✗ Error: Cannot find module
✗ SyntaxError: Unexpected token
✗ ENOENT: no such file or directory
✗ Port already in use
✗ Failed to compile
```

---

## 🚀 ALTERNATIVE: REDEPLOY FROM SCRATCH

If logs show complex errors, try a clean redeploy:

1. **In Railway → Settings**:
   - Click **"Delete Service"** (this won't delete your repo)

2. **Create New Service**:
   - Click **"New Service"**
   - Select **"GitHub Repo"**
   - Choose `whodaniel/skideancer-ide`

3. **Configure**:
   - Set build command: `yarn install && yarn build`
   - Set start command: `yarn start`
   - Add environment variable: `NODE_VERSION=18`

4. **Deploy**:
   - Railway will auto-deploy
   - Watch logs for success

---

## 📊 EXPECTED VS ACTUAL

| Aspect               | Expected  | Actual      | Status        |
| -------------------- | --------- | ----------- | ------------- |
| Port Routing         | 3007      | 3007        | ✅ Fixed      |
| Application Response | 200 OK    | 502         | ❌ Fix Needed |
| SkIDEancer Process   | Running   | Not Running | ❌ Fix Needed |
| Build Step           | Completed | ?           | ❓ Check Logs |

---

## 💡 NEXT STEPS

**Please check Railway deployment logs and report back with**:

1. The full error message from the latest deployment
2. Whether there's a build step visible in logs
3. What the current Start Command is set to

Then I can provide the exact fix for your specific error!

---

**The good news**: Changing to port 3007 was correct. We're now just one
configuration fix away from success!
