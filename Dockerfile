# Dockerfile for TNF monorepo - handles both workspace packages and standalone apps

ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-alpine AS builder

ARG SERVICE_PATH=apps/frontend

RUN apk add --no-cache python3 make g++ pkgconfig pixman-dev cairo-dev pango-dev libjpeg-turbo-dev giflib-dev
RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.json tsconfig.base.json tsconfig.standard.json ./
COPY scripts turbo.json ./
COPY packages ./packages
COPY apps ./apps

RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter @the-new-fuse/types build || true
RUN pnpm --filter "@the-new-fuse/*" build || true

ENV NODE_ENV=production

# Build based on SERVICE_PATH
RUN if [ "$SERVICE_PATH" = "apps/nexus-orchestrator" ]; then \
        cd /app/apps/nexus-orchestrator && pnpm build; \
    elif [ "$SERVICE_PATH" = "apps/frontend" ]; then \
        pnpm --filter @the-new-fuse/frontend build; \
    else \
        echo "Unknown SERVICE_PATH: $SERVICE_PATH" && exit 1; \
    fi

FROM node:${NODE_VERSION}-alpine AS runner
RUN npm install -g serve
WORKDIR /app
COPY --from=builder /app/${SERVICE_PATH}/dist ./dist
EXPOSE ${PORT:-3000}
CMD ["sh", "-c", "serve ./dist -p ${PORT:-3000} -s -n"]
