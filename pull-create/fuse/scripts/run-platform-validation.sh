#!/bin/bash

# Platform Readiness Validation Runner
# This script orchestrates the complete validation process for platform readiness

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPORTS_DIR="$SCRIPT_DIR/reports"
LOG_FILE="$REPORTS_DIR/validation.log"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Create reports directory
mkdir -p "$REPORTS_DIR"

# Initialize log file
echo "Platform Readiness Validation - $(date)" > "$LOG_FILE"
echo "=================================================" >> "$LOG_FILE"

log "🚀 Starting Platform Readiness Validation"
log "Script Directory: $SCRIPT_DIR"
log "Reports Directory: $REPORTS_DIR"

# Check prerequisites
log "🔍 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    error "Node.js is not installed. Please install Node.js to continue."
    exit 1
fi

NODE_VERSION=$(node --version)
log "✅ Node.js: $NODE_VERSION"

# Check npm
if ! command -v npm &> /dev/null; then
    error "npm is not installed. Please install npm to continue."
    exit 1
fi

NPM_VERSION=$(npm --version)
log "✅ npm: $NPM_VERSION"

# Check if validator scripts exist
REQUIRED_SCRIPTS=(
    "production-readiness-checklist.js"
    "million-user-load-test.js"
    "infrastructure-scalability-validator.js"
    "security-audit-suite.js"
    "database-performance-optimizer.js"
    "monitoring-alerting-system.js"
    "disaster-recovery-validator.js"
    "platform-readiness-orchestrator.js"
)

log "🔍 Checking validator scripts..."
MISSING_SCRIPTS=()

for script in "${REQUIRED_SCRIPTS[@]}"; do
    if [[ -f "$SCRIPT_DIR/$script" ]]; then
        log "✅ Found: $script"
    else
        error "❌ Missing: $script"
        MISSING_SCRIPTS+=("$script")
    fi
done

if [[ ${#MISSING_SCRIPTS[@]} -gt 0 ]]; then
    error "Missing required validator scripts. Please ensure all scripts are present."
    exit 1
fi

# Make scripts executable
log "🔧 Making scripts executable..."
chmod +x "$SCRIPT_DIR"/*.js

# Check optional tools
log "🔍 Checking optional tools..."

if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    log "✅ Docker: $DOCKER_VERSION"
else
    warning "⚠️  Docker not found (optional for some validations)"
fi

if command -v kubectl &> /dev/null; then
    KUBECTL_VERSION=$(kubectl version --client --short 2>/dev/null || echo "kubectl available")
    log "✅ kubectl: $KUBECTL_VERSION"
else
    warning "⚠️  kubectl not found (optional for Kubernetes validations)"
fi

if command -v k6 &> /dev/null; then
    K6_VERSION=$(k6 version)
    log "✅ k6: $K6_VERSION"
else
    warning "⚠️  k6 not found (will use alternative load testing methods)"
fi

# System resource check
log "🖥️  Checking system resources..."
if command -v free &> /dev/null; then
    MEMORY_INFO=$(free -h | grep '^Mem:' | awk '{print $2 " total, " $7 " available"}')
    log "💾 Memory: $MEMORY_INFO"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    MEMORY_TOTAL=$(sysctl -n hw.memsize | awk '{print int($1/1024/1024/1024) " GB"}')
    log "💾 Memory: $MEMORY_TOTAL total"
fi

CPU_COUNT=$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo "unknown")
log "🖥️  CPU Cores: $CPU_COUNT"

# Parse command line arguments
PARALLEL=true
TIMEOUT=3600
TARGET_USERS=1000000
ENVIRONMENT="production"

while [[ $# -gt 0 ]]; do
    case $1 in
        --sequential)
            PARALLEL=false
            shift
            ;;
        --timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        --users)
            TARGET_USERS="$2"
            shift 2
            ;;
        --environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --sequential     Run validators sequentially instead of parallel"
            echo "  --timeout SECS   Set timeout for validation (default: 3600)"
            echo "  --users COUNT    Target user count (default: 1000000)"
            echo "  --environment ENV Environment type (default: production)"
            echo "  --help           Show this help message"
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            exit 1
            ;;
    esac
done

log "⚙️  Configuration:"
log "   Target Users: $(printf "%'d" $TARGET_USERS)"
log "   Environment: $ENVIRONMENT"
log "   Parallel Execution: $PARALLEL"
log "   Timeout: ${TIMEOUT}s"

# Update configuration file
log "📝 Updating configuration..."
CONFIG_FILE="$SCRIPT_DIR/orchestrator-config.json"

if [[ -f "$CONFIG_FILE" ]]; then
    # Update existing config
    node -e "
        const fs = require('fs');
        const config = JSON.parse(fs.readFileSync('$CONFIG_FILE', 'utf8'));
        config.targetUsers = $TARGET_USERS;
        config.environment = '$ENVIRONMENT';
        config.parallel = $PARALLEL;
        config.timeout = $TIMEOUT * 1000;
        config.outputDir = '$REPORTS_DIR';
        fs.writeFileSync('$CONFIG_FILE', JSON.stringify(config, null, 2));
    "
    log "✅ Configuration updated"
else
    warning "⚠️  Configuration file not found, using defaults"
fi

# Run the orchestrator
log "🚀 Starting Platform Readiness Orchestrator..."
log "This may take up to $(($TIMEOUT / 60)) minutes to complete..."

START_TIME=$(date +%s)

# Run with timeout and capture exit code
set +e  # Don't exit on error for this command
timeout $TIMEOUT node "$SCRIPT_DIR/platform-readiness-orchestrator.js" 2>&1 | tee -a "$LOG_FILE"
EXIT_CODE=$?
set -e

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

log "⏱️  Total execution time: ${DURATION}s"

# Analyze results
if [[ $EXIT_CODE -eq 0 ]]; then
    success "🎉 Platform is READY for millions of users!"
    success "All critical validations passed successfully."
elif [[ $EXIT_CODE -eq 124 ]]; then
    error "⏰ Validation timed out after ${TIMEOUT}s"
    error "Consider increasing timeout or running validators individually"
else
    error "❌ Platform is NOT ready for millions of users"
    error "Critical issues found that must be resolved before public release"
fi

# Show report locations
log "📊 Reports generated:"
if [[ -f "$REPORTS_DIR/platform-readiness-report.json" ]]; then
    log "   📄 JSON Report: $REPORTS_DIR/platform-readiness-report.json"
fi

if [[ -f "$REPORTS_DIR/platform-readiness-report.html" ]]; then
    log "   📄 HTML Report: $REPORTS_DIR/platform-readiness-report.html"
    
    # Try to open HTML report
    if command -v open &> /dev/null; then
        log "🌐 Opening HTML report in browser..."
        open "$REPORTS_DIR/platform-readiness-report.html" 2>/dev/null || true
    elif command -v xdg-open &> /dev/null; then
        log "🌐 Opening HTML report in browser..."
        xdg-open "$REPORTS_DIR/platform-readiness-report.html" 2>/dev/null || true
    fi
fi

log "   📄 Execution Log: $LOG_FILE"

# Final recommendations
log ""
log "📋 Next Steps:"
if [[ $EXIT_CODE -eq 0 ]]; then
    log "   ✅ Platform validation successful!"
    log "   ✅ Proceed with confidence to public release"
    log "   ✅ Maintain continuous monitoring during rollout"
    log "   ✅ Be prepared for rapid scaling adjustments"
else
    log "   ❌ Address all critical issues before release"
    log "   ❌ Re-run validation after fixes are implemented"
    log "   ❌ Consider phased rollout approach"
    log "   ❌ Review detailed reports for specific recommendations"
fi

log ""
log "🏁 Platform Readiness Validation Complete"

exit $EXIT_CODE