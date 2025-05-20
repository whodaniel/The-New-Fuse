# Base development image with common dependencies
FROM node:20-bullseye-slim AS base

WORKDIR /app

# Common build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Setup yarn
RUN corepack enable && \
    yarn set version berry && \
    yarn config set nodeLinker node-modules

# Development stage
FROM base AS dev
CMD ["yarn", "dev"]

# Builder stage
FROM base AS builder
CMD ["yarn", "build"]

# Production stage
FROM base AS prod
CMD ["yarn", "start"]