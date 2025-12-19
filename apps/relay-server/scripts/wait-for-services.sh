#!/bin/bash
set -e

wait_for_port() {
    local host="$1"
    local port="$2"
    local service="$3"
    local timeout=30

    echo "Waiting for $service to be ready..."
    while ! nc -z "$host" "$port"; do
        if [ "$timeout" -le 0 ]; then
            echo "Timeout waiting for $service to be ready"
            exit 1
        fi
        timeout=$((timeout-1))
        sleep 1
    done
    echo "$service is ready!"
}

wait_for_port "localhost" 5432 "PostgreSQL"
wait_for_port "localhost" 6379 "Redis"
wait_for_port "localhost" 9000 "MinIO" || true
wait_for_port "localhost" 1025 "MailHog" || true