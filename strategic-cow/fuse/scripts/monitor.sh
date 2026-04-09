#!/bin/bash

# Set color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
WATCH_MODE=false
INTERVAL=5
DOCKER_CHECK=true
LOG_FILE="process_monitor.log"

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --watch) WATCH_MODE=true ;;
        --interval=*) INTERVAL="${1#*=}" ;;
        --no-docker) DOCKER_CHECK=false ;;
        --log=*) LOG_FILE="${1#*=}" ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

# Function to check Node.js processes
check_node_processes() {
    echo -e "\n${BLUE}Node.js Processes:${NC}"
    ps aux | grep -v grep | grep -E "node|npm|yarn" || echo "No Node.js processes running"
}

# Function to check development servers
check_dev_servers() {
    echo -e "\n${BLUE}Development Servers:${NC}"
    local dev_servers=0
    
    # Check Vite dev server
    if pgrep -f "vite.*dev" > /dev/null; then
        echo -e "${GREEN}✓ Vite dev server is running${NC}"
        ((dev_servers++))
    else
        echo -e "${RED}✗ Vite dev server is not running${NC}"
    fi
    
    # Check Webpack dev server
    if pgrep -f "webpack.*dev" > /dev/null; then
        echo -e "${GREEN}✓ Webpack dev server is running${NC}"
        ((dev_servers++))
    else
        echo -e "${RED}✗ Webpack dev server is not running${NC}"
    fi
    
    return $dev_servers
}

# Function to check Docker status
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "\n${RED}Docker is not installed${NC}"
        return 1
    fi
    
    echo -e "\n${BLUE}Docker Status:${NC}"
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        echo -e "${RED}✗ Docker daemon is not running${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✓ Docker daemon is running${NC}"
    
    # List running containers
    echo -e "\n${BLUE}Running Containers:${NC}"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || true
    
    # Check container health
    echo -e "\n${BLUE}Container Health:${NC}"
    docker ps -a --format "{{.Names}}" | while read -r container; do
        health=$(docker inspect --format "{{.State.Health.Status}}" "$container" 2>/dev/null)
        status=$(docker inspect --format "{{.State.Status}}" "$container" 2>/dev/null)
        if [ -n "$health" ]; then
            echo -e "Container $container: ${GREEN}$health${NC}"
        else
            echo -e "Container $container: ${YELLOW}$status${NC}"
        fi
    done
}

# Function to check disk space
check_disk_space() {
    echo -e "\n${BLUE}Disk Space:${NC}"
    df -h . | tail -n 1 | awk '{print $5 " used (" $3 " of " $2 ")"}'
}

# Function to check memory usage
check_memory() {
    echo -e "\n${BLUE}Memory Usage:${NC}"
    free -h | awk 'NR==2{printf "Memory: %s/%s used (%s free)\n", $3,$2,$4}'
}

# Main monitoring function
do_monitor() {
    clear
    echo -e "${GREEN}Project State Monitor${NC} (Press Ctrl+C to exit)"
    echo "Last update: $(date '+%Y-%m-%d %H:%M:%S')"
    
    check_node_processes
    check_dev_servers
    [ "$DOCKER_CHECK" = true ] && check_docker
    check_disk_space
    check_memory
    
    # Log state if file is specified
    if [ -n "$LOG_FILE" ]; then
        {
            echo "=== State at $(date '+%Y-%m-%d %H:%M:%S') ==="
            check_node_processes
            check_dev_servers
            [ "$DOCKER_CHECK" = true ] && check_docker
            check_disk_space
            check_memory
            echo "======================================="
        } >> "$LOG_FILE"
    fi
}

# Main execution
if [ "$WATCH_MODE" = true ]; then
    while true; do
        do_monitor
        sleep "$INTERVAL"
    done
else
    do_monitor
fi