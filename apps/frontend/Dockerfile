FROM node:20-alpine AS base
RUN npm install -g pnpm
WORKDIR /app

FROM base AS deps
# Copy workspace files from project root (when deploying from frontend directory)
COPY ../../package.json ../../pnpm-lock.yaml ../../pnpm-workspace.yaml ./
# Copy frontend package.json
COPY package.json ./apps/frontend/
RUN pnpm install --frozen-lockfile --include=dev

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/frontend/node_modules ./apps/frontend/node_modules
# Copy all source files
COPY . .
RUN cd apps/frontend && pnpm run build

FROM nginx:alpine AS production
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html
COPY --from=builder /app/apps/frontend/nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
