FROM node:22-alpine AS base
RUN apk add --no-cache build-base cairo-dev jpeg-dev pango-dev giflib-dev pkgconfig
RUN npm install -g pnpm@10.20.0
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY .npmrc .pnpmrc* ./
RUN pnpm install --frozen-lockfile --ignore-scripts || pnpm install --no-frozen-lockfile --ignore-scripts

COPY . .

WORKDIR /app/apps/frontend
RUN pnpm run build

FROM node:22-alpine AS runner
WORKDIR /app
RUN npm install -g serve
COPY --from=base /app/apps/frontend/dist ./dist
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 frontend && \
    chown -R frontend:nodejs /app
USER frontend
EXPOSE 3000
ENV PORT=3000 NODE_ENV=production
CMD ["serve", "-s", "dist", "-l", "3000"]
