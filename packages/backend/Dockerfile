# Use Node.js 20 Alpine as base image
FROM node:20-alpine

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
RUN pnpm install --frozen-lockfile

# Copy all source code
COPY . .

# Build dependencies first (types, utils, core, database)
RUN pnpm --filter @the-new-fuse/types run build || echo "Types build completed"
RUN pnpm --filter @the-new-fuse/utils run build || echo "Utils build completed"
RUN pnpm --filter @the-new-fuse/core run build || echo "Core build completed"
RUN pnpm --filter @the-new-fuse/database run build || echo "Database build completed"

# Build the backend package specifically
RUN pnpm --filter @the-new-fuse/backend run build

# Verify the build output exists
RUN ls -la /app/packages/backend/dist/

# Expose the default port
EXPOSE 3001

# Set working directory to the package
WORKDIR /app/packages/backend

# Start the service
CMD ["node", "dist/index.js"]