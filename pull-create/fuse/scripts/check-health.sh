#!/bin/bash
set -e

TIMEOUT=120
ELAPSED=0
SLEEP_INTERVAL=5

check_postgres() {
  until pg_isready -h postgres -p 5432 -U app -d the_new_fuse; do
    echo "Waiting for PostgreSQL..."
    sleep ${SLEEP_INTERVAL}
    ELAPSED=$((ELAPSED+SLEEP_INTERVAL))
    
    if [ ${ELAPSED} -ge ${TIMEOUT} ]; then
      echo "PostgreSQL health check timed out!"
      exit 1
    fi
  done
}

check_redis() {
  until redis-cli -h redis -p 6379 ping | grep -q PONG; do
    echo "Waiting for Redis..."
    sleep ${SLEEP_INTERVAL}
    ELAPSED=$((ELAPSED+SLEEP_INTERVAL))
    
    if [ ${ELAPSED} -ge ${TIMEOUT} ]; then
      echo "Redis health check timed out!"
      exit 1
    fi
  done
}

check_api() {
  until curl -fs http://localhost:3000/health | grep -q '"status":"healthy"'; do
    echo "Waiting for API..."
    sleep ${SLEEP_INTERVAL}
    ELAPSED=$((ELAPSED+SLEEP_INTERVAL))
    
    if [ ${ELAPSED} -ge ${TIMEOUT} ]; then
      echo "API health check timed out!"
      exit 1
    fi
  done
}

check_postgres
check_redis
check_api

echo "✅ All services are healthy!"