#!/bin/bash

# Deploy Sync System Script
# Integrates with existing Docker and Kubernetes infrastructure

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
DEPLOYMENT_DIR="$SCRIPT_DIR/.."

# Default values
ENVIRONMENT="${ENVIRONMENT:-development}"
NAMESPACE="${NAMESPACE:-default}"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-us-central1-docker.pkg.dev/your-gcp-project-id/the-new-fuse}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
DEPLOY_MODE="${DEPLOY_MODE:-docker}" # docker, k8s, or both

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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    # Check Docker Compose if deploying with Docker
    if [[ "$DEPLOY_MODE" == "docker" || "$DEPLOY_MODE" == "both" ]]; then
        if ! command -v docker-compose &> /dev/null; then
            log_error "Docker Compose is not installed or not in PATH"
            exit 1
        fi
    fi
    
    # Check kubectl if deploying to Kubernetes
    if [[ "$DEPLOY_MODE" == "k8s" || "$DEPLOY_MODE" == "both" ]]; then
        if ! command -v kubectl &> /dev/null; then
            log_error "kubectl is not installed or not in PATH"
            exit 1
        fi
        
        # Check cluster connectivity
        if ! kubectl cluster-info &> /dev/null; then
            log_error "Cannot connect to Kubernetes cluster"
            exit 1
        fi
    fi
    
    # Check if sync-core package exists
    if [[ ! -d "$PROJECT_ROOT/packages/sync-core" ]]; then
        log_error "sync-core package not found at $PROJECT_ROOT/packages/sync-core"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Build sync-core image
build_image() {
    log_info "Building sync-core Docker image..."
    
    cd "$PROJECT_ROOT"
    
    # Build the image
    docker build \
        -f "$DEPLOYMENT_DIR/Dockerfile" \
        -t "sync-core:$IMAGE_TAG" \
        -t "$DOCKER_REGISTRY/sync-core:$IMAGE_TAG" \
        .
    
    log_success "Docker image built successfully"
}

# Push image to registry
push_image() {
    if [[ "$ENVIRONMENT" != "development" ]]; then
        log_info "Pushing image to registry..."
        docker push "$DOCKER_REGISTRY/sync-core:$IMAGE_TAG"
        log_success "Image pushed to registry"
    else
        log_info "Skipping image push in development environment"
    fi
}

# Deploy with Docker Compose
deploy_docker() {
    log_info "Deploying with Docker Compose..."
    
    cd "$DEPLOYMENT_DIR"
    
    # Create environment file
    cat > .env << EOF
NODE_ENV=$ENVIRONMENT
IMAGE_TAG=$IMAGE_TAG
DOCKER_REGISTRY=$DOCKER_REGISTRY
REDIS_URL=${REDIS_URL:-redis://redis:6379}
DATABASE_URL=${DATABASE_URL:-postgresql://user:password@postgres:5432/sync_db}
SYNC_MASTER_CLOCK_ENABLED=${SYNC_MASTER_CLOCK_ENABLED:-true}
SYNC_FILE_WATCHER_ENABLED=${SYNC_FILE_WATCHER_ENABLED:-true}
SYNC_PERFORMANCE_MONITORING=${SYNC_PERFORMANCE_MONITORING:-true}
SYNC_LOG_LEVEL=${SYNC_LOG_LEVEL:-info}
SYNC_TENANT_ISOLATION=${SYNC_TENANT_ISOLATION:-true}
GRAFANA_PASSWORD=${GRAFANA_PASSWORD:-admin}
DOMAIN=${DOMAIN:-localhost}
EOF
    
    # Deploy services
    docker-compose -f docker-compose.sync.yml up -d
    
    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    timeout 120 bash -c 'until docker-compose -f docker-compose.sync.yml ps | grep -q "healthy"; do sleep 5; done' || {
        log_error "Services failed to become healthy within timeout"
        docker-compose -f docker-compose.sync.yml logs
        exit 1
    }
    
    log_success "Docker deployment completed successfully"
}

# Deploy to Kubernetes
deploy_k8s() {
    log_info "Deploying to Kubernetes..."
    
    cd "$DEPLOYMENT_DIR/k8s"
    
    # Create namespace if it doesn't exist
    kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
    
    # Apply configuration and secrets
    envsubst < sync-config.yaml | kubectl apply -n "$NAMESPACE" -f -
    
    # Apply deployment
    envsubst < sync-deployment.yaml | kubectl apply -n "$NAMESPACE" -f -
    
    # Wait for deployment to be ready
    log_info "Waiting for deployment to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/sync-core -n "$NAMESPACE"
    
    # Check pod status
    kubectl get pods -n "$NAMESPACE" -l app=sync-core
    
    log_success "Kubernetes deployment completed successfully"
}

# Health check
health_check() {
    log_info "Performing health check..."
    
    if [[ "$DEPLOY_MODE" == "docker" || "$DEPLOY_MODE" == "both" ]]; then
        # Docker health check
        local max_attempts=30
        local attempt=1
        
        while [[ $attempt -le $max_attempts ]]; do
            if curl -f http://localhost:3003/health/sync &> /dev/null; then
                log_success "Docker deployment health check passed"
                break
            fi
            
            if [[ $attempt -eq $max_attempts ]]; then
                log_error "Docker deployment health check failed after $max_attempts attempts"
                return 1
            fi
            
            log_info "Health check attempt $attempt/$max_attempts failed, retrying..."
            sleep 10
            ((attempt++))
        done
    fi
    
    if [[ "$DEPLOY_MODE" == "k8s" || "$DEPLOY_MODE" == "both" ]]; then
        # Kubernetes health check
        local service_url
        service_url=$(kubectl get service sync-core-service -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
        
        if [[ -z "$service_url" ]]; then
            # Use port-forward for health check
            kubectl port-forward service/sync-core-service 8080:80 -n "$NAMESPACE" &
            local port_forward_pid=$!
            sleep 5
            
            if curl -f http://localhost:8080/health/sync &> /dev/null; then
                log_success "Kubernetes deployment health check passed"
            else
                log_error "Kubernetes deployment health check failed"
                kill $port_forward_pid 2>/dev/null || true
                return 1
            fi
            
            kill $port_forward_pid 2>/dev/null || true
        else
            if curl -f "http://$service_url/health/sync" &> /dev/null; then
                log_success "Kubernetes deployment health check passed"
            else
                log_error "Kubernetes deployment health check failed"
                return 1
            fi
        fi
    fi
}

# Cleanup function
cleanup() {
    log_info "Cleaning up..."
    
    if [[ "$DEPLOY_MODE" == "docker" || "$DEPLOY_MODE" == "both" ]]; then
        cd "$DEPLOYMENT_DIR"
        docker-compose -f docker-compose.sync.yml down --volumes --remove-orphans 2>/dev/null || true
    fi
    
    if [[ "$DEPLOY_MODE" == "k8s" || "$DEPLOY_MODE" == "both" ]]; then
        kubectl delete namespace "$NAMESPACE" --ignore-not-found=true 2>/dev/null || true
    fi
}

# Show deployment info
show_deployment_info() {
    log_info "Deployment Information:"
    echo "  Environment: $ENVIRONMENT"
    echo "  Deploy Mode: $DEPLOY_MODE"
    echo "  Image Tag: $IMAGE_TAG"
    echo "  Namespace: $NAMESPACE"
    
    if [[ "$DEPLOY_MODE" == "docker" || "$DEPLOY_MODE" == "both" ]]; then
        echo ""
        echo "Docker Services:"
        cd "$DEPLOYMENT_DIR"
        docker-compose -f docker-compose.sync.yml ps
        echo ""
        echo "Access URLs:"
        echo "  Sync Core: http://localhost:3003"
        echo "  Prometheus: http://localhost:9090"
        echo "  Grafana: http://localhost:3004 (admin/admin)"
    fi
    
    if [[ "$DEPLOY_MODE" == "k8s" || "$DEPLOY_MODE" == "both" ]]; then
        echo ""
        echo "Kubernetes Resources:"
        kubectl get all -n "$NAMESPACE" -l app=sync-core
    fi
}

# Main deployment function
main() {
    log_info "Starting sync system deployment..."
    log_info "Environment: $ENVIRONMENT, Mode: $DEPLOY_MODE"
    
    # Check prerequisites
    check_prerequisites
    
    # Build and push image
    build_image
    push_image
    
    # Deploy based on mode
    case "$DEPLOY_MODE" in
        "docker")
            deploy_docker
            ;;
        "k8s")
            deploy_k8s
            ;;
        "both")
            deploy_docker
            deploy_k8s
            ;;
        *)
            log_error "Invalid deploy mode: $DEPLOY_MODE. Use 'docker', 'k8s', or 'both'"
            exit 1
            ;;
    esac
    
    # Health check
    health_check
    
    # Show deployment info
    show_deployment_info
    
    log_success "Sync system deployment completed successfully!"
}

# Handle script arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -m|--mode)
            DEPLOY_MODE="$2"
            shift 2
            ;;
        -t|--tag)
            IMAGE_TAG="$2"
            shift 2
            ;;
        -n|--namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        --cleanup)
            cleanup
            exit 0
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -e, --environment ENV    Deployment environment (default: development)"
            echo "  -m, --mode MODE         Deploy mode: docker, k8s, or both (default: docker)"
            echo "  -t, --tag TAG           Docker image tag (default: latest)"
            echo "  -n, --namespace NS      Kubernetes namespace (default: default)"
            echo "  --cleanup               Cleanup deployment"
            echo "  -h, --help              Show this help message"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run main function
main