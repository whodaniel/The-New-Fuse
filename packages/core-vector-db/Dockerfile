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

# Build all workspace packages
RUN pnpm run build

# Build the core-vector-db package specifically
RUN pnpm --filter @the-new-fuse/core-vector-db run build

# Expose the default port (adjust if needed)
EXPOSE 50051

# Set working directory to the package
WORKDIR /app/packages/core-vector-db

# Start the service
CMD ["node", "dist/main.js"]