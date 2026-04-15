# Claude Ping Controller - Unified System Documentation

## Overview

The Claude Ping Controller Unified System consolidates all previous ping implementations into a single, comprehensive solution that provides multiple interface options and robust functionality for maintaining AI engagement.

## Architecture

### Core Components

1. **`claude-ping-controller-unified.scpt`** - Main AppleScript engine
2. **`claude-ping-cli.sh`** - Command-line interface wrapper
3. **Configuration System** - Persistent settings storage
4. **Logging System** - Comprehensive activity logging
5. **Process Management** - Robust start/stop/restart functionality

### Consolidated Features

This unified system combines features from all previous implementations:

- ✅ **Simple Claude Ping** - Basic ping functionality
- ✅ **Improved Ping** - Enhanced error handling and stop control
- ✅ **GUI Controller** - Native macOS dialog interface
- ✅ **Persistent GUI** - Continuously available control panel
- ✅ **Menu Bar Controller** - Menu bar integration
- ✅ **Dock Icon Controller** - Dock icon interface
- ✅ **Desktop Icon** - Double-click desktop app
- ✅ **Stop All Pings** - Emergency stop functionality
- ✅ **Configuration Management** - Persistent settings
- ✅ **Advanced Logging** - Comprehensive activity tracking

## Interface Modes

### 1. GUI Mode (Default)
```bash
./claude-ping-cli.sh gui
```
- Native macOS dialog interface
- Full control panel with all options
- Real-time status updates
- Settings configuration

### 2. Command Line Mode
```bash
./claude-ping-cli.sh start
./claude-ping-cli.sh status
./claude-ping-cli.sh stop
```
- Terminal-based control
- Scriptable and automatable
- Colored output for clarity
- Comprehensive command set

### 3. Menu Bar Mode
```bash
./claude-ping-cli.sh menubar
```
- Menu bar icon integration
- Quick access controls
- Minimal screen real estate
- Always accessible

### 4. Dock Mode
```bash
./claude-ping-cli.sh dock
```
- Dock icon interface
- Right-click menu access
- System integration
- Visual status indicators

### 5. Headless Mode
```bash
./claude-ping-cli.sh start
```
- Background operation
- No user interface
- Logging only
- Server/automation friendly

## Installation and Setup

### Quick Setup
```bash
# Make scripts executable
chmod +x claude-ping-cli.sh
chmod +x claude-ping-controller-unified.scpt

# Test the system
./claude-ping-cli.sh diagnostics

# Start with GUI
./claude-ping-cli.sh gui
```

### System Service Installation
```bash
# Install as macOS LaunchAgent (auto-start)
./claude-ping-cli.sh install-service

# Uninstall service
./claude-ping-cli.sh uninstall-service
```

### Desktop Icon Creation
```bash
# Create desktop app (consolidated from create-desktop-icon.sh)
./claude-ping-cli.sh install-service
```

## Configuration

### Configuration File Location
`~/.claude_ping_config`

### Available Settings
```
pingInterval=10          # Ping interval in seconds (5-60)
autoRestart=true         # Automatically restart on failure
notificationsEnabled=true # Show system notifications
soundEnabled=true        # Play sounds with notifications
debugMode=false          # Enable debug logging
```

### Configuration Management
```bash
# Edit configuration through CLI
./claude-ping-cli.sh config

# View current settings
./claude-ping-cli.sh status
```

## Command Reference

### Basic Commands
```bash
./claude-ping-cli.sh start           # Start ping system
./claude-ping-cli.sh stop            # Stop ping system  
./claude-ping-cli.sh restart         # Restart ping system
./claude-ping-cli.sh status          # Show detailed status
```

### Interface Commands
```bash
./claude-ping-cli.sh gui             # Open GUI interface
./claude-ping-cli.sh menubar         # Open menu bar interface
./claude-ping-cli.sh dock            # Open dock interface
```

### Monitoring Commands
```bash
./claude-ping-cli.sh logs            # Show recent logs
./claude-ping-cli.sh follow          # Follow logs in real-time
./claude-ping-cli.sh diagnostics     # Run system diagnostics
```

### Management Commands
```bash
./claude-ping-cli.sh config          # Configure settings
./claude-ping-cli.sh emergency-stop  # Force stop all processes
./claude-ping-cli.sh install-service # Install as system service
./claude-ping-cli.sh uninstall-service # Remove system service
```

## Logging and Monitoring

### Log Files
- **Main Log**: `/tmp/claude_ping_unified.log`
- **Service Log**: `/tmp/claude_ping_service.log`

### Status Information
- Current running state
- Process ID and start time
- Ping count and error statistics
- Configuration settings
- System uptime

### Monitoring Features
- Real-time status updates
- Error tracking and retry logic
- Performance metrics
- System resource monitoring

## Process Management

### Robust Start/Stop Control
- Process ID tracking
- Graceful shutdown signals
- Force kill as fallback
- Cleanup of temporary files

### Auto-Restart Capability
- Configurable auto-restart on failure
- Retry logic with exponential backoff
- Maximum retry limits
- Failure notification

### Emergency Stop
```bash
./claude-ping-cli.sh emergency-stop
```
- Kills all related processes
- Removes all temporary files
- Resets system state
- Nuclear option for stuck processes

## Integration Capabilities

### Environment Variables
```bash
export CLAUDE_PING_MODE="headless"  # Set interface mode
export CLAUDE_PING_INTERVAL="15"    # Set ping interval
```

### External Control
```bash
# Start from other scripts
osascript claude-ping-controller-unified.scpt

# Quick control functions
osascript -e 'tell application "claude-ping-controller-unified.scpt" to quickStart()'
osascript -e 'tell application "claude-ping-controller-unified.scpt" to quickStop()'
```

### API Integration
The system can be integrated with The New Fuse infrastructure:
- WebSocket connections (port 3710)
- API endpoints (port 3001)
- Multi-agent coordination (port 3000)

## Migration from Previous Versions

### Automatic Detection
The unified system automatically detects and stops any running instances of previous versions:
- `claude-ping-with-send.scpt`
- `claude-ping-improved.scpt`
- `simple-claude-ping.scpt`
- Any GUI variants

### Settings Migration
Configuration settings are automatically migrated from any existing setup.

### Process Cleanup
```bash
# Clean up all old processes
./claude-ping-cli.sh emergency-stop

# Start fresh with unified system
./claude-ping-cli.sh start
```

## Troubleshooting

### Common Issues

#### Ping System Won't Start
```bash
# Check diagnostics
./claude-ping-cli.sh diagnostics

# Check if Claude app is installed
ls -la /Applications/Claude.app

# Check permissions
ls -la claude-ping-controller-unified.scpt
```

#### Multiple Instances Running
```bash
# Emergency stop all
./claude-ping-cli.sh emergency-stop

# Restart cleanly
./claude-ping-cli.sh start
```

#### Configuration Issues
```bash
# Reset configuration to defaults
rm ~/.claude_ping_config
./claude-ping-cli.sh config
```

### Debug Mode
Enable debug mode for detailed logging:
```bash
# Edit config to enable debug
./claude-ping-cli.sh config
# Set debugMode=true

# Follow debug logs
./claude-ping-cli.sh follow
```

### Log Analysis
```bash
# View recent activity
./claude-ping-cli.sh logs

# Search for errors
grep -i error /tmp/claude_ping_unified.log

# Monitor in real-time
tail -f /tmp/claude_ping_unified.log
```

## Advanced Features

### Custom Ping Messages
The system can be extended to support custom ping messages by modifying the `sendPing()` function in the AppleScript.

### Integration Hooks
The system provides hooks for integration with other systems:
- Pre-ping callbacks
- Post-ping processing
- Error handling extensions
- Status change notifications

### Performance Optimization
- Configurable ping intervals
- Resource usage monitoring
- Automatic throttling under high load
- Efficient process management

## Security Considerations

### Permissions
- Requires Accessibility permissions for GUI automation
- Uses local file system for configuration and logs
- No network access required
- All data stored locally

### Process Isolation
- Runs in user space only
- No elevated privileges required
- Isolated process management
- Clean shutdown procedures

## Future Enhancements

### Planned Features
1. **Web Interface** - Browser-based control panel
2. **Remote Control** - Network-based management
3. **Multiple AI Support** - Support for other AI platforms
4. **Advanced Analytics** - Usage statistics and trends
5. **Plugin System** - Extensible architecture

### Integration Roadmap
1. **The New Fuse Integration** - Direct API integration
2. **VS Code Extension** - Built-in VS Code controls
3. **Chrome Extension** - Browser-based management
4. **Multi-Agent Coordination** - Advanced AI orchestration

## API Reference

### AppleScript Functions
```applescript
-- Core functions
startPingSystem()
stopPingSystem()
restartPingSystem()
sendPing()

-- Status functions
getStatusText()
getDetailedStatus()
isPingRunning()

-- Configuration functions
loadConfiguration()
saveConfiguration()
showSettingsPanel()

-- Interface functions
launchGUIInterface()
launchMenuBarInterface()
launchDockInterface()
launchHeadlessInterface()

-- Utility functions
logMessage(message)
showMessage(message)
emergencyStop()
```

### Command Line Interface
```bash
# All commands return appropriate exit codes
# 0 = success, 1 = error, 2 = already running/stopped

./claude-ping-cli.sh start    # Returns 0 on success, 1 on failure
./claude-ping-cli.sh stop     # Returns 0 on success, 1 if not running
./claude-ping-cli.sh status   # Always returns 0, check output for status
```

## Support and Maintenance

### File Locations
- **Scripts**: `scripts/claude-ping-controller-unified.scpt`, `scripts/claude-ping-cli.sh`
- **Config**: `~/.claude_ping_config`
- **Logs**: `/tmp/claude_ping_unified.log`
- **PID**: `/tmp/claude_ping_unified.pid`
- **Service**: `~/Library/LaunchAgents/com.thenewfuse.claudeping.plist`

### Maintenance Tasks
```bash
# Clean up old logs
rm /tmp/claude_ping_*.log

# Reset configuration
rm ~/.claude_ping_config

# Full system reset
./claude-ping-cli.sh emergency-stop
rm ~/.claude_ping_config /tmp/claude_ping_*
```

### Version Information
- **Version**: 1.0.0 (Unified)
- **Compatibility**: macOS 10.14+
- **Dependencies**: AppleScript, bash, Claude Desktop app
- **License**: MIT

---

This unified system replaces all previous ping implementations with a single, comprehensive solution that maintains backward compatibility while providing enhanced functionality and multiple interface options.
