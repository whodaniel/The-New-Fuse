FROM node:18-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Install Firebase Tools globally and TypeScript
RUN npm install -g firebase-tools typescript

# Enable corepack for yarn version management
RUN corepack enable

# Copy package files first for better caching
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/core/package.json ./packages/core/
COPY packages/database/package.json ./packages/database/
COPY packages/feature-suggestions/package.json ./packages/feature-suggestions/
COPY packages/feature-tracker/package.json ./packages/feature-tracker/
COPY functions/package.json ./functions/

# Install dependencies
RUN yarn install

# Copy source code
COPY . .

# Build packages in order
RUN yarn workspace @the-new-fuse/types build && \
    yarn workspace @the-new-fuse/utils build && \
    yarn workspace @the-new-fuse/core build && \
    yarn workspace @the-new-fuse/database build && \
    yarn workspace @the-new-fuse/feature-tracker build && \
    yarn workspace @the-new-fuse/feature-suggestions build && \
    yarn workspace @the-new-fuse/functions build

# Start the Firebase Functions emulator
CMD ["yarn", "workspace", "@the-new-fuse/functions", "serve"]
