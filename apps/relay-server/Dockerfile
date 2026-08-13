FROM node:20-alpine

WORKDIR /app

# Copy only server-related files
COPY package.json ./
RUN npm install --legacy-peer-deps

# Copy Server Source
COPY src ./src

# Expose Main Port
ENV PORT=3000
EXPOSE 3000

# Start the consolidated server
CMD ["node", "src/comprehensive-tnf-relay.js"]
