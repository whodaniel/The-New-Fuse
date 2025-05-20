FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* yarn.lock* ./

# Install dependencies
RUN yarn install --frozen-lockfile || npm install

# Copy Prisma schema
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy source files
COPY . .

# Build TypeScript
RUN yarn build || npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Set environment variables
ENV NODE_ENV=production

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Create volume for logs
VOLUME /app/logs

# Run migrations and start the server
CMD npx prisma migrate deploy && node dist/server.js