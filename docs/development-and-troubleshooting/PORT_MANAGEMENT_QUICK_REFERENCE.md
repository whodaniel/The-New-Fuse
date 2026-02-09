# Port Management Quick Reference

## 🚀 Quick Start Commands

```bash
# Check what's currently running
tnf-ports status

# Check for conflicts and auto-fix
tnf-ports conflicts --auto-resolve

# Check service health
tnf-ports health

# Start development with optimization
./dev-with-port-management.sh
```

## 📊 Common Port Allocations

| Service | Port | Status | URL |
|---------|------|--------|-----|
| Frontend | 3000 | ✅ Active | http://localhost:3000 |
| API Server | 3001 | ✅ Active | http://localhost:3001 |
| Backend | 3004 | ⚪ As needed | http://localhost:3004 |
| Redis | 6379 | 🔒 Internal | localhost:6379 |
| PostgreSQL | 5432 | 🔒 Internal | localhost:5432 |

## 🔧 CLI Commands Reference

### Status & Monitoring
```bash
tnf-ports status                    # Show all ports
tnf-ports status -e development     # Filter by environment
tnf-ports status -s frontend        # Filter by service
tnf-ports health                    # Check all service health
tnf-ports health -p 3000           # Check specific port
```

### Conflict Management
```bash
tnf-ports conflicts                 # Show conflicts
tnf-ports conflicts --auto-resolve  # Auto-fix conflicts
```

### Development Workflow
```bash
tnf-ports dev --optimize           # Prepare dev environment
./dev-with-port-management.sh      # Start with optimization
```

## 🛠️ Troubleshooting

### Port Already in Use
```bash
# Find what's using the port
lsof -i :3000

# Kill process if needed
kill -9 <PID>

# Auto-resolve conflicts
tnf-ports conflicts --auto-resolve
```

### Service Not Responding
```bash
# Check if port is available
tnf-ports status

# Check service health
tnf-ports health -s frontend

# Restart development servers
./dev-with-port-management.sh
```

### Configuration Issues
```bash
# Reset to known good state
cd "The New Fuse"
git checkout HEAD -- apps/frontend/vite.config.ts
git checkout HEAD -- apps/frontend/package.json

# Re-run integration
./integrate-port-management.sh
```

## 📁 Key Files

### Configuration Files
- `apps/frontend/vite.config.ts` - Frontend development server
- `apps/frontend/package.json` - Dev scripts and dependencies
- `docker-compose.yml` - Container port mappings
- `.vscode/launch.json` - VS Code debug configuration

### Port Management Files
- `packages/port-management/` - Core port management package
- `tools/port-manager/` - CLI tool implementation
- `docs/PORT_MANAGEMENT.md` - Full documentation
- `PORT_MANAGEMENT.md` - Quick reference (this file)

### Scripts
- `dev-with-port-management.sh` - Optimized development startup
- `integrate-port-management.sh` - Installation script

## 🎯 Development Workflow

### Daily Development
```bash
# Start your development session
./dev-with-port-management.sh

# Check status anytime
tnf-ports status

# If issues arise
tnf-ports conflicts --auto-resolve
```

### Adding New Services
```bash
# Register new service
tnf-ports register -s my-service -e development -p 3005 -t api

# Check for conflicts
tnf-ports conflicts

# Update configurations
# (Automatic when using port management)
```

### Before Deployment
```bash
# Final health check
tnf-ports health

# Verify no conflicts
tnf-ports conflicts

# Check all services
tnf-ports status
```

## 🚨 Emergency Procedures

### Complete Reset
```bash
# Stop all development servers
pkill -f "node.*3000\|node.*3001\|vite"

# Reset configurations
git checkout HEAD -- apps/frontend/vite.config.ts apps/frontend/package.json

# Restart fresh
./dev-with-port-management.sh
```

### Restore from Backup
```bash
# Find backup directory
ls -la .port-management-backups/

# Restore specific configuration
# (Use ConfigurationUpdater.restoreFromBackup())
```

## 💡 Tips & Best Practices

### Development Tips
- Always use `./dev-with-port-management.sh` to start development
- Check `tnf-ports status` if services aren't accessible
- Use `tnf-ports health` to verify service functionality
- Let the system auto-resolve conflicts rather than manual fixes

### Configuration Tips
- Don't manually edit port numbers in config files
- Use the CLI to register new services
- Trust the automatic configuration updates
- Keep backups enabled (default behavior)

### Troubleshooting Tips
- Check port status before assuming service issues
- Use health checks to verify service functionality
- Auto-resolve conflicts before manual intervention
- Review logs in `.port-management-backups/` if needed

## 🔗 Related Documentation

- [Full Port Management Documentation](docs/PORT_MANAGEMENT.md)
- [Technical Architecture](docs/PORT_MANAGEMENT_ARCHITECTURE.md)
- [CLI Help](run: `tnf-ports --help`)
- [Development Guide](README.md)

---

*Keep this reference handy for quick port management operations!*
