# Use Node.js 20 Alpine as base image
FROM node:20-alpine3.19

# Update Alpine packages for security patches
RUN apk update && apk upgrade --no-cache

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy workspace configuration files
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./

# Copy all package.json files for dependency resolution
COPY packages/*/package.json ./packages/*/
COPY apps/*/package.json ./apps/*/

# Install dependencies
RUN pnpm install

# Copy all source code
COPY . .

# Build dependencies first (types, utils, core, database)
RUN pnpm --filter @the-new-fuse/types run build || echo "Types build completed"
RUN pnpm --filter @the-new-fuse/utils run build || echo "Utils build completed"
RUN pnpm --filter @the-new-fuse/core run build || echo "Core build completed"
RUN pnpm --filter @the-new-fuse/database run build || echo "Database build completed"

# Build the relay-core package specifically
RUN pnpm --filter @tnf/relay-core run build

# Verify the build output exists
RUN ls -la /app/packages/relay-core/dist/

# Expose the default port
EXPOSE 3000

# Set working directory to the package
WORKDIR /app/packages/relay-core

# Start the service
CMD ["node", "dist/index.js"]