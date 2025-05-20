# Base stage with common configuration
FROM node:20-bullseye-slim AS base
WORKDIR /app
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

# Development stage
FROM base AS dev
# Dev-specific configuration

# Production stage
FROM base AS prod
# Production-specific configuration