#!/bin/bash
# System Proxy Configuration

TNF_PROXY_PORT=8888

configure_system_proxy() {
    local action="$1"
    
    if [[ "$action" == "enable" ]]; then
        echo "🔗 Enabling system proxy..."
        networksetup -setwebproxy "Wi-Fi" localhost $TNF_PROXY_PORT
        networksetup -setsecurewebproxy "Wi-Fi" localhost $TNF_PROXY_PORT
        echo "✅ System proxy enabled on port $TNF_PROXY_PORT"
        echo "🌐 All applications will now route through TNF Relay"
    elif [[ "$action" == "disable" ]]; then
        echo "🔓 Disabling system proxy..."
        networksetup -setwebproxystate "Wi-Fi" off
        networksetup -setsecurewebproxystate "Wi-Fi" off
        echo "✅ System proxy disabled"
        echo "🌐 Applications will use direct internet connection"
    else
        echo "Usage: $0 [enable|disable]"
        echo ""
        echo "Examples:"
        echo "  $0 enable   # Enable system-wide proxy through TNF Relay"
        echo "  $0 disable  # Disable system-wide proxy"
        exit 1
    fi
}

configure_system_proxy "$1"