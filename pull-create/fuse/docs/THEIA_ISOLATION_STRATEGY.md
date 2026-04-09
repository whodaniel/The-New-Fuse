# SkIDEancer IDE Isolation Strategy

## Decision: Separate Repository

**Rationale**: SkIDEancer requires Yarn while the main monorepo uses pnpm. Mixing
package managers in a monorepo causes:

- Lockfile conflicts
- Build script confusion
- CI/CD complexity
- Unexpected dependency resolution

## New Repository Structure

### Repository: `whodaniel/skideancer-ide`

```
skideancer-ide/
├── .github/
│   └── workflows/
│       ├── build.yml          # Build on push
│       └── deploy-railway.yml # Deploy to Railway
├── src-gen/
│   ├── backend/
│   │   └── server.js          # SkIDEancer backend
│   └── frontend/
│       └── index.html         # SkIDEancer frontend
├── lib/                       # Compiled modules (531 files)
├── static/                    # Static assets
├── plugins/                   # VSCode-compatible plugins
├── Dockerfile                 # Railway deployment
├── package.json               # Yarn-based
├── yarn.lock                  # Yarn lockfile
├── webpack.config.js
├── gen-webpack.config.js
└── README.md
```

### package.json (Yarn-based)

```json
{
  "name": "@the-new-fuse/ide-ide",
  "version": "2.0.0",
  "description": "Cloud IDE for The New Fuse - AI-integrated SkIDEancer",
  "private": true,
  "main": "src-gen/backend/server.js",
  "scripts": {
    "build": "ide build --mode production",
    "start": "node src-gen/backend/server.js",
    "start:debug": "node --inspect src-gen/backend/server.js",
    "dev": "PORT=3007 node src-gen/backend/server.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.16.0",
    "@ide/ai-anthropic": "1.59.0",
    "@ide/ai-chat": "1.59.0",
    "@ide/ai-core": "1.59.0",
    "@ide/ai-huggingface": "1.59.0",
    "@ide/ai-ollama": "1.59.0",
    "@ide/ai-openai": "1.59.0",
    "@ide/core": "1.59.0",
    "@ide/debug": "1.59.0",
    "@ide/editor": "1.59.0",
    "@ide/filesystem": "1.59.0",
    "@ide/git": "1.59.0",
    "@ide/monaco": "1.59.0",
    "@ide/navigator": "1.59.0",
    "@ide/plugin-ext": "1.59.0",
    "@ide/plugin-ext-vscode": "1.59.0",
    "@ide/terminal": "1.59.0",
    "@ide/workspace": "1.59.0"
  },
  "devDependencies": {
    "@ide/cli": "1.59.0"
  }
}
```

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    THE NEW FUSE ECOSYSTEM                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────┐          ┌─────────────────────┐       │
│  │  whodaniel/fuse     │          │  whodaniel/         │       │
│  │  (Main Monorepo)    │          │  skideancer-ide     │       │
│  │                     │          │                     │       │
│  │  📦 pnpm            │          │  📦 yarn            │       │
│  │  🖥️ Tauri Desktop   │ ◄──────► │  🌐 SkIDEancer IDE       │       │
│  │  ☁️ Cloud Sandbox   │   API    │  🤖 AI Integrations │       │
│  │  🔌 Chrome Extension│          │  📝 Monaco Editor   │       │
│  │                     │          │                     │       │
│  └──────────┬──────────┘          └──────────┬──────────┘       │
│             │                                 │                  │
│             │         Railway                 │                  │
│             │                                 │                  │
│  ┌──────────▼──────────┐          ┌──────────▼──────────┐       │
│  │  tnf-cloud-sandbox  │          │  tnf-ide-ide      │       │
│  │  (Production)       │ ◄──────► │  (Production)       │       │
│  │  Port: 443          │   WSS    │  Port: 443          │       │
│  └─────────────────────┘          └─────────────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Communication Between Services

### 1. Direct WebSocket (Recommended)

```typescript
// SkIDEancer connects to Cloud Sandbox via WebSocket
const ws = new WebSocket(
  'wss://tnf-cloud-sandbox-production.up.railway.app/ws'
);

// SkIDEancer uses MCP tools from sandbox
ws.send(
  JSON.stringify({
    jsonrpc: '2.0',
    id: '1',
    method: 'tools/call',
    params: {
      name: 'browser_navigate',
      arguments: { url: 'https://example.com' },
    },
  })
);
```

### 2. Environment Variables

```bash
# SkIDEancer service environment
CLOUD_SANDBOX_URL=https://tnf-cloud-sandbox-production.up.railway.app
CLOUD_SANDBOX_WS=wss://tnf-cloud-sandbox-production.up.railway.app/ws
TNF_API_URL=https://tnf-api-production.up.railway.app
```

### 3. Shared Redis (Optional)

```bash
# Both services connect to same Redis
REDIS_URL=redis://...railway.app:6379
```

## Railway Configuration

### Service 1: Cloud Sandbox (Existing)

- Repo: `whodaniel/fuse`
- Root: `/apps/cloud-sandbox`
- Port: Auto

### Service 2: SkIDEancer IDE (New)

- Repo: `whodaniel/skideancer-ide`
- Root: `/`
- Port: 3007

## Migration Steps

### Phase 1: Create New Repository

```bash
# 1. Create new repo on GitHub
# Go to github.com/whodaniel → New Repository → "skideancer-ide"

# 2. Initialize with current SkIDEancer files
cd /tmp
mkdir skideancer-ide
cp -r /path/to/The-New-Fuse/apps/ide-ide/* skideancer-ide/
cd skideancer-ide
git init
git add .
git commit -m "Initial commit: SkIDEancer IDE v2.0.0 with AI integrations"
git remote add origin https://github.com/whodaniel/skideancer-ide.git
git push -u origin main
```

### Phase 2: Add Dockerfile

```dockerfile
FROM node:18-slim

# Install yarn
RUN npm install -g yarn

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy application
COPY . .

# Expose port
EXPOSE 3007

# Start SkIDEancer
CMD ["node", "src-gen/backend/server.js", "--hostname=0.0.0.0", "--port=3007"]
```

### Phase 3: Deploy to Railway

```bash
# In Railway dashboard:
# 1. Add new service
# 2. Connect to whodaniel/skideancer-ide
# 3. Set environment variables
# 4. Deploy
```

### Phase 4: Remove from Monorepo

```bash
# In main repo
rm -rf apps/ide-ide
git add -A
git commit -m "chore: Move SkIDEancer IDE to separate repo (whodaniel/skideancer-ide)"
```

### Phase 5: Update Tauri to Link

```typescript
// In Tauri app, add SkIDEancer navigation
const THEIA_URL = 'https://tnf-ide-ide-production.up.railway.app';

window.tnf.openSkIDEancer = () => {
  window.open(THEIA_URL, '_blank');
};
```

## Benefits of This Approach

1. **Clean Separation**: No package manager conflicts
2. **Independent Deployments**: Deploy SkIDEancer without touching main repo
3. **Faster CI/CD**: Smaller repos build faster
4. **Technology Freedom**: SkIDEancer can use whatever tools it needs
5. **Railway Friendly**: Each service has its own repo
6. **Scalable**: Can add more isolated services later

## Drawbacks & Mitigations

| Drawback            | Mitigation                                                 |
| ------------------- | ---------------------------------------------------------- |
| Two repos to manage | Use GitHub Projects to track across repos                  |
| Version sync        | Use semantic versioning, document compatibility            |
| Shared code         | Publish `@the-new-fuse/types` to npm or use git submodules |

## Conclusion

**Separate repository is the correct choice** because:

1. Package manager isolation (yarn vs pnpm)
2. Independent deployment lifecycle
3. Clear service boundaries
4. Railway's model supports multi-repo deployments
5. Matches existing cloud sandbox pattern
