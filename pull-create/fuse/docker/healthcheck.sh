#!/bin/bash

# API health check
curl --fail http://localhost:3001/health || exit 1

# Frontend health check
curl --fail http://localhost:3000/health.html || exit 1

# Database health check
pg_isready -h localhost -p 5432 || exit 1

# Redis health check
redis-cli ping || exit 1