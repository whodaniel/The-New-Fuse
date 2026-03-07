FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies for UI
COPY ui/package.json ./ui/
RUN npm install -g pnpm && cd ui && pnpm install

# Build UI
COPY ui ./ui
RUN cd ui && pnpm run build

# Server setup
WORKDIR /app
COPY package.json ./
RUN pnpm install

# Copy Server Source
COPY src ./src

# Expose Main Port (3000 by default, overridable by Railway)
ENV PORT=3000
EXPOSE 3000
EXPOSE 8888

# Start the consolidated server
CMD ["node", "src/comprehensive-tnf-relay.js"]
