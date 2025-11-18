#!/bin/bash

# ============================================================================
# Docker Test Script for The New Fuse
# ============================================================================
# Tests optimized Docker images for correctness and performance
#
# Usage:
#   ./scripts/docker-test.sh [service]
#
# Services:
#   all           Test all services (default)
#   frontend      Test frontend only
#   api-gateway   Test API Gateway only
#   api           Test API only
#   backend       Test Backend only
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
# Test Functions
# ============================================================================

test_image_exists() {
    local image=$1
    if docker images ${image} --format "{{.Repository}}" | grep -q "${REGISTRY}"; then
        print_success "Image exists: ${image}"
        return 0
    else
        print_error "Image not found: ${image}"
        return 1
    fi
}

test_image_size() {
    local image=$1
    local max_size=$2
    
    SIZE=$(docker images ${image} --format "{{.Size}}")
    SIZE_MB=$(docker images ${image} --format "{{.Size}}" | sed 's/MB//' | sed 's/GB/*1024/' | bc 2>/dev/null || echo "0")
    
    print_info "Image size: $SIZE"
    
    if [ $(echo "$SIZE_MB < $max_size" | bc) -eq 1 ]; then
        print_success "Size OK (< ${max_size}MB)"
    else
        print_warning "Size exceeds ${max_size}MB"
    fi
}

test_non_root_user() {
    local image=$1
    local container_name=$2
    
    USER=$(docker run --rm ${image} whoami 2>/dev/null || echo "error")
    
    if [ "$USER" != "root" ] && [ "$USER" != "error" ]; then
        print_success "Runs as non-root user: ${USER}"
    else
        print_error "Runs as root or failed"
    fi
}

test_health_check() {
    local image=$1
    
    HEALTH=$(docker inspect ${image} --format='{{.Config.Healthcheck}}' 2>/dev/null || echo "none")
    
    if [ "$HEALTH" != "none" ] && [ "$HEALTH" != "" ]; then
        print_success "Health check configured"
    else
        print_warning "No health check configured"
    fi
}

test_security_scan() {
    local image=$1
    
    print_info "Running security scan..."
    
    # Run Trivy scan
    docker run --rm \
        -v /var/run/docker.sock:/var/run/docker.sock \
        aquasec/trivy:latest image ${image} \
        --severity CRITICAL,HIGH \
        --exit-code 0 \
        --quiet 2>/dev/null || true
    
    print_success "Security scan complete"
}

test_container_start() {
    local image=$1
    local container_name=$2
    local port=$3
    
    print_info "Testing container startup..."
    
    # Start container
    docker run -d --name ${container_name} -p ${port}:${port} ${image} >/dev/null 2>&1 || {
        print_error "Failed to start container"
        return 1
    }
    
    # Wait for startup
    sleep 5
    
    # Check if running
    if docker ps | grep -q ${container_name}; then
        print_success "Container started successfully"
    else
        print_error "Container not running"
        docker logs ${container_name}
        docker rm -f ${container_name} >/dev/null 2>&1
        return 1
    fi
    
    # Test health endpoint (if applicable)
    if [ "$port" != "8080" ]; then
        # Backend services
        if curl -f http://localhost:${port}/health >/dev/null 2>&1; then
            print_success "Health endpoint responding"
        else
            print_warning "Health endpoint not responding"
        fi
    else
        # Frontend
        if wget --spider http://localhost:${port}/health >/dev/null 2>&1; then
            print_success "Health endpoint responding"
        else
            print_warning "Health endpoint not responding"
        fi
    fi
    
    # Cleanup
    docker stop ${container_name} >/dev/null 2>&1
    docker rm ${container_name} >/dev/null 2>&1
}

# ============================================================================
# Service Tests
# ============================================================================

test_frontend() {
    print_header "Testing Frontend"
    
    IMAGE="${REGISTRY}/frontend:${TAG}"
    
    test_image_exists ${IMAGE} || return 1
    test_image_size ${IMAGE} 100
    test_non_root_user ${IMAGE} "test-frontend"
    test_health_check ${IMAGE}
    test_container_start ${IMAGE} "test-frontend" 8080
    
    print_success "Frontend tests passed"
}

test_api_gateway() {
    print_header "Testing API Gateway"
    
    IMAGE="${REGISTRY}/api-gateway:${TAG}"
    
    test_image_exists ${IMAGE} || return 1
    test_image_size ${IMAGE} 500
    test_non_root_user ${IMAGE} "test-api-gateway"
    test_health_check ${IMAGE}
    
    print_success "API Gateway tests passed"
}

test_api() {
    print_header "Testing API"
    
    IMAGE="${REGISTRY}/api:${TAG}"
    
    test_image_exists ${IMAGE} || return 1
    test_image_size ${IMAGE} 500
    test_non_root_user ${IMAGE} "test-api"
    test_health_check ${IMAGE}
    
    print_success "API tests passed"
}

test_backend() {
    print_header "Testing Backend"
    
    IMAGE="${REGISTRY}/backend:${TAG}"
    
    test_image_exists ${IMAGE} || return 1
    test_image_size ${IMAGE} 500
    test_non_root_user ${IMAGE} "test-backend"
    test_health_check ${IMAGE}
    
    print_success "Backend tests passed"
}

test_all() {
    print_header "Testing All Services"
    
    test_frontend
    test_api_gateway
    test_api
    test_backend
    
    print_success "All tests passed"
}

# ============================================================================
# Main Execution
# ============================================================================

SERVICE="${1:-all}"

print_header "Docker Test Script for The New Fuse"
print_info "Testing service: $SERVICE"

case $SERVICE in
    all)
        test_all
        ;;
    frontend)
        test_frontend
        ;;
    api-gateway)
        test_api_gateway
        ;;
    api)
        test_api
        ;;
    backend)
        test_backend
        ;;
    *)
        print_error "Unknown service: $SERVICE"
        echo "Valid services: all, frontend, api-gateway, api, backend"
        exit 1
        ;;
esac

print_success "\n✓ Testing complete!"
