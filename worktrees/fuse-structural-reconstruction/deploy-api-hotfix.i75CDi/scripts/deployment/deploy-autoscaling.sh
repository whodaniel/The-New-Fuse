#!/bin/bash

# Deploy Auto-scaling Infrastructure for The New Fuse
# This script sets up auto-scaling mechanisms for both Docker Swarm and Kubernetes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_MODE=${1:-"docker"} # docker or kubernetes
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
AUTOSCALER_DIR="$PROJECT_ROOT/scripts/autoscaler"

echo -e "${BLUE}🚀 Deploying Auto-scaling Infrastructure${NC}"
echo -e "${BLUE}Mode: $DEPLOYMENT_MODE${NC}"
echo -e "${BLUE}Project Root: $PROJECT_ROOT${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for service to be ready
wait_for_service() {
    local service_name=$1
    local port=$2
    local max_attempts=30
    local attempt=1

    echo -e "${YELLOW}⏳ Waiting for $service_name to be ready on port $port...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "http://localhost:$port/health" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ $service_name is ready!${NC}"
            return 0
        fi
        
        echo -e "${YELLOW}Attempt $attempt/$max_attempts - $service_name not ready yet...${NC}"
        sleep 10
        ((attempt++))
    done
    
    echo -e "${RED}❌ $service_name failed to become ready after $max_attempts attempts${NC}"
    return 1
}

# Docker Swarm deployment
deploy_docker_swarm() {
    echo -e "${BLUE}🐳 Deploying with Docker Swarm${NC}"
    
    # Check if Docker is running
    if ! command_exists docker; then
        echo -e "${RED}❌ Docker is not installed${NC}"
        exit 1
    fi
    
    # Initialize Docker Swarm if not already initialized
    if ! docker info | grep -q "Swarm: active"; then
        echo -e "${YELLOW}🔧 Initializing Docker Swarm...${NC}"
        docker swarm init --advertise-addr 127.0.0.1 || true
    fi
    
    # Build autoscaler image
    echo -e "${YELLOW}🔨 Building autoscaler image...${NC}"
    cd "$PROJECT_ROOT"
    docker build -f scripts/autoscaler/Dockerfile -t fuse-autoscaler:latest .
    
    # Deploy the stack
    echo -e "${YELLOW}📦 Deploying autoscaling stack...${NC}"
    docker stack deploy -c scripts/deployment/docker-compose.simple.yml fuse-stack
    
    # Wait for services to be ready
    echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
    sleep 30
    
    # Check service status
    echo -e "${BLUE}📊 Service Status:${NC}"
    docker service ls
    
    echo -e "${GREEN}✅ Docker Swarm autoscaling deployment completed!${NC}"
    echo -e "${BLUE}📊 Access points:${NC}"
    echo -e "  - Grafana: http://localhost:3001"
    echo -e "  - Prometheus: http://localhost:9090"
    echo -e "  - Autoscaler Health: http://localhost:3000/health"
    echo -e "  - Autoscaler Metrics: http://localhost:3000/metrics"
}

# Kubernetes deployment
deploy_kubernetes() {
    echo -e "${BLUE}☸️  Deploying with Kubernetes${NC}"
    
    # Check if kubectl is available
    if ! command_exists kubectl; then
        echo -e "${RED}❌ kubectl is not installed${NC}"
        exit 1
    fi
    
    # Check if cluster is accessible
    if ! kubectl cluster-info >/dev/null 2>&1; then
        echo -e "${RED}❌ Kubernetes cluster is not accessible${NC}"
        exit 1
    fi
    
    # Apply namespace
    echo -e "${YELLOW}🔧 Creating namespace...${NC}"
    kubectl apply -f deploy/k8s/namespace.yaml
    
    # Apply HPA configurations
    echo -e "${YELLOW}📊 Applying Horizontal Pod Autoscalers...${NC}"
    kubectl apply -f deploy/k8s/hpa.yaml
    
    # Apply deployments
    echo -e "${YELLOW}📦 Applying deployments...${NC}"
    kubectl apply -f deploy/k8s/
    
    # Wait for deployments to be ready
    echo -e "${YELLOW}⏳ Waiting for deployments to be ready...${NC}"
    kubectl wait --for=condition=available --timeout=300s deployment --all -n production
    
    # Check HPA status
    echo -e "${BLUE}📊 HPA Status:${NC}"
    kubectl get hpa -n production
    
    # Check pod status
    echo -e "${BLUE}📊 Pod Status:${NC}"
    kubectl get pods -n production
    
    echo -e "${GREEN}✅ Kubernetes autoscaling deployment completed!${NC}"
}

# Validate deployment
validate_deployment() {
    echo -e "${BLUE}🔍 Validating deployment...${NC}"
    
    if [ "$DEPLOYMENT_MODE" = "docker" ]; then
        # Check Docker services
        if docker service ls | grep -q "fuse-stack"; then
            echo -e "${GREEN}✅ Docker services are running${NC}"
        else
            echo -e "${RED}❌ Docker services are not running${NC}"
            return 1
        fi
        
        # Test autoscaler health
        if wait_for_service "autoscaler" "3000"; then
            echo -e "${GREEN}✅ Autoscaler is healthy${NC}"
        else
            echo -e "${RED}❌ Autoscaler health check failed${NC}"
            return 1
        fi
        
    elif [ "$DEPLOYMENT_MODE" = "kubernetes" ]; then
        # Check HPA
        if kubectl get hpa -n production >/dev/null 2>&1; then
            echo -e "${GREEN}✅ HPA is configured${NC}"
        else
            echo -e "${RED}❌ HPA is not configured${NC}"
            return 1
        fi
        
        # Check deployments
        if kubectl get deployments -n production | grep -q "fuse"; then
            echo -e "${GREEN}✅ Deployments are running${NC}"
        else
            echo -e "${RED}❌ Deployments are not running${NC}"
            return 1
        fi
    fi
    
    echo -e "${GREEN}✅ Deployment validation completed successfully!${NC}"
}

# Main deployment logic
main() {
    case $DEPLOYMENT_MODE in
        "docker")
            deploy_docker_swarm
            ;;
        "kubernetes")
            deploy_kubernetes
            ;;
        *)
            echo -e "${RED}❌ Invalid deployment mode: $DEPLOYMENT_MODE${NC}"
            echo -e "${BLUE}Usage: $0 [docker|kubernetes]${NC}"
            exit 1
            ;;
    esac
    
    validate_deployment
    
    echo -e "${GREEN}🎉 Auto-scaling infrastructure deployment completed successfully!${NC}"
    echo -e "${BLUE}💡 Next steps:${NC}"
    echo -e "  1. Monitor scaling behavior in Grafana"
    echo -e "  2. Adjust scaling thresholds if needed"
    echo -e "  3. Run load tests to validate auto-scaling"
    echo -e "  4. Check logs for any scaling events"
}

# Run main function
main "$@"