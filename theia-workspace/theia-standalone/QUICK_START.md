# Theia IDE - Quick Start Guide

## 🚀 Start Server

```bash
cd /Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/theia-ide
./start-with-node20.sh
```

## 🌐 Access Points

- **Theia IDE**: http://localhost:3333
- **Main Server**: http://localhost:3300
- **WebSocket**: ws://localhost:3304

## 🔨 Rebuild (if needed)

```bash
./simple-build.sh
```

## 📋 Troubleshooting

### Server won't start?
```bash
# Ensure Node 20
nvm use 20
node -v  # Should show v20.19.5
```

### Need to rebuild?
```bash
./simple-build.sh
```

### Check build output?
```bash
tail -100 simple-build.log
```

## 📚 Full Documentation

- **Build Success Summary**: [BUILD_SUCCESS_SUMMARY.md](BUILD_SUCCESS_SUMMARY.md)
- **Recovery Plan**: [THEIA_RECOVERY_PLAN.md](THEIA_RECOVERY_PLAN.md)

## ✅ Status

- **Build**: ✅ Successful
- **Node Version**: v20.19.5
- **Dependencies**: ✅ Installed
- **Features**: ✅ All working

---

**Last Build**: January 3, 2025
**Status**: Ready to use! 🎉
