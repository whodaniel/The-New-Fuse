#!/bin/bash

# ============================================================================
# Docker Build Script for The New Fuse
# ============================================================================
# Builds optimized Docker images for all services
#
# Usage:
#   ./scripts/docker-build.sh [service] [options]
#
# Services:
#   all           Build all services (default)
#   frontend      Build frontend only
#   api-gateway   Build API Gateway only
#   api           Build API only
#   backend       Build Backend only
#
# Options:
#   --no-cache    Build without cache
#   --push        Push to registry after build
#   --tag TAG     Custom tag (default: latest)
#   --scan        Run security scan after build
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
REGISTRY="${DOCKER_REGISTRY:-the-new-fuse}"
TAG="${DOCKER_TAG:-latest}"
NO_CACHE=""
PUSH_IMAGES=false
RUN_SCAN=false

# Enable BuildKit
export DOCKER_BUILDKIT=1

# ============================================================================
# Helper Functions
# ============================================================================

print_header() {
    echo -e "\n${CYAN}============================================================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}============================================================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# ============================================================================
# Build Functions
# ============================================================================

build_frontend() {
    print_header "Building Frontend"

    docker build \
        $NO_CACHE \
        -f apps/frontend/Dockerfile.railway \
        -t ${REGISTRY}/frontend:${TAG} \
        .

    print_success "Frontend built: ${REGISTRY}/frontend:${TAG}"

    # Show image size
    SIZE=$(docker images ${REGISTRY}/frontend:${TAG} --format "{{.Size}}")
    print_info "Image size: $SIZE"
}

build_api_gateway() {
    print_header "Building API Gateway"

    docker build \
        $NO_CACHE \
        -f apps/api-gateway/Dockerfile.railway \
        -t ${REGISTRY}/api-gateway:${TAG} \
        .

    print_success "API Gateway built: ${REGISTRY}/api-gateway:${TAG}"

    # Show image size
    SIZE=$(docker images ${REGISTRY}/api-gateway:${TAG} --format "{{.Size}}")
    print_info "Image size: $SIZE"
}

build_api() {
    print_header "Building API"

    docker build \
        $NO_CACHE \
        -f apps/api/Dockerfile.railway \
        -t ${REGISTRY}/api:${TAG} \
        .

    print_success "API built: ${REGISTRY}/api:${TAG}"

    # Show image size
    SIZE=$(docker images ${REGISTRY}/api:${TAG} --format "{{.Size}}")
    print_info "Image size: $SIZE"
}

build_backend() {
    print_header "Building Backend"

    docker build \
        $NO_CACHE \
        -f apps/backend/Dockerfile.railway \
        -t ${REGISTRY}/backend:${TAG} \
        .

    print_success "Backend built: ${REGISTRY}/backend:${TAG}"

    # Show image size
    SIZE=$(docker images ${REGISTRY}/backend:${TAG} --format "{{.Size}}")
    print_info "Image size: $SIZE"
}

build_all() {
    print_header "Building All Services"

    build_frontend
    build_api_gateway
    build_api
    build_backend

    print_success "All services built successfully"

    # Show total size
    print_info "\nImage Sizes:"
    docker images ${REGISTRY}/* --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}" || true
}

# ============================================================================
# Push Function
# ============================================================================

push_images() {
    if [ "$PUSH_IMAGES" = true ]; then
        print_header "Pushing Images to Registry"

        for service in frontend api-gateway api backend; do
            if docker images ${REGISTRY}/${service}:${TAG} --format "{{.Repository}}" | grep -q "${service}"; then
                print_info "Pushing ${REGISTRY}/${service}:${TAG}..."
                docker push ${REGISTRY}/${service}:${TAG}
                print_success "Pushed ${REGISTRY}/${service}:${TAG}"
            fi
        done
    fi
}

# ============================================================================
# Security Scan Function
# ============================================================================

scan_images() {
    if [ "$RUN_SCAN" = true ]; then
        print_header "Scanning Images for Vulnerabilities"

        for service in frontend api-gateway api backend; do
            if docker images ${REGISTRY}/${service}:${TAG} --format "{{.Repository}}" | grep -q "${service}"; then
                print_info "Scanning ${REGISTRY}/${service}:${TAG}..."
                docker run --rm \
                    -v /var/run/docker.sock:/var/run/docker.sock \
                    aquasec/trivy:latest image ${REGISTRY}/${service}:${TAG} \
                    --severity HIGH,CRITICAL || true
            fi
        done
    fi
}

# ============================================================================
# Parse Arguments
# ============================================================================

SERVICE="${1:-all}"
shift 2>/dev/null || true

while [[ $# -gt 0 ]]; do
    case $1 in
        --no-cache)
            NO_CACHE="--no-cache"
            shift
            ;;
        --push)
            PUSH_IMAGES=true
            shift
            ;;
        --tag)
            TAG="$2"
            shift 2
            ;;
        --scan)
            RUN_SCAN=true
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# ============================================================================
# Main Execution
# ============================================================================

print_header "Docker Build Script for The New Fuse"
print_info "Service: $SERVICE"
print_info "Tag: $TAG"
print_info "Registry: $REGISTRY"
[ "$NO_CACHE" != "" ] && print_warning "Building without cache"
[ "$PUSH_IMAGES" = true ] && print_info "Will push images after build"
[ "$RUN_SCAN" = true ] && print_info "Will scan images after build"

# Build requested service(s)
case $SERVICE in
    all)
        build_all
        ;;
    frontend)
        build_frontend
        ;;
    api-gateway)
        build_api_gateway
        ;;
    api)
        build_api
        ;;
    backend)
        build_backend
        ;;
    *)
        print_error "Unknown service: $SERVICE"
        echo "Valid services: all, frontend, api-gateway, api, backend"
        exit 1
        ;;
esac

# Push images if requested
push_images

# Scan images if requested
scan_images

print_success "\n✓ Build complete!"

# Show summary
print_info "\nTo run the built images:"
echo "  docker run -d -p 8080:8080 ${REGISTRY}/frontend:${TAG}"
echo "  docker run -d -p 3002:3002 ${REGISTRY}/api-gateway:${TAG}"
echo "  docker run -d -p 3001:3001 ${REGISTRY}/api:${TAG}"
echo "  docker run -d -p 3003:3003 ${REGISTRY}/backend:${TAG}"

print_info "\nOr use Docker Compose:"
echo "  docker-compose -f docker-compose.local.yml up"
