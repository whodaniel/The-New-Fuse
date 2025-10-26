#!/bin/bash

# Comprehensive Theia IDE Build Process Logger
# This script logs every step of the build process for analysis

LOG_FILE="/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/theia-ide/COMPLETE_BUILD_LOG.txt"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Clear previous log
echo "==================================================================" > "$LOG_FILE"
echo "COMPLETE THEIA IDE BUILD PROCESS LOG" >> "$LOG_FILE"
echo "Started at: $TIMESTAMP" >> "$LOG_FILE"
echo "==================================================================" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Function to log command and output
log_command() {
    echo "" >> "$LOG_FILE"
    echo "==================== COMMAND: $1 ====================" >> "$LOG_FILE"
    echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"
    echo "Working Directory: $(pwd)" >> "$LOG_FILE"
    echo "Command: $1" >> "$LOG_FILE"
    echo "========== OUTPUT START ==========" >> "$LOG_FILE"

    # Execute command and capture both stdout and stderr
    eval "$1" 2>&1 | tee -a "$LOG_FILE"

    echo "========== OUTPUT END ==========" >> "$LOG_FILE"
    echo "Exit Code: ${PIPESTATUS[0]}" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"
}

# Log system information
echo "==================== SYSTEM INFORMATION ====================" >> "$LOG_FILE"
echo "Date: $(date)" >> "$LOG_FILE"
echo "OS: $(uname -a)" >> "$LOG_FILE"
echo "Node Version: $(node --version)" >> "$LOG_FILE"
echo "Npm Version: $(npm --version 2>/dev/null || echo 'npm not available')" >> "$LOG_FILE"
echo "Bun Version: $(bun --version)" >> "$LOG_FILE"
echo "Current Directory: $(pwd)" >> "$LOG_FILE"
echo "User: $(whoami)" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Log directory structure
echo "==================== DIRECTORY STRUCTURE ====================" >> "$LOG_FILE"
log_command "ls -la"

# Log package.json
echo "==================== PACKAGE.JSON CONTENT ====================" >> "$LOG_FILE"
log_command "cat package.json"

# Log node_modules status
echo "==================== NODE_MODULES STATUS ====================" >> "$LOG_FILE"
log_command "ls -la node_modules | head -20"

# Log Theia lib directory
echo "==================== THEIA LIB DIRECTORY ====================" >> "$LOG_FILE"
log_command "ls -la lib/ || echo 'lib directory does not exist'"

# Clean install
echo "==================== CLEAN INSTALL PROCESS ====================" >> "$LOG_FILE"
log_command "rm -rf node_modules"
log_command "rm -rf lib"
log_command "bun install"

# Check Node version compatibility
echo "==================== NODE VERSION SWITCHING ====================" >> "$LOG_FILE"
log_command "source use-node-20.sh"
log_command "node --version"

# Build process attempts
echo "==================== BUILD ATTEMPTS ====================" >> "$LOG_FILE"

# Attempt 1: Direct theia build
log_command "bun run theia:build"

# Attempt 2: Build script
log_command "./build-theia.sh --prod"

# Attempt 3: Direct webpack build if available
log_command "ls -la node_modules/.bin/webpack || echo 'webpack not found'"

# Check what was actually built
echo "==================== POST-BUILD DIRECTORY STATUS ====================" >> "$LOG_FILE"
log_command "ls -la lib/ || echo 'lib directory still does not exist'"
log_command "find . -name '*.js' -path './lib/*' | head -10 || echo 'no built js files found'"

# Test server starts
echo "==================== SERVER START ATTEMPTS ====================" >> "$LOG_FILE"
log_command "timeout 10s bun run start || echo 'start command failed or timed out'"
log_command "timeout 10s bun run theia:start || echo 'theia:start command failed or timed out'"

# Port status
echo "==================== PORT STATUS ====================" >> "$LOG_FILE"
log_command "lsof -i :3000 || echo 'port 3000 not in use'"
log_command "lsof -i :3001 || echo 'port 3001 not in use'"
log_command "lsof -i :3002 || echo 'port 3002 not in use'"
log_command "lsof -i :3006 || echo 'port 3006 not in use'"
log_command "lsof -i :3007 || echo 'port 3007 not in use'"

# Process status
echo "==================== RUNNING PROCESSES ====================" >> "$LOG_FILE"
log_command "ps aux | grep -i theia || echo 'no theia processes found'"
log_command "ps aux | grep -i node | head -10 || echo 'no node processes found'"

# Network connectivity test
echo "==================== NETWORK CONNECTIVITY ====================" >> "$LOG_FILE"
log_command "curl -I http://localhost:3000 || echo 'port 3000 not responding'"
log_command "curl -I http://localhost:3001 || echo 'port 3001 not responding'"
log_command "curl -I http://localhost:3002 || echo 'port 3002 not responding'"

# Final summary
echo "" >> "$LOG_FILE"
echo "==================================================================" >> "$LOG_FILE"
echo "BUILD PROCESS COMPLETED" >> "$LOG_FILE"
echo "Completed at: $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"
echo "Log file: $LOG_FILE" >> "$LOG_FILE"
echo "==================================================================" >> "$LOG_FILE"

echo "Full build log completed! Check: $LOG_FILE"
echo "Log file size: $(wc -l < "$LOG_FILE") lines"