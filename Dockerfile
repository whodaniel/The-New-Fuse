# Force rebuild Mon Mar 28 2026
# Dockerfile for TNF monorepo - handles both workspace packages and standalone apps

ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-alpine AS builder

# Declare build arguments
ARG SERVICE_PATH=apps/frontend
ARG PACKAGE_NAME=@the-new-fuse/frontend-app

RUN apk add --no-cache python3 make g++ pkgconfig pixman-dev cairo-dev pango-dev libjpeg-turbo-dev giflib-dev
RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.json tsconfig.base.json tsconfig.standard.json ./
COPY scripts turbo.json ./
COPY packages ./packages
COPY apps ./apps

RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter @the-new-fuse/types build || true

ENV NODE_ENV=production

# Generic build step for the target package
RUN echo "Building target package: ${PACKAGE_NAME} in ${SERVICE_PATH}..." && \
    pnpm --filter ${PACKAGE_NAME} build

FROM node:${NODE_VERSION}-alpine AS runner
# Re-declare ARG in the runner stage to use it in COPY
ARG SERVICE_PATH=apps/frontend
RUN npm install -g serve
WORKDIR /app
COPY --from=builder /app/${SERVICE_PATH}/dist ./dist
EXPOSE ${PORT:-3000}
CMD ["sh", "-c", "serve ./dist -p ${PORT:-3000} -s -n"]
