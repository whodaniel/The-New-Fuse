# TNF Terminal Multiplexer Setup Documentation

## Overview

Terminal multiplexer integration for The New Fuse (TNF) relay system providing
comprehensive process management, monitoring, and development environment
orchestration.

## Installation & Setup

### Prerequisites

```bash
# Install tmux if not already installed
brew install tmux  # macOS
# or
sudo apt-get install tmux  # Ubuntu/Debian
```

### Quick Start

```bash
# Make the script executable
chmod +x tnf-tmux-setup.sh

# Start the complete TNF environment
./tnf-tmux-setup.sh start

# Detach from session (keeps running)
# Press: Ctrl+b then d

# Reattach to running session
./tnf-tmux-setup.sh attach
```

## Session Layout

### Window 0: Relay Server

- **Purpose**: Main TNF relay server
- **Command**: `node enhanced-tnf-relay.js start`
- **Monitors**: HTTP (3000) and WebSocket (3001) servers

### Window 1: Log Monitoring (4 panes)

- **Pane 0**: `enhanced-relay.log`
- **Pane 1**: `relay.log`
- **Pane 2**: `relay-startup.log`
- **Pane 3**: `logs/relay.log`

### Window 2: MCP Agents (2 panes)

- **Pane 0**: Process monitoring (`ps aux | grep mcp`)
- **Pane 1**: Port monitoring (`lsof -i :3000,3001,3772`)

### Window 3: Chrome Extension (2 panes)

- **Pane 0**: Extension development environment
- **Pane 1**: Build and development commands

### Window 4: API Testing (2 panes)

- **Pane 0**: HTTP API testing with curl
- **Pane 1**: WebSocket testing with wscat

### Window 5: File Operations

- **Purpose**: General file management and project navigation

## Management Commands

```bash
# Session Management
./tnf-tmux-setup.sh start      # Create new session
./tnf-tmux-setup.sh stop       # Terminate session
./tnf-tmux-setup.sh restart    # Stop and start
./tnf-tmux-setup.sh attach     # Attach to existing
./tnf-tmux-setup.sh status     # Show session info
./tnf-tmux-setup.sh list       # List all sessions

# Remote Command Execution
./tnf-tmux-setup.sh send relay-server "curl http://localhost:3000/status"
./tnf-tmux-setup.sh send api-test "wscat -c ws://localhost:3001"
```

## Key Benefits

### 1. Process Persistence

- Relay server continues running after terminal closure
- AI automation sessions remain active
- MCP agent processes maintained

### 2. Real-time Monitoring

- Multiple log files monitored simultaneously
- Process status visibility
- Port usage tracking
- Visual activity alerts

### 3. Development Efficiency

- Instant context switching between components
- Parallel development and testing workflows
- Centralized command execution

### 4. Session Management

- Detach/reattach capabilities
- Remote session access via SSH
- Multiple developer collaboration

## Tmux Navigation

### Essential Shortcuts

```
Ctrl+b + c        # Create new window
Ctrl+b + n        # Next window
Ctrl+b + p        # Previous window
Ctrl+b + 0-9      # Switch to window number
Ctrl+b + d        # Detach session
Ctrl+b + %        # Split pane vertically
Ctrl+b + "        # Split pane horizontally
Ctrl+b + arrow    # Navigate between panes
Ctrl+b + x        # Close current pane
Ctrl+b + &        # Close current window
```

### Window-specific Actions

```
# From any terminal
tmux attach-session -t tnf-relay

# Send commands to specific windows
tmux send-keys -t tnf-relay:relay-server "node --version" C-m
tmux send-keys -t tnf-relay:api-test "curl localhost:3000/status" C-m
```

## Monitoring & Alerts

### Activity Monitoring

- Visual alerts when log files update
- Process state change notifications
- Port availability changes

### Performance Tracking

- Real-time process monitoring
- Memory and CPU usage via `top`/`htop`
- Network connection status

## Integration with TNF Components

### Relay Server Integration

- Automatic startup of enhanced-tnf-relay.js
- HTTP and WebSocket server monitoring
- Agent discovery and registration tracking

### Chrome Extension Development

- Build process automation
- Development server management
- Extension reload triggers

### MCP Agent Coordination

- AppleScript MCP monitoring
- Browser MCP process tracking
- Inter-agent communication logging

### AI Session Management

- Session lifecycle tracking
- Element mapping updates
- Automation workflow monitoring

## Troubleshooting

### Common Issues

```bash
# Session not starting
tmux kill-server  # Kill all tmux processes
./tnf-tmux-setup.sh start

# Can't attach to session
tmux list-sessions  # Check existing sessions
tmux attach -t tnf-relay

# Pane not responding
# Ctrl+b + & to close window
# Ctrl+b + c to create new window
```

### Log Analysis

```bash
# Check specific logs in tmux
tmux send-keys -t tnf-relay:logs.0 "grep ERROR enhanced-relay.log" C-m

# Monitor process status
tmux send-keys -t tnf-relay:mcp-agents.0 "ps aux | grep node" C-m
```

## Advanced Configuration

### Custom Window Layout

```bash
# Add custom windows to existing session
tmux new-window -t tnf-relay -n 'custom' -c "$PROJECT_DIR"
tmux send-keys -t tnf-relay:custom "your-command-here" C-m
```

### Automated Alerts

```bash
# Set up alerts for specific log patterns
tmux send-keys -t tnf-relay:logs.0 "tail -f enhanced-relay.log | grep --line-buffered ERROR" C-m
```

## Best Practices

### Session Management

1. Always use `./tnf-tmux-setup.sh start` for initialization
2. Detach rather than closing terminal windows
3. Use descriptive window names for custom additions
4. Monitor session status regularly

### Development Workflow

1. Start session at beginning of work day
2. Use separate windows for different components
3. Keep logs visible in background
4. Detach during breaks/meetings

### Monitoring Strategy

1. Check relay server window first for overall health
2. Monitor MCP agents for process stability
3. Watch logs for error patterns
4. Test API endpoints regularly

## Security Considerations

### Network Security

- WebSocket server limited to localhost
- HTTP API restricted to local access
- No external network exposure by default

### Process Security

- Scripts run with user permissions
- No elevated privileges required
- Isolated session environment

---

**Setup Complete**: TNF Terminal Multiplexer environment ready for development
and monitoring operations.
