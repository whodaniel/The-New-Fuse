#!/bin/bash

# Test Comprehensive Navigation System
echo "🧪 Testing Comprehensive Navigation System for The New Fuse"
echo "============================================================"

BASE_URL="http://localhost:3000"
SUCCESS_COUNT=0
TOTAL_COUNT=0

# Function to test a URL
test_url() {
    local path="$1"
    local name="$2"
    local url="${BASE_URL}${path}"
    
    echo -n "Testing $name ($path)... "
    TOTAL_COUNT=$((TOTAL_COUNT + 1))
    
    # Test if URL returns 200 status and contains React content
    response=$(curl -s -w "%{http_code}" -o /tmp/response.html "$url")
    
    if [ "$response" = "200" ] && grep -q "react" /tmp/response.html 2>/dev/null; then
        echo "✅ PASS"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        echo "❌ FAIL (HTTP: $response)"
    fi
}

# Test Core Routes
echo -e "\n📱 Testing Core Application Routes..."
test_url "/" "Home Page"
test_url "/home" "Home Alt"
test_url "/dashboard" "Dashboard"

# Test AI & Agents
echo -e "\n🤖 Testing AI & Agent Routes..."
test_url "/multi-agent-chat" "Multi-Agent Chat"
test_url "/ai-portal" "AI Agent Portal"
test_url "/chat" "Chat"
test_url "/agents" "All Agents"
test_url "/agents/new" "New Agent"

# Test Workspace
echo -e "\n🏢 Testing Workspace Routes..."
test_url "/workspace/overview" "Workspace Overview"
test_url "/workspace/analytics" "Workspace Analytics"
test_url "/workspace/members" "Workspace Members"
test_url "/workspace/settings" "Workspace Settings"
test_url "/workspace-chat" "Workspace Chat"

# Test Tasks & Workflows
echo -e "\n📋 Testing Tasks & Workflow Routes..."
test_url "/tasks" "All Tasks"
test_url "/tasks/new" "New Task"
test_url "/workflows" "Workflows"
test_url "/workflows/builder" "Workflow Builder"
test_url "/workflows/templates" "Workflow Templates"
test_url "/suggestions" "Suggestions"

# Test Admin
echo -e "\n👨‍💼 Testing Admin Routes..."
test_url "/admin" "Admin Panel"
test_url "/admin/users" "User Management"
test_url "/admin/workspaces" "Workspace Management"
test_url "/admin/system-health" "System Health"
test_url "/admin/feature-flags" "Feature Flags"
test_url "/admin/settings" "Admin Settings"

# Test Dashboard Sub-routes
echo -e "\n📊 Testing Dashboard Sub-routes..."
test_url "/dashboard/agents" "Agent Dashboard"
test_url "/dashboard/analytics" "Dashboard Analytics"
test_url "/dashboard/settings" "Dashboard Settings"

# Test Settings
echo -e "\n⚙️ Testing Settings Routes..."
test_url "/settings" "Settings"
test_url "/settings/general" "General Settings"
test_url "/settings/appearance" "Appearance Settings"
test_url "/settings/notifications" "Notification Settings"
test_url "/settings/security" "Security Settings"
test_url "/settings/api" "API Settings"

# Test Authentication
echo -e "\n🔐 Testing Authentication Routes..."
test_url "/login" "Login"
test_url "/register" "Register"
test_url "/auth/login" "Auth Login"
test_url "/auth/register" "Auth Register"
test_url "/auth/sso" "SSO Authentication"

# Test Components & Demos
echo -e "\n🎨 Testing Demo & Component Routes..."
test_url "/components" "UI Components"
test_url "/timeline-demo" "Timeline Demo"
test_url "/graph-demo" "Graph Demo"
test_url "/frontend-showcase" "Frontend Showcase"
test_url "/layout-example" "Layout Example"
test_url "/test" "Test Page"

# Test Development & Debug
echo -e "\n🔧 Testing Development Routes..."
test_url "/debug" "Debug Info"
test_url "/build-info" "Build Info"

# Test Analytics
echo -e "\n📈 Testing Analytics Routes..."
test_url "/analytics" "Analytics"

# Summary
echo -e "\n📊 Test Results Summary"
echo "======================="
echo "Total Tests: $TOTAL_COUNT"
echo "Passed: $SUCCESS_COUNT"
echo "Failed: $((TOTAL_COUNT - SUCCESS_COUNT))"

if [ $SUCCESS_COUNT -eq $TOTAL_COUNT ]; then
    echo -e "\n🎉 ALL TESTS PASSED! Navigation system is fully functional."
    exit 0
else
    echo -e "\n⚠️  Some tests failed. Check the output above for details."
    exit 1
fi