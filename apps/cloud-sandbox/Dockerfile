# Use the official Playwright image which includes all dependencies and Node.js
FROM mcr.microsoft.com/playwright:v1.49.0-jammy

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
ENV PORT=8080
EXPOSE 8080

# Start server
CMD ["node", "dist/server.js"]
