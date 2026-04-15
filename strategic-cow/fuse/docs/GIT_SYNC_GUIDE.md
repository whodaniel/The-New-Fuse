# Git Sync Status Guide

## Problem Solved

Previously, it wasn't immediately clear when commits were made but not pushed to
GitHub. This guide documents the setup that now provides clear visibility.

## New Features

### 1. VSCode Status Bar Enhancements

Your VSCode settings now include:

- Auto-fetch every 3 minutes to keep remote status current
- Status bar sync button showing unpushed commits
- Push success notifications
- Always visible SCM (Source Control) actions

**Location:** `.vscode/settings.json`

### 2. Post-Commit Hook Warning

After every commit, you'll now see a warning if you have unpushed commits:

```
⚠️  WARNING: You have 1 unpushed commit(s) on this branch
   Run 'git push' to sync with remote
```

**Location:** `.git/hooks/post-commit`

### 3. Shell Scripts

#### Git Sync Check Script

A comprehensive script that checks your repository sync status:

**Location:** `scripts/git-sync-check.sh`

Output example:

```
🔍 Checking sync status...

📊 Status:
   Unpushed commits: 1
   Uncommitted changes: 2

⚠️  Unpushed commits:
08fd515 feat: Implement frontier capability enhancements

⚠️  Uncommitted changes:
 M .vscode/settings.json
 M package.json

❌ Repository is NOT fully synced
```

### 4. pnpm Scripts

Three new npm scripts for easy checking:

```bash
# Quick sync status check
pnpm run git:sync-check

# Git status with sync check
pnpm run git:status

# Check if push is needed (exits with error if unpushed commits exist)
pnpm run git:push-check

# Direct script execution
./scripts/git-sync-check.sh
```

## Recommended Workflow

### Before Ending Your Work Session

```bash
# Check if everything is committed and pushed
pnpm run git:sync-check
```

### After Making Commits

The post-commit hook will automatically warn you if you forget to push.

### In VSCode

Look at the bottom status bar - you'll see:

- Branch name
- Sync status icon (with number of unpushed commits if any)
- Click the sync button to push

## Quick Reference

| Command                       | What it does                                                |
| ----------------------------- | ----------------------------------------------------------- |
| `pnpm run git:sync-check`     | Shows unpushed commits and uncommitted changes with details |
| `pnpm run git:status`         | Regular git status + sync check                             |
| `pnpm run git:push-check`     | Fails if you have unpushed commits (good for CI)            |
| `./scripts/git-sync-check.sh` | Direct script execution                                     |
| Post-commit hook              | Auto-warns after every commit if unpushed                   |
| VSCode status bar             | Always shows sync status visually                           |

## Troubleshooting

### Hook Not Running

If the post-commit hook doesn't run, ensure it's executable:

```bash
chmod +x .git/hooks/post-commit
```

### Script Not Executable

If the script doesn't run, make it executable:

```bash
chmod +x scripts/git-sync-check.sh
```

### VSCode Not Showing Status

Ensure the Git extension is enabled and reload VSCode:

- Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
- Type "Reload Window"
- Press Enter
