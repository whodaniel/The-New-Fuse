FROM node:20-alpine
RUN npm install -g pnpm
WORKDIR /app

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy package.json files for workspace packages
COPY packages/types/package.json ./packages/types/
COPY packages/core/package.json ./packages/core/
COPY apps/api-gateway/package.json ./apps/api-gateway/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code for packages and app
COPY packages/types ./packages/types
COPY packages/core ./packages/core
COPY apps/api-gateway ./apps/api-gateway

# Build packages first
RUN cd packages/types && pnpm run build || true
RUN cd packages/core && pnpm run build || true

# Build the api-gateway app
WORKDIR /app/apps/api-gateway
RUN pnpm run build

EXPOSE 3002
CMD ["node", "dist/main.js"]
