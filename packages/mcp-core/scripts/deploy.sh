#!/bin/bash

# MCP Core Deployment Script
# This script handles deployment of the MCP Core package within The New Fuse ecosystem

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
PACKAGE_NAME="@the-new-fuse/mcp-core"
WORKSPACE_ROOT="$(cd "$(dirname "$0")/../../../" && pwd)"
PACKAGE_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="${PACKAGE_ROOT}/dist"
DOCS_DIR="${PACKAGE_ROOT}/docs"
COVERAGE_DIR="${PACKAGE_ROOT}/coverage"

# Environment detection
ENVIRONMENT=${1:-"development"}
VERSION=${2:-"auto"}

log_info "Starting MCP Core deployment for environment: ${ENVIRONMENT}"

# Change to package directory
cd "${PACKAGE_ROOT}"

# 1. Pre-deployment checks
log_info "Running pre-deployment checks..."

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    log_error "Not in a git repository"
    exit 1
fi

# Check for uncommitted changes in production
if [[ "${ENVIRONMENT}" == "production" ]]; then
    if ! git diff-index --quiet HEAD --; then
        log_error "Uncommitted changes detected. Please commit all changes before production deployment."
        exit 1
    fi
fi

# 2. Clean previous builds
log_info "Cleaning previous builds..."
npm run clean

# 3. Install dependencies
log_info "Installing dependencies..."
if command -v bun > /dev/null 2>&1; then
    bun install
else
    npm install
fi

# 4. Type checking
log_info "Running type checks..."
npm run type-check

# 5. Linting
log_info "Running linter..."
npm run lint

# 6. Testing
log_info "Running tests..."
npm run test:unit
npm run test:integration
npm run test:performance

if [[ "${ENVIRONMENT}" == "production" ]]; then
    log_info "Running compliance tests for production..."
    npm run test:compliance
    
    log_info "Generating coverage report..."
    npm run test:coverage
    
    # Check coverage thresholds
    if [[ -f "${COVERAGE_DIR}/coverage-summary.json" ]]; then
        COVERAGE=$(cat "${COVERAGE_DIR}/coverage-summary.json" | grep -o '"pct":[0-9.]*' | head -1 | cut -d':' -f2)
        if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            log_warning "Coverage is below 80%: ${COVERAGE}%"
        else
            log_success "Coverage meets requirements: ${COVERAGE}%"
        fi
    fi
fi

# 7. Build
log_info "Building package..."
npm run build

# Verify build output
if [[ ! -f "${BUILD_DIR}/index.js" ]] || [[ ! -f "${BUILD_DIR}/index.d.ts" ]]; then
    log_error "Build failed - missing output files"
    exit 1
fi

log_success "Build completed successfully"

# 8. Generate documentation
log_info "Generating documentation..."
if command -v typedoc > /dev/null 2>&1; then
    npm run docs:generate
    log_success "API documentation generated"
else
    log_warning "TypeDoc not available, skipping API documentation generation"
fi

# 9. Version management
if [[ "${VERSION}" == "auto" ]]; then
    if [[ "${ENVIRONMENT}" == "production" ]]; then
        # For production, use semantic versioning
        CURRENT_VERSION=$(node -p "require('./package.json').version")
        log_info "Current version: ${CURRENT_VERSION}"
        
        # Auto-increment patch version for production builds
        NEW_VERSION=$(npm version patch --no-git-tag-version)
        log_info "New version: ${NEW_VERSION}"
    else
        # For development, use timestamp-based versioning
        TIMESTAMP=$(date +%Y%m%d%H%M%S)
        CURRENT_VERSION=$(node -p "require('./package.json').version")
        BASE_VERSION=$(echo "${CURRENT_VERSION}" | cut -d'-' -f1)
        NEW_VERSION="${BASE_VERSION}-dev.${TIMESTAMP}"
        
        # Update package.json
        npm version "${NEW_VERSION}" --no-git-tag-version
        log_info "Development version: ${NEW_VERSION}"
    fi
else
    # Use provided version
    npm version "${VERSION}" --no-git-tag-version
    log_info "Using provided version: ${VERSION}"
fi

# 10. Integration with The New Fuse platform
log_info "Integrating with platform systems..."

# Check if relay-core package exists and update integration
RELAY_CORE_PATH="${WORKSPACE_ROOT}/packages/relay-core"
if [[ -d "${RELAY_CORE_PATH}" ]]; then
    log_info "Found relay-core package, updating integration..."
    
    # Create integration bridge file if it doesn't exist
    INTEGRATION_FILE="${PACKAGE_ROOT}/src/integrations/relay-core.ts"
    if [[ ! -f "${INTEGRATION_FILE}" ]]; then
        mkdir -p "$(dirname "${INTEGRATION_FILE}")"
        cat > "${INTEGRATION_FILE}" << 'EOF'
/**
 * Integration bridge with The New Fuse Relay Core
 */

// Optional integration with relay-core
let relayCore: any = null;

try {
  relayCore = require('@the-new-fuse/relay-core');
} catch (error) {
  // relay-core is not available, gracefully degrade
  console.log('relay-core not available, running in standalone mode');
}

export const RelayIntegration = {
  isAvailable: !!relayCore,
  
  registerMCPService: (serviceInfo: any) => {
    if (relayCore && relayCore.registerService) {
      return relayCore.registerService('mcp', serviceInfo);
    }
    return Promise.resolve();
  },
  
  getSharedConfig: () => {
    if (relayCore && relayCore.getConfig) {
      return relayCore.getConfig('mcp');
    }
    return {};
  }
};
EOF
        log_success "Created relay-core integration bridge"
    fi
else
    log_warning "relay-core package not found, skipping platform integration"
fi

# Update database integration if available
DB_INTEGRATION_PATH="${WORKSPACE_ROOT}/apps/backend/prisma"
if [[ -d "${DB_INTEGRATION_PATH}" ]]; then
    log_info "Found database schema, updating MCP service registry..."
    
    # Create database integration helper
    DB_HELPER_FILE="${PACKAGE_ROOT}/src/integrations/database.ts"
    if [[ ! -f "${DB_HELPER_FILE}" ]]; then
        mkdir -p "$(dirname "${DB_HELPER_FILE}")"
        cat > "${DB_HELPER_FILE}" << 'EOF'
/**
 * Database integration for MCP service persistence
 */

// Optional database integration
let prisma: any = null;

try {
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();
} catch (error) {
  console.log('Prisma client not available, using in-memory storage');
}

export const DatabaseIntegration = {
  isAvailable: !!prisma,
  
  async saveServiceInfo(serviceInfo: any) {
    if (prisma && prisma.mcpService) {
      return prisma.mcpService.upsert({
        where: { id: serviceInfo.id },
        create: serviceInfo,
        update: serviceInfo
      });
    }
    return serviceInfo;
  },
  
  async getServiceInfo(serviceId: string) {
    if (prisma && prisma.mcpService) {
      return prisma.mcpService.findUnique({
        where: { id: serviceId }
      });
    }
    return null;
  }
};
EOF
        log_success "Created database integration helper"
    fi
else
    log_warning "Database schema not found, using in-memory storage only"
fi

# 11. Package publishing (if in production)
if [[ "${ENVIRONMENT}" == "production" ]]; then
    log_info "Preparing for package publishing..."
    
    # Verify package contents
    npm pack --dry-run
    
    log_info "Package ready for publishing to registry"
    log_warning "Manual publish required: npm publish"
fi

# 12. Docker integration (if Dockerfile exists)
DOCKERFILE="${PACKAGE_ROOT}/Dockerfile"
if [[ -f "${DOCKERFILE}" ]]; then
    log_info "Found Dockerfile, building container image..."
    
    IMAGE_NAME="the-new-fuse/mcp-core"
    IMAGE_TAG="${ENVIRONMENT}-$(date +%Y%m%d%H%M%S)"
    
    docker build -t "${IMAGE_NAME}:${IMAGE_TAG}" -t "${IMAGE_NAME}:${ENVIRONMENT}" .
    log_success "Container image built: ${IMAGE_NAME}:${IMAGE_TAG}"
fi

# 13. Health check
log_info "Running post-deployment health check..."

# Verify package can be imported
node -e "
try {
  const mcp = require('./dist/index.js');
  console.log('✓ Package imports successfully');
  
  // Basic functionality test
  if (typeof mcp.MCPSystemFactory !== 'undefined') {
    console.log('✓ MCPSystemFactory is available');
  } else {
    console.log('⚠ MCPSystemFactory not found (may not be implemented yet)');
  }
  
  if (typeof mcp.MCPBroker !== 'undefined') {
    console.log('✓ MCPBroker is available');
  }
  
} catch (error) {
  console.error('✗ Package import failed:', error.message);
  process.exit(1);
}
"

# 14. Deployment summary
log_success "🚀 MCP Core deployment completed successfully!"
log_info "Environment: ${ENVIRONMENT}"
log_info "Version: $(node -p "require('./package.json').version")"
log_info "Build location: ${BUILD_DIR}"
if [[ -d "${DOCS_DIR}" ]]; then
    log_info "Documentation: ${DOCS_DIR}"
fi

# Generate deployment manifest
MANIFEST_FILE="${PACKAGE_ROOT}/deployment-manifest.json"
cat > "${MANIFEST_FILE}" << EOF
{
  "package": "${PACKAGE_NAME}",
  "version": "$(node -p "require('./package.json').version")",
  "environment": "${ENVIRONMENT}",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "buildInfo": {
    "nodeVersion": "$(node --version)",
    "npmVersion": "$(npm --version)",
    "platform": "$(uname -s)",
    "architecture": "$(uname -m)"
  },
  "integration": {
    "relayCoreAvailable": $([ -d "${RELAY_CORE_PATH}" ] && echo "true" || echo "false"),
    "databaseAvailable": $([ -d "${DB_INTEGRATION_PATH}" ] && echo "true" || echo "false"),
    "dockerImage": $([ -f "${DOCKERFILE}" ] && echo "true" || echo "false")
  },
  "files": {
    "dist": "$(ls -la ${BUILD_DIR} | wc -l) files",
    "docs": "$([ -d "${DOCS_DIR}" ] && ls -la ${DOCS_DIR} | wc -l || echo "0") files"
  }
}
EOF

log_success "Deployment manifest saved: ${MANIFEST_FILE}"

log_info "Next steps:"
if [[ "${ENVIRONMENT}" == "production" ]]; then
    log_info "  1. Review deployment manifest"
    log_info "  2. Run: npm publish (if publishing to registry)"
    log_info "  3. Tag release: git tag v$(node -p "require('./package.json').version")"
    log_info "  4. Push tags: git push --tags"
else
    log_info "  1. Test the built package in dependent applications"
    log_info "  2. Review integration with platform components"
    log_info "  3. Run integration tests with other services"
fi