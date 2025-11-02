#!/bin/bash

# Deploy Monitoring Stack for The New Fuse
# This script deploys the complete monitoring infrastructure including:
# - Prometheus for metrics collection
# - Grafana for visualization
# - Alertmanager for alert handling
# - Jaeger for distributed tracing
# - Elasticsearch for trace storage

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="scripts/deployment/docker-compose.optimized.yml"
PROJECT_NAME="the-new-fuse-monitoring"
TIMEOUT=300

echo -e "${BLUE}🚀 Starting The New Fuse Monitoring Stack Deployment${NC}"
echo "=================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Check if docker-compose file exists
if [ ! -f "$COMPOSE_FILE" ]; then
    echo -e "${RED}❌ Docker Compose file '$COMPOSE_FILE' not found.${NC}"
    exit 1
fi

# Create necessary directories
echo -e "${YELLOW}📁 Creating necessary directories...${NC}"
mkdir -p ../../config/monitoring
mkdir -p ../../data/prometheus
mkdir -p ../../data/grafana
mkdir -p ../../data/alertmanager
mkdir -p ../../data/elasticsearch
mkdir -p ../../logs

# Set proper permissions
echo -e "${YELLOW}🔐 Setting proper permissions...${NC}"
sudo chown -R 472:472 ../../data/grafana 2>/dev/null || true
sudo chown -R 1000:1000 ../../data/elasticsearch 2>/dev/null || true
sudo chown -R 65534:65534 ../../data/prometheus 2>/dev/null || true
sudo chown -R 65534:65534 ../../data/alertmanager 2>/dev/null || true

# Stop any existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down --remove-orphans 2>/dev/null || true

# Pull latest images
echo -e "${YELLOW}📥 Pulling latest Docker images...${NC}"
docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" pull

# Start infrastructure services first (databases, message queues)
echo -e "${YELLOW}🗄️ Starting infrastructure services...${NC}"
docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d postgres redis

# Wait for infrastructure services to be healthy
echo -e "${YELLOW}⏳ Waiting for infrastructure services to be ready...${NC}"
timeout=$TIMEOUT
while [ $timeout -gt 0 ]; do
    if docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps | grep -E "(postgres|redis)" | grep -q "healthy\|Up"; then
        echo -e "${GREEN}✅ Infrastructure services are ready${NC}"
        break
    fi
    sleep 5
    timeout=$((timeout - 5))
    echo -n "."
done

if [ $timeout -le 0 ]; then
    echo -e "${RED}❌ Infrastructure services failed to start within timeout${NC}"
    exit 1
fi

# Start Elasticsearch first (needed by Jaeger)
echo -e "${YELLOW}🔍 Starting Elasticsearch...${NC}"
docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d elasticsearch

# Wait for Elasticsearch to be ready
echo -e "${YELLOW}⏳ Waiting for Elasticsearch to be ready...${NC}"
timeout=$TIMEOUT
while [ $timeout -gt 0 ]; do
    if curl -s http://localhost:9200/_cluster/health | grep -q '"status":"green\|yellow"'; then
        echo -e "${GREEN}✅ Elasticsearch is ready${NC}"
        break
    fi
    sleep 10
    timeout=$((timeout - 10))
    echo -n "."
done

if [ $timeout -le 0 ]; then
    echo -e "${RED}❌ Elasticsearch failed to start within timeout${NC}"
    exit 1
fi

# Start monitoring services
echo -e "${YELLOW}📊 Starting monitoring services...${NC}"
docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d prometheus grafana alertmanager

# Start Jaeger services
echo -e "${YELLOW}🔍 Starting Jaeger tracing services...${NC}"
docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d jaeger-collector jaeger-query jaeger-agent

# Start application services
echo -e "${YELLOW}🚀 Starting application services...${NC}"
docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d api-1 api-2 frontend nginx

# Start additional monitoring components
echo -e "${YELLOW}📈 Starting additional monitoring components...${NC}"
docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d node-exporter cadvisor fluentd

# Wait for all services to be healthy
echo -e "${YELLOW}⏳ Waiting for all services to be ready...${NC}"
sleep 30

# Health check function
check_service() {
    local service_name=$1
    local url=$2
    local expected_status=${3:-200}
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_status"; then
        echo -e "${GREEN}✅ $service_name is healthy${NC}"
        return 0
    else
        echo -e "${RED}❌ $service_name is not responding${NC}"
        return 1
    fi
}

# Perform health checks
echo -e "${BLUE}🏥 Performing health checks...${NC}"
echo "================================"

health_check_failed=false

# Check Prometheus
if ! check_service "Prometheus" "http://localhost:9090/-/healthy"; then
    health_check_failed=true
fi

# Check Grafana
if ! check_service "Grafana" "http://localhost:3000/api/health"; then
    health_check_failed=true
fi

# Check Alertmanager
if ! check_service "Alertmanager" "http://localhost:9093/-/healthy"; then
    health_check_failed=true
fi

# Check Jaeger Query
if ! check_service "Jaeger Query" "http://localhost:16686/"; then
    health_check_failed=true
fi

# Check Elasticsearch
if ! check_service "Elasticsearch" "http://localhost:9200/_cluster/health"; then
    health_check_failed=true
fi

# Check Node Exporter
if ! check_service "Node Exporter" "http://localhost:9100/metrics"; then
    health_check_failed=true
fi

# Check cAdvisor
if ! check_service "cAdvisor" "http://localhost:8080/healthz"; then
    health_check_failed=true
fi

# Display service URLs
echo -e "${BLUE}🌐 Service URLs:${NC}"
echo "================"
echo -e "${GREEN}Grafana Dashboard:${NC} http://localhost:3000 (admin/admin)"
echo -e "${GREEN}Prometheus:${NC} http://localhost:9090"
echo -e "${GREEN}Alertmanager:${NC} http://localhost:9093"
echo -e "${GREEN}Jaeger UI:${NC} http://localhost:16686"
echo -e "${GREEN}Elasticsearch:${NC} http://localhost:9200"
echo -e "${GREEN}Node Exporter:${NC} http://localhost:9100"
echo -e "${GREEN}cAdvisor:${NC} http://localhost:8080"

# Display container status
echo -e "${BLUE}📋 Container Status:${NC}"
echo "==================="
docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps

if [ "$health_check_failed" = true ]; then
    echo -e "${YELLOW}⚠️ Some services failed health checks. Check the logs for more details:${NC}"
    echo "docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME logs [service_name]"
    exit 1
else
    echo -e "${GREEN}🎉 Monitoring stack deployed successfully!${NC}"
    echo -e "${GREEN}All services are healthy and ready to use.${NC}"
fi

# Display next steps
echo -e "${BLUE}📝 Next Steps:${NC}"
echo "=============="
echo "1. Access Grafana at http://localhost:3000 (admin/admin)"
echo "2. Import pre-configured dashboards"
echo "3. Configure alert notification channels in Alertmanager"
echo "4. Start sending traces to Jaeger at http://localhost:14268/api/traces"
echo "5. Monitor system metrics in Prometheus at http://localhost:9090"

echo -e "${GREEN}✨ Deployment completed successfully!${NC}"