#!/bin/bash

# Enhanced Production Deployment Script for The New Fuse
# This script deploys the application with enhanced load balancing, security, and monitoring

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.production.yml"
NGINX_CONFIG_DIR="$PROJECT_ROOT/nginx"
MONITORING_DIR="$PROJECT_ROOT/monitoring"

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
    
    # Check Docker Compose
    if ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not available"
        exit 1
    fi
    
    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi
    
    # Check Docker Swarm status
    if ! docker node ls &> /dev/null; then
        log_warning "Docker Swarm is not active. Initializing..."
        if ! docker swarm init --advertise-addr 127.0.0.1 &> /dev/null; then
            log_info "Docker Swarm already initialized or failed to initialize. Continuing..."
        fi
    fi
    
    log_success "Prerequisites check completed"
}

# Setup directories and configurations
setup_directories() {
    log_info "Setting up directories and configurations..."
    
    # Create necessary directories
    mkdir -p "$NGINX_CONFIG_DIR/conf.d"
    mkdir -p "$NGINX_CONFIG_DIR/ssl"
    mkdir -p "$NGINX_CONFIG_DIR/cache"
    mkdir -p "$MONITORING_DIR/prometheus"
    mkdir -p "$MONITORING_DIR/grafana/dashboards"
    mkdir -p "$MONITORING_DIR/grafana/datasources"
    mkdir -p "$PROJECT_ROOT/database/init"
    
    # Copy enhanced Nginx configuration
    if [ -f "$PROJECT_ROOT/enhanced-load-balancer.conf" ]; then
        cp "$PROJECT_ROOT/enhanced-load-balancer.conf" "$NGINX_CONFIG_DIR/conf.d/default.conf"
        log_success "Enhanced Nginx configuration copied"
    else
        log_warning "Enhanced Nginx configuration not found, using default"
    fi
    
    # Create Prometheus configuration if it doesn't exist
    if [ ! -f "$MONITORING_DIR/prometheus.yml" ]; then
        cat > "$MONITORING_DIR/prometheus.yml" << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'fuse-api'
    static_configs:
      - targets: ['api-1:3000', 'api-2:3000', 'api-3:3000']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'fuse-frontend'
    static_configs:
      - targets: ['frontend-1:3000', 'frontend-2:3000']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx:80']
    metrics_path: '/nginx_status'
    scrape_interval: 30s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']
    scrape_interval: 30s

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
    scrape_interval: 30s

  - job_name: 'autoscaler'
    static_configs:
      - targets: ['autoscaler:3002']
    metrics_path: '/metrics'
    scrape_interval: 15s
EOF
        log_success "Prometheus configuration created"
    fi
    
    # Create Grafana datasource configuration
    if [ ! -f "$MONITORING_DIR/grafana/datasources/prometheus.yml" ]; then
        cat > "$MONITORING_DIR/grafana/datasources/prometheus.yml" << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
EOF
        log_success "Grafana datasource configuration created"
    fi
    
    log_success "Directory setup completed"
}

# Build images
build_images() {
    log_info "Building Docker images..."
    
    cd "$PROJECT_ROOT"
    
    # Build images with production optimizations
    docker compose -f "$COMPOSE_FILE" build --no-cache --parallel
    
    log_success "Docker images built successfully"
}

# Deploy services
deploy_services() {
    log_info "Deploying services..."
    
    cd "$PROJECT_ROOT"
    
    # Deploy the stack
    docker compose -f "$COMPOSE_FILE" up -d --remove-orphans
    
    log_success "Services deployed successfully"
}

# Wait for services to be healthy
wait_for_services() {
    log_info "Waiting for services to become healthy..."
    
    local max_attempts=60
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        local healthy_services=0
        local total_services=0
        
        # Check each service health
        for service in api-1 api-2 api-3 frontend-1 frontend-2 nginx postgres redis prometheus grafana autoscaler; do
            total_services=$((total_services + 1))
            if docker compose -f "$COMPOSE_FILE" ps "$service" 2>/dev/null | grep -q "healthy\|Up"; then
                healthy_services=$((healthy_services + 1))
            fi
        done
        
        log_info "Healthy services: $healthy_services/$total_services"
        
        if [ $healthy_services -eq $total_services ]; then
            log_success "All services are healthy!"
            return 0
        fi
        
        attempt=$((attempt + 1))
        sleep 10
    done
    
    log_warning "Not all services became healthy within the timeout period"
    return 1
}

# Validate deployment
validate_deployment() {
    log_info "Validating deployment..."
    
    # Test frontend
    if curl -f -s http://localhost:80 > /dev/null; then
        log_success "Frontend is accessible"
    else
        log_error "Frontend is not accessible"
        return 1
    fi
    
    # Test API health
    if curl -f -s http://localhost:80/api/health > /dev/null; then
        log_success "API health endpoint is accessible"
    else
        log_error "API health endpoint is not accessible"
        return 1
    fi
    
    # Test Prometheus
    if curl -f -s http://localhost:9090/-/healthy > /dev/null; then
        log_success "Prometheus is healthy"
    else
        log_error "Prometheus is not healthy"
        return 1
    fi
    
    # Test Grafana
    if curl -f -s http://localhost:3001/api/health > /dev/null; then
        log_success "Grafana is healthy"
    else
        log_error "Grafana is not healthy"
        return 1
    fi
    
    log_success "Deployment validation completed successfully"
}

# Generate deployment report
generate_report() {
    log_info "Generating deployment report..."
    
    local report_file="$PROJECT_ROOT/deployment-report-$(date +%Y%m%d-%H%M%S).txt"
    
    cat > "$report_file" << EOF
# The New Fuse - Production Deployment Report
Generated: $(date)

## Service Status
$(docker compose -f "$COMPOSE_FILE" ps)

## Network Configuration
$(docker network ls | grep fuse)

## Volume Usage
$(docker volume ls | grep fuse)

## Resource Usage
$(docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}")

## Access URLs
- Frontend: http://localhost:80
- API: http://localhost:80/api
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin123)

## Load Balancing
- API instances: 3 (ports 3000, 3005, 3006)
- Frontend instances: 2 (ports 3000, 3007)
- Nginx load balancer: port 80/443

## Monitoring
- Prometheus metrics collection: Active
- Grafana dashboards: Available
- Autoscaler: Active (scale 2-10 replicas)

## Security Features
- Enhanced Nginx configuration with security headers
- Rate limiting and connection limits
- SSL/TLS ready (certificates needed for production)
- Network segmentation (frontend/backend/monitoring)

## Next Steps
1. Configure SSL certificates for HTTPS
2. Set up external monitoring alerts
3. Configure backup strategies
4. Implement log aggregation
5. Set up CI/CD pipeline integration
EOF
    
    log_success "Deployment report generated: $report_file"
    cat "$report_file"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up..."
    # Add any cleanup tasks here
}

# Main deployment function
main() {
    log_info "Starting enhanced production deployment..."
    
    # Set trap for cleanup
    trap cleanup EXIT
    
    # Execute deployment steps
    check_prerequisites
    setup_directories
    build_images
    deploy_services
    wait_for_services
    validate_deployment
    generate_report
    
    log_success "Enhanced production deployment completed successfully!"
    log_info "Access your application at: http://localhost:80"
    log_info "Monitor with Grafana at: http://localhost:3001 (admin/admin123)"
    log_info "View metrics with Prometheus at: http://localhost:9090"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "stop")
        log_info "Stopping production services..."
        docker compose -f "$COMPOSE_FILE" down
        log_success "Production services stopped"
        ;;
    "restart")
        log_info "Restarting production services..."
        docker compose -f "$COMPOSE_FILE" down
        main
        ;;
    "logs")
        docker compose -f "$COMPOSE_FILE" logs -f "${2:-}"
        ;;
    "status")
        docker compose -f "$COMPOSE_FILE" ps
        ;;
    *)
        echo "Usage: $0 {deploy|stop|restart|logs [service]|status}"
        exit 1
        ;;
esac