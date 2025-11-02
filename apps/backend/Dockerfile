FROM node:20-alpine3.19

# Update Alpine packages for security patches
RUN apk update && apk upgrade --no-cache

RUN npm install -g pnpm
WORKDIR /app

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy package.json files for workspace packages
COPY packages/types/package.json ./packages/types/
COPY packages/core/package.json ./packages/core/
COPY packages/database/package.json ./packages/database/
COPY packages/utils/package.json ./packages/utils/
COPY apps/backend/package.json ./apps/backend/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code for packages and app
COPY packages/types ./packages/types
COPY packages/core ./packages/core
COPY packages/database ./packages/database
COPY packages/utils ./packages/utils
COPY apps/backend ./apps/backend

# Build packages first
RUN cd packages/types && pnpm run build || true
RUN cd packages/core && pnpm run build || true
RUN cd packages/database && pnpm run build || true
RUN cd packages/utils && pnpm run build || true

# Build the backend app
WORKDIR /app/apps/backend
RUN pnpm run build

EXPOSE 3001
CMD ["node", "dist/main.js"]
