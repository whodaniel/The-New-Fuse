# Stage 1: Builder
FROM node:18-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Install pnpm
RUN npm install -g pnpm

# Note: The build context is set to the project root in compose.yaml
# So we don't need to use ../../ path prefixes

# Copy root package files for better caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy all workspace package.json files
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/core/package.json ./packages/core/
COPY packages/api/package.json ./packages/api/
COPY packages/api-types/package.json ./packages/api-types/
COPY packages/features/package.json ./packages/features/
COPY packages/shared/package.json ./packages/shared/
COPY apps/frontend/package.json ./apps/frontend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files for all packages
COPY packages/types ./packages/types
COPY packages/utils ./packages/utils
COPY packages/core ./packages/core
COPY packages/database ./packages/database
COPY packages/api ./packages/api
COPY packages/api-types ./packages/api-types
COPY packages/features ./packages/features
COPY packages/shared ./packages/shared
COPY packages/feature-suggestions ./packages/feature-suggestions
COPY packages/feature-tracker ./packages/feature-tracker
COPY apps/frontend ./apps/frontend

# Build packages in order
RUN pnpm --filter @the-new-fuse/types build && \
    pnpm --filter @the-new-fuse/api-types build && \
    pnpm --filter @the-new-fuse/utils build && \
    pnpm --filter @the-new-fuse/core build && \
    pnpm --filter @the-new-fuse/database build && \
    pnpm --filter @the-new-fuse/api build && \
    pnpm --filter @the-new-fuse/shared build && \
    pnpm --filter @the-new-fuse/features build && \
    pnpm --filter @the-new-fuse/feature-tracker build && \
    pnpm --filter @the-new-fuse/feature-suggestions build && \
    pnpm --filter @the-new-fuse/frontend build

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Install production dependencies only
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages/types/package.json ./packages/types/
COPY --from=builder /app/packages/api-types/package.json ./packages/api-types/
COPY --from=builder /app/packages/utils/package.json ./packages/utils/
COPY --from=builder /app/packages/core/package.json ./packages/core/
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/packages/api/package.json ./packages/api/
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/features/package.json ./packages/features/
COPY --from=builder /app/packages/feature-suggestions/package.json ./packages/feature-suggestions/
COPY --from=builder /app/packages/feature-tracker/package.json ./packages/feature-tracker/
COPY --from=builder /app/apps/frontend/package.json ./apps/frontend/

# Copy built files
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/packages/api-types/dist ./packages/api-types/dist
COPY --from=builder /app/packages/utils/dist ./packages/utils/dist
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/api/dist ./packages/api/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/features/dist ./packages/features/dist
COPY --from=builder /app/packages/feature-suggestions/dist ./packages/feature-suggestions/dist
COPY --from=builder /app/packages/feature-tracker/dist ./packages/feature-tracker/dist
COPY --from=builder /app/apps/frontend/dist ./apps/frontend/dist

# Install production dependencies
RUN pnpm --filter @the-new-fuse/frontend install --prod

# Expose port
EXPOSE 3000

# Start the server
CMD ["node", "apps/frontend/dist/main.js"]
