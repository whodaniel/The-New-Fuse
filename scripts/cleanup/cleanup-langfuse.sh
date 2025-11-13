#!/bin/bash

echo "🧹 Cleaning up Langfuse Docker resources..."

# Stop and remove Langfuse Docker containers
echo "Stopping and removing Langfuse Docker containers..."
docker stop langfuse-postgres-1 langfuse-langfuse-web-1 langfuse-langfuse-worker-1 langfuse-redis-1 langfuse-clickhouse-1 langfuse-minio-1
docker rm langfuse-postgres-1 langfuse-langfuse-web-1 langfuse-langfuse-worker-1 langfuse-redis-1 langfuse-clickhouse-1 langfuse-minio-1

# Remove Langfuse Docker volumes
echo "Removing Langfuse Docker volumes..."
docker volume rm langfuse_langfuse_clickhouse_data langfuse_langfuse_clickhouse_logs langfuse_langfuse_minio_data langfuse_langfuse_postgres_data

# Remove Langfuse Docker network
echo "Removing Langfuse Docker network..."
docker network rm langfuse_default

# Remove Langfuse Docker images
echo "Removing Langfuse Docker images..."
docker rmi langfuse/langfuse:3 langfuse/langfuse-worker:3

# Check for any remaining Langfuse-related Docker resources
echo "Checking for any remaining Langfuse Docker resources..."
echo "Docker containers:"
docker ps -a | grep -i langfuse
echo "Docker images:"
docker images | grep -i langfuse
echo "Docker volumes:"
docker volume ls | grep -i langfuse
echo "Docker networks:"
docker network ls | grep -i langfuse

echo "✅ Langfuse cleanup completed."
