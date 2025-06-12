FROM oven/bun:1

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y python3 make g++

# Install Firebase Tools globally and TypeScript
RUN npm install -g firebase-tools typescript

# Copy package files first for better caching
COPY package.json bun.lockb ./
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/core/package.json ./packages/core/
COPY packages/database/package.json ./packages/database/
COPY packages/feature-suggestions/package.json ./packages/feature-suggestions/
COPY packages/feature-tracker/package.json ./packages/feature-tracker/
COPY functions/package.json ./functions/

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Build packages in order
RUN cd packages/types && bun run build && cd ../.. && \
    cd packages/utils && bun run build && cd ../.. && \
    cd packages/core && bun run build && cd ../.. && \
    cd packages/database && bun run build && cd ../.. && \
    cd packages/feature-tracker && bun run build && cd ../.. && \
    cd packages/feature-suggestions && bun run build && cd ../.. && \
    cd functions && bun run build && cd ..

# Start the Firebase Functions emulator
CMD ["cd", "functions", "&&", "bun", "run", "serve"]
