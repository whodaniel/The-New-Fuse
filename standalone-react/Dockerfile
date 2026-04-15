FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Build the application
COPY . ./
RUN npm run build

# Runner stage
FROM node:20-alpine AS runner

RUN npm install -g serve

WORKDIR /app

# Copy the built dist folder from the builder stage
COPY --from=builder /app/dist ./dist

# Expose port and start server
EXPOSE 3000
CMD ["sh", "-c", "serve ./dist -l tcp://0.0.0.0:${PORT:-3000} -s -n"]
