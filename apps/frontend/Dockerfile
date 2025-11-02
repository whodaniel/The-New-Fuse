FROM node:20-alpine3.19 AS base

# Update Alpine packages for security patches
RUN apk update && apk upgrade --no-cache

RUN npm install -g pnpm
WORKDIR /app

FROM base AS deps
# Copy frontend package.json and install dependencies
COPY package.json ./
# Copy pnpm-lock.yaml from root if it exists
COPY ../pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --include=dev

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
# Copy all source files
COPY . .
RUN pnpm run build

FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
