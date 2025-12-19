#!/bin/bash
# Claude Code TNF Environment Setup

TNF_PROXY_PORT=8888
TNF_RELAY_PORT=3001

echo "🔧 Setting up Claude Code environment for TNF interception..."

# Create TNF environment file
cat > "$HOME/.tnf-claude-env" << 'EOF'
#!/bin/bash
# TNF Claude Code Environment
export HTTP_PROXY="http://localhost:8888"
export HTTPS_PROXY="http://localhost:8888"
export http_proxy="$HTTP_PROXY"
export https_proxy="$HTTPS_PROXY"
export NODE_TLS_REJECT_UNAUTHORIZED=0
export TNF_INTERCEPT_ACTIVE=1

# Send context to TNF Relay
tnf_send_context() {
    local context_data="$1"
    if command -v wscat >/dev/null 2>&1; then
        echo "$context_data" | wscat -c "ws://localhost:3001" -w 1 2>/dev/null || true
    fi
}

# Claude Code wrapper with context
claude_with_tnf() {
    local working_dir="$(pwd)"
    local git_repo=""
    local git_branch=""
    
    if git rev-parse --git-dir >/dev/null 2>&1; then
        git_repo="$(basename $(git rev-parse --show-toplevel) 2>/dev/null || echo 'unknown')"
        git_branch="$(git branch --show-current 2>/dev/null || echo 'unknown')"
    fi
    
    local context_json="{
        \"type\": \"CLAUDE_CODE_EXECUTION_CONTEXT\",
        \"source\": \"claude_code_wrapper\",
        \"target\": \"claude_desktop\",
        \"content\": {
            \"action\": \"pre_execution_context\",
            \"working_directory\": \"$working_dir\",
            \"git_repository\": \"$git_repo\",
            \"git_branch\": \"$git_branch\",
            \"command_args\": \"$*\",
            \"timestamp\": \"$(date -u +\"%Y-%m-%dT%H:%M:%SZ\")\",
            \"user\": \"$(whoami)\",
            \"shell\": \"$SHELL\"
        },
        \"timestamp\": \"$(date -u +\"%Y-%m-%dT%H:%M:%SZ\")\"
    }"
    
    tnf_send_context "$context_json"
    
    echo "[$(date)] Claude Code: $*" >> "$HOME/Desktop/A1-Inter-LLM-Com/The New Fuse/claude-code-activity.log"
    command claude "$@"
    local exit_code=$?
    
    local completion_json="{
        \"type\": \"CLAUDE_CODE_COMPLETION\",
        \"source\": \"claude_code_wrapper\",
        \"content\": {
            \"action\": \"execution_completed\",
            \"exit_code\": $exit_code,
            \"command_args\": \"$*\",
            \"timestamp\": \"$(date -u +\"%Y-%m-%dT%H:%M:%SZ\")\"
        }
    }"
    
    tnf_send_context "$completion_json"
    return $exit_code
}

alias claude='claude_with_tnf'
alias claude-original='command claude'

echo "🔧 TNF Claude Code environment loaded"
echo "💡 Proxy: $HTTP_PROXY"
echo "🔗 Relay: ws://localhost:3001"
EOF

chmod +x "$HOME/.tnf-claude-env"

# Add to shell configuration
SHELL_RC=""
if [[ "$SHELL" == *"zsh"* ]]; then
    SHELL_RC="$HOME/.zshrc"
elif [[ "$SHELL" == *"bash"* ]]; then
    SHELL_RC="$HOME/.bashrc"
fi

if [[ -n "$SHELL_RC" ]] && ! grep -q "tnf-claude-env" "$SHELL_RC" 2>/dev/null; then
    echo "" >> "$SHELL_RC"
    echo "# TNF Claude Code Interception" >> "$SHELL_RC"
    echo "if [[ -f \$HOME/.tnf-claude-env ]]; then" >> "$SHELL_RC"
    echo "    source \$HOME/.tnf-claude-env" >> "$SHELL_RC"
    echo "fi" >> "$SHELL_RC"
    echo "✅ Added TNF environment to $SHELL_RC"
fi

echo "✅ Claude Code environment configured"
echo "🔄 Restart your terminal or run: source ~/.tnf-claude-env"