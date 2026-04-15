#!/bin/bash
set -e

check_service() {
    local host=$1
    local port=$2
    local service=$3
    local max_attempts=30
    local attempt=1

    echo "Waiting for $service to be ready..."
    while ! nc -z $host $port; do
        if [ $attempt -eq $max_attempts ]; then
            echo "❌ $service failed to start after $max_attempts attempts"
            return 1
        fi
        sleep 1
        ((attempt++))
    done
    echo "$service is ready!"
    return 0
}

# Check all services
check_service localhost 5432 "PostgreSQL"
check_service localhost 6379 "Redis"
check_service localhost 9000 "MinIO"
check_service localhost 1025 "MailHog"

echo "✅ All services are ready!"