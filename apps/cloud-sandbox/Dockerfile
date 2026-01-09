FROM mcr.microsoft.com/playwright:v1.40.0-jammy

# Install Node.js 22
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g pnpm

WORKDIR /app

# Copy files (assuming build context is app directory)
COPY package.json ./
COPY tsconfig.json ./
# Force cache bust
RUN echo "CacheBust: V16-${RANDOM}"

COPY src ./src
# Verify code update
RUN grep "LIVE VIEW" src/server.ts
COPY public ./public
# Copy scripts folder which is required by postinstall
COPY scripts ./scripts
COPY start-custom.sh ./start-custom.sh


# Install dependencies
RUN npm install

# Build
RUN npm run build
# Debug build output
RUN echo "=== SRC SERVER.TS ==="
RUN grep "PLAYWRIGHT_BROWSERS_PATH" src/server.ts || true
RUN echo "=== DIST SERVER.JS ==="
RUN cat dist/server.js | grep "LIVE VIEW" || (echo "FAILED TO FIND LIVE VIEW IN DIST" && exit 1)

# Setup user
RUN addgroup --system app-user && adduser --system --ingroup app-user app-user
RUN mkdir -p /home/app-user/pw-browsers && chown -R app-user:app-user /home/app-user
RUN mkdir -p /home/app-user/.npm-cache && chown -R app-user:app-user /home/app-user
RUN mkdir -p /app/pw-browsers && chown -R app-user:app-user /app

USER app-user
ENV HOME=/home/app-user
ENV PLAYWRIGHT_BROWSERS_PATH=/home/app-user/pw-browsers

CMD ["node", "dist/server.js"]
