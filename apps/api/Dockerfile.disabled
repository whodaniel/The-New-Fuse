FROM node:20-alpine
RUN npm install -g pnpm
WORKDIR /app

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy package.json files for workspace packages
COPY packages/types/package.json ./packages/types/
COPY packages/core/package.json ./packages/core/
COPY packages/database/package.json ./packages/database/
COPY packages/utils/package.json ./packages/utils/
COPY packages/shared/package.json ./packages/shared/
COPY packages/security/package.json ./packages/security/
COPY packages/port-management/package.json ./packages/port-management/
COPY packages/api-types/package.json ./packages/api-types/
COPY packages/a2a-core/package.json ./packages/a2a-core/
COPY tnf-relay-package/package.json ./tnf-relay-package/
COPY apps/api/package.json ./apps/api/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code for packages and app
COPY packages/types ./packages/types
COPY packages/core ./packages/core
COPY packages/database ./packages/database
COPY packages/utils ./packages/utils
COPY packages/shared ./packages/shared
COPY packages/security ./packages/security
COPY packages/port-management ./packages/port-management
COPY packages/api-types ./packages/api-types
COPY packages/a2a-core ./packages/a2a-core
COPY tnf-relay-package ./tnf-relay-package
COPY apps/api ./apps/api

# Build packages first
RUN cd packages/types && pnpm run build || true
RUN cd packages/core && pnpm run build || true
RUN cd packages/database && pnpm run build || true
RUN cd packages/utils && pnpm run build || true
RUN cd packages/shared && pnpm run build || true
RUN cd packages/security && pnpm run build || true
RUN cd packages/port-management && pnpm run build || true
RUN cd packages/api-types && pnpm run build || true
RUN cd packages/a2a-core && pnpm run build || true
RUN cd tnf-relay-package && pnpm run build || true

# Build the api app
WORKDIR /app/apps/api
RUN pnpm run build

EXPOSE 3000
CMD ["node", "dist/src/index.js"]
