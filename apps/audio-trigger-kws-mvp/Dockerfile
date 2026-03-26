FROM node:20-alpine AS build
WORKDIR /app

COPY package.json tsconfig.json tsconfig.build.json ./
COPY src ./src

RUN npm install --include=dev --no-audit --no-fund
RUN npm run build
RUN npm prune --omit=dev

FROM node:20-alpine AS runtime
WORKDIR /app

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules

ENV NODE_ENV=production
ENV APP_HOST=0.0.0.0

EXPOSE 43110

CMD ["node", "dist/server.js"]
