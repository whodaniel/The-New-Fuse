# Node.js and CLI Installation Fix Guide

Your Homebrew installation is in a broken state with locked files and corrupted cache. This guide provides two solutions.

## Current Problem

- ❌ Node.js: Not installed
- ⚠️ Claude CLI: Partially installed (aliased but may not work)
- ❌ Gemini CLI: Not installed
- ⚠️ Homebrew: Broken state with lock files

## Solution 1: NVM (Recommended for reliability)

**Pros:**
- More reliable on macOS 12
- Easy to switch Node versions
- No sudo/permission issues

**Run this:**
```bash
./fix-node-installation.sh
```

After completion:
```bash
source ~/.zshrc
```

## Solution 2: Homebrew Only (Simpler)

**Pros:**
- Simpler if it works
- Uses system package manager

**Run this:**
```bash
./fix-node-brew-only.sh
```

## Manual Step-by-Step (If scripts fail)

### 1. Clean Homebrew Locks
```bash
sudo rm -rf /usr/local/var/homebrew/locks
sudo mkdir -p /usr/local/var/homebrew/locks
pkill -9 brew || true
```

### 2. Reset Homebrew
```bash
brew cleanup --prune=all
brew update-reset
brew update
```

### 3. Remove Broken Installations
```bash
brew uninstall --force --ignore-dependencies node || true
brew uninstall --force --ignore-dependencies z3 || true
```

### 4. Install Node.js via Homebrew
```bash
brew install node
```

**OR** Install via nvm:
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# Restart terminal or:
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install Node.js
nvm install --lts
nvm use --lts
```

### 5. Verify Node.js
```bash
node --version
npm --version
```

### 6. Install Claude CLI
```bash
npm install -g @anthropic-ai/claude-code
```

### 7. Install Gemini CLI
```bash
# Option A: Official Google CLI (if available)
npm install -g @google/genai-cli

# Option B: Community CLI
npm install -g gemini-cli
```

## Verify Installations

```bash
node --version    # Should show v20.x or v22.x
npm --version     # Should show 10.x or higher
claude --version  # Should show Claude CLI version
gemini --version  # Should show Gemini CLI version
```

## Troubleshooting

### If Homebrew still fails:

The issue is that macOS 12 is no longer supported by Homebrew. Consider:

1. **Use nvm instead** (recommended)
2. **Download Node.js directly** from https://nodejs.org/
3. **Upgrade macOS** to 13+ (if possible)

### If npm commands fail:

```bash
# Check npm configuration
npm config list

# Fix permissions
sudo chown -R $(whoami) ~/.npm
```

### If CLIs don't work after installation:

```bash
# Add npm global bin to PATH
echo 'export PATH="$PATH:$(npm config get prefix)/bin"' >> ~/.zshrc
source ~/.zshrc
```

## What the Antigravity Agent Needs

The agent needs:
- ✅ Node.js (any LTS version 18+)
- ✅ npm (comes with Node.js)
- ✅ Claude CLI (for Claude Code functionality)
- ✅ Gemini CLI (for Gemini agent integration)

## Next Steps After Installation

1. Verify all tools are working:
   ```bash
   node --version && npm --version && claude --version
   ```

2. Return to your Antigravity Agent work in the IDE

3. The agent should now be able to continue its work!

## Files Created

- [fix-node-installation.sh](fix-node-installation.sh) - Full fix using nvm
- [fix-node-brew-only.sh](fix-node-brew-only.sh) - Simpler Homebrew-only fix
- This guide

## Support

If both scripts fail, the manual steps should work. The core issue is Homebrew's broken state on macOS 12 (unsupported version).
