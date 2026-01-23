# 🚀 TNF Browser Hub - Bun Commands Reference

## ✅ **Correct Commands (Using Bun)**

### **Primary Development Commands**
```bash
# Smart development (recommended) - checks build, starts services
pnpm run dev

# Check build status
pnpm run check-build

# Start services only
pnpm run services:start

# Launch browser hub only
pnpm run hub:functional
```

### **Build Commands**
```bash
# Full build (includes SkIDEancer IDE)
pnpm run build

# Build specific components
pnpm run build:apps
pnpm run build:packages
```

### **Service Management**
```bash
# Start all services with frontend
pnpm run dev:with-frontend

# Direct dev (bypass smart checks)
pnpm run dev:direct

# Check service health
pnpm run services:health
```

### **Individual Service Commands**
```bash
# Frontend service
cd apps/frontend
pnpm run build
pnpm run dev

# API Gateway
cd apps/api-gateway
pnpm run build
pnpm run dev

# SkIDEancer IDE
cd apps/ide-ide
pnpm run build
pnpm run dev

# Backend service
cd apps/backend
pnpm run build
pnpm run dev
```

## 🎯 **Typical Workflow**

### **Daily Development**
```bash
# One command does everything
pnpm run dev
```

### **First Time Setup**
```bash
# Install dependencies
pnpm install

# Build everything
pnpm run build

# Start development
pnpm run dev
```

### **Troubleshooting**
```bash
# Check what's built
pnpm run check-build

# Clear ports and restart
node scripts/clear-ports.js
pnpm run dev

# Manual service check
curl http://localhost:3000
curl http://localhost:3005/health
curl http://localhost:3007
```

## ⚠️ **Important Notes**

### **Always Use Bun**
- ✅ `pnpm run dev` - Correct
- ❌ `npm run dev` - Wrong
- ✅ `pnpm install` - Correct  
- ❌ `npm install` - Wrong

### **Package Manager**
This project uses **Bun** as the package manager:
- **Package file**: `package.json` with `"packageManager": "bun@1.2.16"`
- **Lock file**: `bun.lockb` (not package-lock.json)
- **Scripts**: All defined in package.json, run with `pnpm run <script>`

### **Turbo Integration**
The monorepo uses Turbo with Bun:
- **Build**: `turbo run build` (called by `pnpm run build`)
- **Dev**: `turbo run dev` (called by `pnpm run dev`)
- **Filters**: `--filter=@the-new-fuse/app-name`

## 🚀 **Quick Reference**

| Task | Command |
|------|---------|
| Start everything | `pnpm run dev` |
| Check build status | `pnpm run check-build` |
| Build everything | `pnpm run build` |
| Start services only | `pnpm run services:start` |
| Launch browser only | `pnpm run hub:functional` |
| Clear ports | `node scripts/clear-ports.js` |
| Install deps | `pnpm install` |
| Health check | `pnpm run services:health` |

## 💡 **Pro Tips**

1. **Always use `pnpm run dev`** - it's the smart command that handles everything
2. **Bun is faster** than npm for this project
3. **Smart build detection** saves time by skipping unnecessary rebuilds
4. **One terminal** is all you need with the integrated workflow

**Remember: This is a Bun project, not npm! 🚀**