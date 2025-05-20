# syntax=docker/dockerfile:1

ARG NODE_VERSION=18.20.2
ARG YARN_VERSION=3.6.0

# ----------- Base image -----------
FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /app

# ----------- Builder stage -----------
FROM base AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Enable and prepare Yarn
RUN corepack enable && corepack prepare yarn@${YARN_VERSION} --activate

# Copy only the files needed for dependency installation and build (for better cache usage)
COPY --link package.json yarn.lock .yarnrc.yml ./
COPY --link .yarn ./
COPY --link tsconfig.base.json ./
COPY --link apps/api/package.json ./apps/api/
COPY --link apps/api/tsconfig.json ./apps/api/

# Copy workspace package.json files (for monorepo workspaces)
COPY --link packages/*/package.json ./packages/
COPY --link apps/*/package.json ./apps/

# Install dependencies (including workspaces)
ENV YARN_CACHE_FOLDER=/usr/local/share/.cache/yarn
RUN --mount=type=cache,target=${YARN_CACHE_FOLDER} \
    yarn install --frozen-lockfile --immutable

# Copy the rest of the source code (for build)
COPY --link packages ./packages
COPY --link apps ./apps

# Build the API (and its dependencies)
RUN yarn workspace @the-new-fuse/api build

# ----------- Production image -----------
FROM node:${NODE_VERSION}-alpine AS final
WORKDIR /app

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only the built output and production dependencies
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./package.json

# Set secure environment defaults
ENV NODE_ENV=production
ENV NODE_TLS_REJECT_UNAUTHORIZED=1
ENV NODE_OPTIONS="--max-old-space-size=4096"

USER appuser

EXPOSE 3001

CMD ["node", "dist/main.js"]
