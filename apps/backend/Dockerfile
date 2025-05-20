# Start from the official Node.js LTS image
FROM node:20-alpine as builder

# Set working directory
WORKDIR /app

# Copy root package files for dependency install
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

# Copy all workspace package.json files
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/core/package.json ./packages/core/
COPY packages/api/package.json ./packages/api/
COPY packages/api-types/package.json ./packages/api-types/
COPY packages/features/package.json ./packages/features/
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/

# Install dependencies
RUN corepack enable
RUN yarn install --immutable

# Copy source files for all required packages
COPY ../../packages/types ./packages/types
COPY ../../packages/utils ./packages/utils
COPY ../../packages/core ./packages/core
COPY ../../packages/api ./packages/api
COPY ../../packages/api-types ./packages/api-types
COPY ../../packages/features ./packages/features
COPY ../../packages/shared ./packages/shared
COPY ../../apps/backend/src ./apps/backend/src
COPY ../../apps/backend/tsconfig.json ./apps/backend/tsconfig.json

# Build the backend app (outputs to dist/)
WORKDIR /app/apps/backend
RUN yarn build

# --- Production image ---
FROM node:20-alpine
WORKDIR /app

# Copy only built app and node_modules from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json .

# Expose backend port
EXPOSE 3000

# Start the app
CMD ["node", "dist/main"]
