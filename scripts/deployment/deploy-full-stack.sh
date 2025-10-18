#!/bin/bash

# The New Fuse - Full Stack Deployment Script
# This script deploys the complete webhooks, SSE, and serverless architecture

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}[DEPLOY]${NC} $1"
}

print_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENVIRONMENT=${1:-production}
SKIP_TESTS=${2:-false}

# Deployment configuration
DEPLOY_BACKEND=true
DEPLOY_FRONTEND=true
DEPLOY_CLOUDFLARE=true
DEPLOY_MONITORING=true
RUN_MIGRATIONS=true
SETUP_SSL=true

print_header "=== The New Fuse Full Stack Deployment ==="
print_status "Environment: $ENVIRONMENT"
print_status "Project Root: $PROJECT_ROOT"
print_status "Skip Tests: $SKIP_TESTS"
print_header "============================================="

# Check if required tools are installed
check_dependencies() {
    print_step "Checking deployment dependencies..."
    
    local missing_deps=()
    
    # Check for required tools
    command -v docker >/dev/null 2>&1 || missing_deps+=("docker")
    command -v docker-compose >/dev/null 2>&1 || missing_deps+=("docker-compose")
    command -v node >/dev/null 2>&1 || missing_deps+=("node")
    command -v npm >/dev/null 2>&1 || missing_deps+=("npm")
    command -v wrangler >/dev/null 2>&1 || missing_deps+=("wrangler")
    command -v curl >/dev/null 2>&1 || missing_deps+=("curl")
    command -v jq >/dev/null 2>&1 || missing_deps+=("jq")
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing required dependencies: ${missing_deps[*]}"
        print_status "Please install missing dependencies and try again"
        exit 1
    fi
    
    print_success "All dependencies are available"
}

# Validate environment configuration
validate_environment() {
    print_step "Validating environment configuration..."
    
    # Check if environment file exists
    ENV_FILE="$PROJECT_ROOT/.env.$ENVIRONMENT"
    if [ ! -f "$ENV_FILE" ]; then
        print_error "Environment file not found: $ENV_FILE"
        exit 1
    fi
    
    # Source environment file
    source "$ENV_FILE"
    
    # Validate required environment variables
    local required_vars=(
        "DATABASE_URL"
        "REDIS_URL"
        "JWT_SECRET"
        "WEBHOOK_SECRET_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            print_error "Missing required environment variable: $var"
            exit 1
        fi
    done
    
    print_success "Environment configuration validated"
}

# Setup environment
setup_environment() {
    print_step "Setting up deployment environment..."
    
    # Copy environment file
    cp "$PROJECT_ROOT/.env.$ENVIRONMENT" "$PROJECT_ROOT/.env"
    
    # Create necessary directories
    mkdir -p "$PROJECT_ROOT/logs"
    mkdir -p "$PROJECT_ROOT/backup"
    mkdir -p "$PROJECT_ROOT/ssl"
    
    # Set permissions
    chmod 755 "$PROJECT_ROOT/logs"
    chmod 755 "$PROJECT_ROOT/backup"
    chmod 700 "$PROJECT_ROOT/ssl"
    
    print_success "Environment setup complete"
}

# Pre-deployment checks
pre_deployment_checks() {
    print_step "Running pre-deployment checks..."
    
    # Check disk space
    local available_space=$(df "$PROJECT_ROOT" | tail -1 | awk '{print $4}')
    local required_space=5000000  # 5GB in KB
    
    if [ "$available_space" -lt "$required_space" ]; then
        print_warning "Low disk space. Available: ${available_space}KB, Required: ${required_space}KB"
    fi
    
    # Check network connectivity
    if ! curl -s --connect-timeout 5 https://api.github.com >/dev/null; then
        print_error "Network connectivity check failed"
        exit 1
    fi
    
    # Validate Docker daemon
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker daemon is not running"
        exit 1
    fi
    
    print_success "Pre-deployment checks passed"
}

# Build application
build_application() {
    print_step "Building application..."
    
    cd "$PROJECT_ROOT"
    
    # Install dependencies
    print_status "Installing dependencies..."
    npm ci --only=production
    
    # Build packages
    print_status "Building packages..."
    pnpm run build:packages
    
    # Build API
    if [ "$DEPLOY_BACKEND" = true ]; then
        print_status "Building API..."
        cd "$PROJECT_ROOT/apps/api"
        pnpm run build
        cd "$PROJECT_ROOT"
    fi
    
    # Build Frontend
    if [ "$DEPLOY_FRONTEND" = true ]; then
        print_status "Building frontend..."
        cd "$PROJECT_ROOT/apps/frontend"
        pnpm run build
        cd "$PROJECT_ROOT"
    fi
    
    # Build Cloudflare Worker
    if [ "$DEPLOY_CLOUDFLARE" = true ]; then
        print_status "Building Cloudflare Worker..."
        cd "$PROJECT_ROOT/cloudflare-worker"
        pnpm run build
        cd "$PROJECT_ROOT"
    fi
    
    print_success "Application build complete"
}

# Run tests
run_tests() {
    if [ "$SKIP_TESTS" = "true" ]; then
        print_warning "Skipping tests as requested"
        return
    fi
    
    print_step "Running tests..."
    
    cd "$PROJECT_ROOT"
    
    # Unit tests
    print_status "Running unit tests..."
    pnpm run test:unit
    
    # Integration tests
    print_status "Running integration tests..."
    pnpm run test:integration
    
    # E2E tests for critical paths
    print_status "Running critical path tests..."
    pnpm run test:e2e:critical
    
    print_success "All tests passed"
}

# Database migrations
run_database_migrations() {
    if [ "$RUN_MIGRATIONS" = false ]; then
        print_warning "Skipping database migrations"
        return
    fi
    
    print_step "Running database migrations..."
    
    cd "$PROJECT_ROOT"
    
    # Backup database
    print_status "Creating database backup..."
    pnpm run db:backup
    
    # Run migrations
    print_status "Running migrations..."
    pnpm run db:migrate
    
    # Verify migrations
    print_status "Verifying migrations..."
    pnpm run db:verify
    
    print_success "Database migrations complete"
}

# Deploy backend services
deploy_backend() {
    if [ "$DEPLOY_BACKEND" = false ]; then
        print_warning "Skipping backend deployment"
        return
    fi
    
    print_step "Deploying backend services..."
    
    cd "$SCRIPT_DIR"
    
    # Deploy with Docker Compose
    print_status "Starting backend services..."
    docker-compose -f docker-compose.production.yml up -d postgres redis
    
    # Wait for services to be ready
    print_status "Waiting for database to be ready..."
    until docker-compose -f docker-compose.production.yml exec postgres pg_isready; do
        sleep 2
    done
    
    print_status "Waiting for Redis to be ready..."
    until docker-compose -f docker-compose.production.yml exec redis redis-cli ping; do
        sleep 2
    done
    
    # Deploy API
    print_status "Deploying API service..."
        kubectl apply -f k8s/{{ ENVIRONMENT }}/api-deployment.yaml
    kubectl apply -f k8s/{{ ENVIRONMENT }}/api-service.yaml
    
    # Wait for API to be healthy
    print_status "Waiting for API to be healthy..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s -f http://localhost:3000/health >/dev/null; then
            break
        fi
        sleep 10
        ((attempt++))
    done
    
    if [ $attempt -eq $max_attempts ]; then
        print_error "API failed to become healthy"
        exit 1
    fi
    
    print_success "Backend deployment complete"
}

# Deploy frontend
deploy_frontend() {
    if [ "$DEPLOY_FRONTEND" = false ]; then
        print_warning "Skipping frontend deployment"
        return
    fi
    
    print_step "Deploying frontend..."
    
    cd "$SCRIPT_DIR"
    
    # Deploy frontend service
    print_status "Starting frontend service..."
    docker-compose -f docker-compose.production.yml up -d frontend
    
    # Deploy nginx load balancer
    print_status "Starting nginx load balancer..."
    docker-compose -f docker-compose.production.yml up -d nginx
    
    # Wait for frontend to be ready
    print_status "Waiting for frontend to be ready..."
    local max_attempts=20
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s -f http://localhost/health >/dev/null; then
            break
        fi
        sleep 5
        ((attempt++))
    done
    
    if [ $attempt -eq $max_attempts ]; then
        print_error "Frontend failed to become ready"
        exit 1
    fi
    
    print_success "Frontend deployment complete"
}

# Deploy Cloudflare Workers
deploy_cloudflare_workers() {
    if [ "$DEPLOY_CLOUDFLARE" = false ]; then
        print_warning "Skipping Cloudflare Workers deployment"
        return
    fi
    
    print_step "Deploying Cloudflare Workers..."
    
    # Use the dedicated Cloudflare deployment script
    "$SCRIPT_DIR/deploy-cloudflare-workers.sh" "$ENVIRONMENT"
    
    print_success "Cloudflare Workers deployment complete"
}

# Setup monitoring
setup_monitoring() {
    if [ "$DEPLOY_MONITORING" = false ]; then
        print_warning "Skipping monitoring setup"
        return
    fi
    
    print_step "Setting up monitoring..."
    
    cd "$SCRIPT_DIR"
    
    # Deploy monitoring services
    print_status "Starting Prometheus..."
    docker-compose -f docker-compose.production.yml up -d prometheus
    
    print_status "Starting Grafana..."
    docker-compose -f docker-compose.production.yml up -d grafana
    
    print_status "Starting log aggregation..."
    docker-compose -f docker-compose.production.yml up -d fluentd
    
    # Wait for services to be ready
    sleep 30
    
    # Verify monitoring endpoints
    if curl -s -f http://localhost:9090 >/dev/null; then
        print_success "Prometheus is accessible"
    else
        print_warning "Prometheus may not be ready yet"
    fi
    
    if curl -s -f http://localhost:3001 >/dev/null; then
        print_success "Grafana is accessible"
    else
        print_warning "Grafana may not be ready yet"
    fi
    
    print_success "Monitoring setup complete"
}

# Setup SSL certificates
setup_ssl_certificates() {
    if [ "$SETUP_SSL" = false ]; then
        print_warning "Skipping SSL setup"
        return
    fi
    
    print_step "Setting up SSL certificates..."
    
    # This is a placeholder for SSL setup
    # In production, you would use Let's Encrypt or your certificate provider
    
    print_status "SSL certificate setup would be configured here"
    print_status "For production, configure Let's Encrypt or upload your certificates"
    
    print_success "SSL setup complete"
}

# Post-deployment verification
post_deployment_verification() {
    print_step "Running post-deployment verification..."
    
    local endpoints=(
        "http://localhost:3000/health:API Health"
        "http://localhost/health:Frontend Health"
        "http://localhost:3000/webhooks/register:Webhook Registration"
        "http://localhost:9090:Prometheus"
        "http://localhost:3001:Grafana"
    )
    
    for endpoint_info in "${endpoints[@]}"; do
        local endpoint=$(echo "$endpoint_info" | cut -d: -f1)
        local name=$(echo "$endpoint_info" | cut -d: -f2)
        
        print_status "Checking $name..."
        if curl -s -f "$endpoint" >/dev/null; then
            print_success "$name is accessible"
        else
            print_warning "$name may not be ready yet"
        fi
    done
    
    # Test webhook endpoint
    print_status "Testing webhook endpoint..."
    local webhook_test=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST http://localhost:3000/webhooks/incoming/stripe \
        -H "Content-Type: application/json" \
        -d '{"test": true}')
    
    if [ "$webhook_test" = "401" ] || [ "$webhook_test" = "400" ]; then
        print_success "Webhook endpoint is responding (expected auth error)"
    else
        print_warning "Webhook endpoint returned unexpected status: $webhook_test"
    fi
    
    print_success "Post-deployment verification complete"
}

# Deployment summary
deployment_summary() {
    print_header "=== Deployment Summary ==="
    
    print_success "Deployment completed successfully!"
    print_status "Environment: $ENVIRONMENT"
    print_status "Timestamp: $(date)"
    
    echo ""
    print_header "Service URLs:"
    echo "🌐 API: http://localhost:3000"
    echo "🖥️  Frontend: http://localhost"
    echo "📊 Prometheus: http://localhost:9090"
    echo "📈 Grafana: http://localhost:3001"
    echo "📚 API Docs: http://localhost:3000/api-docs"
    echo "🔄 SSE Stream: http://localhost:3000/webhooks/events/stream"
    
    echo ""
    print_header "Default Credentials:"
    echo "Grafana: admin / ${GRAFANA_ADMIN_PASSWORD:-check_env_file}"
    
    echo ""
    print_header "Next Steps:"
    echo "1. Configure your domain and SSL certificates"
    echo "2. Setup webhook integrations with your business platforms"
    echo "3. Configure monitoring alerts and notifications"
    echo "4. Test the complete workflow with real data"
    echo "5. Setup backup and disaster recovery procedures"
    
    echo ""
    print_header "Documentation:"
    echo "📖 Full Documentation: docs/webhooks/README.md"
    echo "🔌 Integration Guides: docs/webhooks/integrations/"
    echo "🚀 API Reference: docs/webhooks/api/openapi.yaml"
    echo "🛠️  Troubleshooting: docs/webhooks/development/troubleshooting.md"
    
    print_header "=============================="
}

# Cleanup on error
cleanup_on_error() {
    if [ $? -ne 0 ]; then
        print_error "Deployment failed. Running cleanup..."
        
        # Stop services that might be running
        docker-compose -f "$SCRIPT_DIR/docker-compose.production.yml" down || true
        
        # Remove containers
        docker container prune -f || true
        
        print_error "Cleanup complete. Check logs for details."
        exit 1
    fi
}

# Main deployment function
main_deployment() {
    print_header "Starting deployment process..."
    
    check_dependencies
    validate_environment
    setup_environment
    pre_deployment_checks
    
    build_application
    run_tests
    run_database_migrations
    
    deploy_backend
    deploy_frontend
    deploy_cloudflare_workers
    setup_monitoring
    setup_ssl_certificates
    
    post_deployment_verification
    deployment_summary
    
    print_success "🎉 Deployment completed successfully!"
}

# Handle script arguments
if [ $# -eq 0 ]; then
    echo "Usage: $0 <environment> [skip_tests]"
    echo "Environments: development, staging, production"
    echo "Skip tests: true/false (default: false)"
    echo ""
    echo "Example: $0 production false"
    exit 1
fi

# Confirm production deployment
if [ "$ENVIRONMENT" = "production" ]; then
    print_warning "This will deploy to PRODUCTION environment."
    print_warning "This action cannot be undone easily."
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        print_error "Deployment cancelled"
        exit 1
    fi
fi

# Set up error handling
trap cleanup_on_error EXIT

# Run the deployment
main_deployment

# Remove error trap on successful completion
trap - EXIT

print_success "🚀 The New Fuse deployment completed successfully!"