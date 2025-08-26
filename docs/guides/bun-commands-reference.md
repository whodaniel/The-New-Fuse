# 🚀 TNF Browser Hub - Bun Commands Reference

## ✅ **Correct Commands (Using Bun)**

### **Primary Development Commands**
```bash
# Smart development (recommended) - checks build, starts services
bun run dev

# Check build status
bun run check-build

# Start services only
bun run services:start

# Launch browser hub only
bun run hub:functional
```

### **Build Commands**
```bash
# Full build (includes Theia IDE)
bun run build

# Build specific components
bun run build:apps
bun run build:packages
```

### **Service Management**
```bash
# Start all services with frontend
bun run dev:with-frontend

# Direct dev (bypass smart checks)
bun run dev:direct

# Check service health
bun run services:health
```

### **Individual Service Commands**
```bash
# Frontend service
cd apps/frontend
bun run build
bun run dev

# API Gateway
cd apps/api-gateway
bun run build
bun run dev

# Theia IDE
cd apps/theia-ide
bun run build
bun run dev

# Backend service
cd apps/backend
bun run build
bun run dev
```

## 🎯 **Typical Workflow**

### **Daily Development**
```bash
# One command does everything
bun run dev
```

### **First Time Setup**
```bash
# Install dependencies
bun install

# Build everything
bun run build

# Start development
bun run dev
```

### **Troubleshooting**
```bash
# Check what's built
bun run check-build

# Clear ports and restart
node scripts/clear-ports.js
bun run dev

# Manual service check
curl http://localhost:3000
curl http://localhost:3005/health
curl http://localhost:3007
```

## ⚠️ **Important Notes**

### **Always Use Bun**
- ✅ `bun run dev` - Correct
- ❌ `npm run dev` - Wrong
- ✅ `bun install` - Correct  
- ❌ `npm install` - Wrong

### **Package Manager**
This project uses **Bun** as the package manager:
- **Package file**: `package.json` with `"packageManager": "bun@1.2.16"`
- **Lock file**: `bun.lockb` (not package-lock.json)
- **Scripts**: All defined in package.json, run with `bun run <script>`

### **Turbo Integration**
The monorepo uses Turbo with Bun:
- **Build**: `turbo run build` (called by `bun run build`)
- **Dev**: `turbo run dev` (called by `bun run dev`)
- **Filters**: `--filter=@the-new-fuse/app-name`

## 🚀 **Quick Reference**

| Task | Command |
|------|---------|
| Start everything | `bun run dev` |
| Check build status | `bun run check-build` |
| Build everything | `bun run build` |
| Start services only | `bun run services:start` |
| Launch browser only | `bun run hub:functional` |
| Clear ports | `node scripts/clear-ports.js` |
| Install deps | `bun install` |
| Health check | `bun run services:health` |

## 💡 **Pro Tips**

1. **Always use `bun run dev`** - it's the smart command that handles everything
2. **Bun is faster** than npm for this project
3. **Smart build detection** saves time by skipping unnecessary rebuilds
4. **One terminal** is all you need with the integrated workflow

**Remember: This is a Bun project, not npm! 🚀**