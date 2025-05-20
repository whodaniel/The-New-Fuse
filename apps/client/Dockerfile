# Build stage
FROM node:18-alpine as builder

WORKDIR /app

# Copy root package files
COPY package.json yarn.lock ./

# Copy package.json files from all workspaces
COPY apps/client/package.json ./apps/client/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/ui/package.json ./packages/ui/

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source files
COPY . .

# Build packages
RUN yarn workspace @the-new-fuse/types build
RUN yarn workspace @the-new-fuse/utils build
RUN yarn workspace @the-new-fuse/ui build
RUN yarn workspace @the-new-fuse/client build

# Production stage
FROM nginx:alpine

# Copy the built files
COPY --from=builder /app/apps/client/dist /usr/share/nginx/html

# Copy nginx configuration if you have any custom config
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]