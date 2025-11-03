# Build stage
FROM oven/bun:1 as builder

WORKDIR /app

# Copy root package files
COPY package.json bun.lockb ./

# Copy package.json files from all workspaces
COPY apps/client/package.json ./apps/client/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/ui/package.json ./packages/ui/

# Install dependencies
RUN pnpm install

# Copy source files
COPY . .

# Build packages
RUN cd packages/types && pnpm run build && cd ../..
RUN cd packages/utils && pnpm run build && cd ../..
RUN cd packages/ui && pnpm run build && cd ../..
RUN cd apps/client && pnpm run build && cd ../..

# Production stage
FROM nginx:alpine

# Copy the built files
COPY --from=builder /app/apps/client/dist /usr/share/nginx/html

# Copy nginx configuration if you have any custom config
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]