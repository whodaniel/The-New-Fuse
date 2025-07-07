#!/bin/bash

# Update Docker and CI files to use Bun instead of Yarn
echo "🐳 Updating Docker and CI files to use Bun..."

# Update Docker files
echo "📦 Updating Dockerfiles..."

# Update docker/Dockerfile.api
cat > docker/Dockerfile.api << 'EOF'
FROM oven/bun:latest AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./
COPY packages ./packages
COPY apps ./apps

# Install dependencies and build
RUN bun install
RUN bun run build

FROM node:20-bullseye-slim

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/bun.lockb ./

# Install production dependencies with Bun
COPY --from=oven/bun:latest /usr/local/bin/bun /usr/local/bin/bun
RUN bun install --production

EXPOSE 3001
CMD ["node", "dist/main.js"]
EOF

# Update docker/Dockerfile.frontend
cat > docker/Dockerfile.frontend << 'EOF'
FROM oven/bun:latest AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./
COPY packages ./packages
COPY apps ./apps

# Install dependencies and build
RUN bun install
RUN bun run build:frontend

FROM nginx:alpine

# Copy built frontend
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Copy nginx config
COPY docker/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF

# Update docker/Dockerfile.base
cat > docker/Dockerfile.base << 'EOF'
FROM oven/bun:latest

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install

CMD ["bun", "run", "dev"]
EOF

echo "✅ Docker files updated!"

# Update CI files
echo "🔄 Updating CI/CD workflows..."

# Update main CI file (.github/workflows/ci.yml)
if [ -f ".github/workflows/ci.yml" ]; then
    sed -i.bak 's/uses: actions\/setup-node@v[0-9]*/uses: oven-sh\/setup-bun@v1/g' .github/workflows/ci.yml
    sed -i.bak 's/node-version:/bun-version:/g' .github/workflows/ci.yml
    sed -i.bak 's/bun install/bun install/g' .github/workflows/ci.yml
    sed -i.bak 's/bun run build/bun run build/g' .github/workflows/ci.yml
    sed -i.bak 's/bun run test/bun run test/g' .github/workflows/ci.yml
    sed -i.bak 's/bun run lint/bun run lint/g' .github/workflows/ci.yml
    sed -i.bak 's/cache: "bun"/cache: "bun"/g' .github/workflows/ci.yml
    rm -f .github/workflows/ci.yml.bak
fi

# Update other CI files
for file in .github/workflows/*.yml .github/workflows/*.yaml; do
    if [ -f "$file" ] && [ "$file" != ".github/workflows/ci.yml" ]; then
        sed -i.bak 's/uses: actions\/setup-node@v[0-9]*/uses: oven-sh\/setup-bun@v1/g' "$file"
        sed -i.bak 's/node-version:/bun-version:/g' "$file"
        sed -i.bak 's/bun install/bun install/g' "$file"
        sed -i.bak 's/bun run build/bun run build/g' "$file"
        sed -i.bak 's/bun run test/bun run test/g' "$file"
        sed -i.bak 's/bun run lint/bun run lint/g' "$file"
        sed -i.bak 's/cache: "bun"/cache: "bun"/g' "$file"
        rm -f "${file}.bak" 2>/dev/null
    fi
done

echo "✅ CI/CD workflows updated!"

# Update docker-compose files to reference new lockfile
echo "🐋 Updating docker-compose files..."
for file in docker-compose*.yml; do
    if [ -f "$file" ]; then
        sed -i.bak 's/yarn\.lock/bun.lockb/g' "$file"
        rm -f "${file}.bak" 2>/dev/null
    fi
done

echo "✅ All Docker and CI files updated to use Bun!"
echo "📋 Summary of changes:"
echo "   - Updated all Dockerfiles to use oven/bun:latest base image"
echo "   - Updated CI workflows to use oven-sh/setup-bun@v1 action"
echo "   - Replaced all bun commands with bun equivalents"
echo "   - Updated lockfile references from bun.lockb to bun.lockb"